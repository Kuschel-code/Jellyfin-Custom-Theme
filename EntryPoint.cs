using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller;
using MediaBrowser.Model.Branding;
using MediaBrowser.Model.Plugins;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// On startup: applies the generated CSS (via branding CustomCss) and makes the
    /// header/hero script load. Script injection is self-contained — it writes the
    /// script into index.html on disk. If the optional File Transformation plugin is
    /// present, that cleaner runtime method is used instead (e.g. for read-only installs).
    /// </summary>
    public class EntryPoint : IHostedService
    {
        private const string TransformationId = "a3b8e7d2-1c4f-4a6b-9e8d-5f2a1b3c4d5e";

        private readonly IConfigurationManager _configManager;
        private readonly IServerApplicationHost _appHost;
        private readonly ILogger<EntryPoint> _logger;

        public EntryPoint(IConfigurationManager configManager, IServerApplicationHost appHost, ILogger<EntryPoint> logger)
        {
            _configManager = configManager;
            _appHost = appHost;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            ApplyCss();

            // Resolve index.html once so the middleware can serve it directly (read + inject
            // in memory) — the self-contained path that works on read-only Docker web roots.
            IndexInjectionMiddleware.WebIndexHtmlPath = FindIndexHtml();

            // Touch the bundled File Transformation provider so its assembly is loaded into
            // our plugin context and other plugins (e.g. the Media Bar) can discover it and
            // register their index.html transformations — no separate File Transformation
            // plugin required.
            try
            {
                if (Plugin.Instance?.Configuration?.ProvideFileTransformation ?? true)
                {
                    var count = Jellyfin.Plugin.FileTransformation.PluginInterface.GetRegistrations().Count;
                    _logger.LogInformation("[Custom Theme] Bundled File Transformation provider active ({Count} registrations); other plugins can inject without the separate File Transformation plugin.", count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Custom Theme] Could not initialise the bundled File Transformation provider");
            }

            // Injection strategy, most reliable first:
            //  1. The real File Transformation plugin (Harmony file-provider hook) is the only
            //     mechanism that reliably injects on read-only web dirs (e.g. some Docker), where
            //     neither response-interception middleware nor on-disk writes work. If it's
            //     installed, register our script with it.
            //  2. Otherwise use our built-in middleware AND write the script into index.html on
            //     disk as a belt-and-suspenders. The marker dedupes, so it is never doubled; the
            //     on-disk copy covers setups where the middleware's response capture is bypassed
            //     (SendFileAsync, caches, iPad Safari, ...).
            var ownInjection = Plugin.Instance?.Configuration?.OwnInjection ?? true;
            if (RegisterFileTransformation())
            {
                _logger.LogInformation("[Custom Theme] Injecting via the File Transformation plugin (most reliable, works on read-only web dirs).");
                WriteIndexHtml(inject: false);
            }
            else if (ownInjection)
            {
                _logger.LogInformation("[Custom Theme] No File Transformation plugin found; using the built-in middleware plus on-disk injection.");
                WriteIndexHtml(inject: true);
            }
            else
            {
                WriteIndexHtml(inject: true);
            }

            if (Plugin.Instance is not null)
            {
                Plugin.Instance.ConfigurationChanged += OnConfigurationChanged;
            }

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            if (Plugin.Instance is not null)
            {
                Plugin.Instance.ConfigurationChanged -= OnConfigurationChanged;
            }

            return Task.CompletedTask;
        }

        private void OnConfigurationChanged(object? sender, BasePluginConfiguration e)
        {
            _logger.LogInformation("[Custom Theme] Settings saved, regenerating CSS");
            ApplyCss();
        }

        private void ApplyCss()
        {
            try
            {
                var plugin = Plugin.Instance;
                if (plugin is null)
                {
                    _logger.LogWarning("[Custom Theme] Plugin instance not available");
                    return;
                }

                var css = CssGenerator.Generate(plugin.Configuration);
                if (string.IsNullOrEmpty(css))
                {
                    _logger.LogWarning("[Custom Theme] Generated CSS is empty; base stylesheet missing?");
                    return;
                }

                var branding = _configManager.GetConfiguration<BrandingOptions>("branding");
                branding.CustomCss = css;
                _configManager.SaveConfiguration("branding", branding);
                _logger.LogInformation("[Custom Theme] CSS applied ({Length} bytes)", css.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to apply CSS");
            }
        }

        // ---- Script injection: self-contained on-disk write ----

        /// <summary>
        /// Normalises index.html on disk: strips any previously injected script (ours or
        /// from older versions) and, when <paramref name="inject"/> is true, injects exactly
        /// one fresh copy. When false it only cleans (used when File Transformation handles
        /// injection at serve time, to avoid a doubled script).
        /// </summary>
        private void WriteIndexHtml(bool inject)
        {
            try
            {
                var indexPath = FindIndexHtml();
                if (indexPath is null)
                {
                    if (inject)
                    {
                        _logger.LogWarning("[Custom Theme] Could not locate index.html; header button/hero will not load. CSS theme still works.");
                    }

                    return;
                }

                var html = File.ReadAllText(indexPath);
                var cleaned = ThemeTransformation.StripInjected(html);
                var result = inject ? ThemeTransformation.InjectInto(cleaned) : cleaned;

                if (result == html)
                {
                    return; // nothing changed
                }

                File.WriteAllText(indexPath, result);
                _logger.LogInformation(inject
                    ? "[Custom Theme] Injected script into {Path}"
                    : "[Custom Theme] Removed stale on-disk script from {Path}", indexPath);
            }
            catch (Exception ex)
            {
                if (inject)
                {
                    _logger.LogWarning(ex, "[Custom Theme] Could not write to index.html (read-only filesystem?). For read-only/Docker installs, install the File Transformation plugin. CSS theme still works.");
                }
            }
        }

        private string? FindIndexHtml()
        {
            // Reflection on the app host first (most accurate), then common install paths.
            var webPath = _appHost.GetType().GetProperty("WebPath")?.GetValue(_appHost) as string;
            var candidates = new[]
            {
                webPath,
                "/jellyfin/jellyfin-web",
                "/usr/share/jellyfin/web",
                "/usr/lib/jellyfin/web",
                "/app/jellyfin/jellyfin-web"
            };

            foreach (var dir in candidates)
            {
                if (string.IsNullOrEmpty(dir))
                {
                    continue;
                }

                var path = Path.Combine(dir, "index.html");
                if (File.Exists(path))
                {
                    return path;
                }
            }

            return null;
        }

        // ---- Script injection: optional File Transformation plugin (clean, runtime) ----

        /// <summary>Returns true if registration with the File Transformation plugin succeeded.</summary>
        private bool RegisterFileTransformation()
        {
            try
            {
                // Find the REAL File Transformation plugin — never our own bundled provider
                // (CustomTheme.FileTransformation), which would just loop back into our middleware.
                var ftAssembly = AssemblyLoadContext.All
                    .SelectMany(c => c.Assemblies)
                    .FirstOrDefault(a =>
                    {
                        var name = a.GetName().Name;
                        return name is not null
                            && name.Contains("FileTransformation", StringComparison.Ordinal)
                            && !name.Equals("CustomTheme.FileTransformation", StringComparison.Ordinal);
                    });

                if (ftAssembly is null)
                {
                    return false;
                }

                var pluginInterface = ftAssembly.GetType("Jellyfin.Plugin.FileTransformation.PluginInterface");
                var register = pluginInterface?.GetMethod("RegisterTransformation");
                if (register is null)
                {
                    return false;
                }

                var ftContext = AssemblyLoadContext.GetLoadContext(ftAssembly);
                var newtonsoft = (ftContext?.Assemblies ?? Enumerable.Empty<Assembly>())
                    .Concat(AssemblyLoadContext.All.SelectMany(c => c.Assemblies))
                    .FirstOrDefault(a => string.Equals(a.GetName().Name, "Newtonsoft.Json", StringComparison.Ordinal));

                var jobjectType = newtonsoft?.GetType("Newtonsoft.Json.Linq.JObject");
                var parse = jobjectType?.GetMethod("Parse", new[] { typeof(string) });
                if (parse is null)
                {
                    return false;
                }

                var payloadJson = JsonSerializer.Serialize(new
                {
                    id = TransformationId,
                    fileNamePattern = "index.html",
                    callbackAssembly = typeof(ThemeTransformation).Assembly.FullName,
                    callbackClass = typeof(ThemeTransformation).FullName,
                    callbackMethod = nameof(ThemeTransformation.IndexHtml)
                });

                var payload = parse.Invoke(null, new object[] { payloadJson });
                register.Invoke(null, new[] { payload });
                _logger.LogInformation("[Custom Theme] Registered index.html injection with the File Transformation plugin");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Custom Theme] File Transformation registration failed; using on-disk injection instead");
                return false;
            }
        }
    }
}
