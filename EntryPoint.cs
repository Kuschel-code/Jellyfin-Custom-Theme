using System;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Branding;
using MediaBrowser.Model.Plugins;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// On startup: regenerates the CSS (applied via branding CustomCss) and registers
    /// the index.html script injection with the File Transformation plugin. The CSS part
    /// works on its own; the script (header button + hero) needs File Transformation.
    /// </summary>
    public class EntryPoint : IHostedService
    {
        // Stable id for our transformation registration.
        private const string TransformationId = "a3b8e7d2-1c4f-4a6b-9e8d-5f2a1b3c4d5e";

        private readonly IConfigurationManager _configManager;
        private readonly ILogger<EntryPoint> _logger;

        public EntryPoint(IConfigurationManager configManager, ILogger<EntryPoint> logger)
        {
            _configManager = configManager;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            ApplyCss();
            RegisterFileTransformation();

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

        /// <summary>
        /// Registers an index.html transformation with the File Transformation plugin
        /// (IAmParadox27/jellyfin-plugin-file-transformation) via reflection — plugins
        /// load in separate contexts, so it cannot be referenced directly.
        /// </summary>
        private void RegisterFileTransformation()
        {
            try
            {
                var ftAssembly = AssemblyLoadContext.All
                    .SelectMany(c => c.Assemblies)
                    .FirstOrDefault(a => a.FullName?.Contains(".FileTransformation", StringComparison.Ordinal) == true);

                if (ftAssembly is null)
                {
                    _logger.LogWarning(
                        "[Custom Theme] File Transformation plugin not found. The CSS theme still works, but the header settings button and hero banner need it. Install it from https://www.iamparadox.dev/jellyfin/plugins/manifest.json and restart.");
                    return;
                }

                var pluginInterface = ftAssembly.GetType("Jellyfin.Plugin.FileTransformation.PluginInterface");
                var register = pluginInterface?.GetMethod("RegisterTransformation");
                if (register is null)
                {
                    _logger.LogWarning("[Custom Theme] File Transformation found but RegisterTransformation is missing (incompatible version?)");
                    return;
                }

                // Build the registration payload as a JObject created from the *same*
                // Newtonsoft.Json instance File Transformation uses, to keep type identity.
                var ftContext = AssemblyLoadContext.GetLoadContext(ftAssembly);
                var newtonsoft = (ftContext?.Assemblies ?? Enumerable.Empty<Assembly>())
                    .Concat(AssemblyLoadContext.All.SelectMany(c => c.Assemblies))
                    .FirstOrDefault(a => string.Equals(a.GetName().Name, "Newtonsoft.Json", StringComparison.Ordinal));

                var jobjectType = newtonsoft?.GetType("Newtonsoft.Json.Linq.JObject");
                var parse = jobjectType?.GetMethod("Parse", new[] { typeof(string) });
                if (parse is null)
                {
                    _logger.LogWarning("[Custom Theme] Could not locate Newtonsoft.Json.Linq.JObject for the File Transformation payload");
                    return;
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
                _logger.LogInformation("[Custom Theme] Registered index.html injection with File Transformation");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to register with File Transformation");
            }
        }
    }
}
