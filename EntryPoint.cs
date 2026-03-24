using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller;
using MediaBrowser.Model.Branding;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.CustomTheme
{
    public class EntryPoint : IHostedService, IDisposable
    {
        private readonly IConfigurationManager _configManager;
        private readonly IServerApplicationHost _appHost;
        private readonly ILogger<EntryPoint> _logger;
        private const string ScriptMarker = "<!-- Custom Theme -->";
        private const string ScriptTag = "<script src=\"/web/configurationpage?name=custom-theme-headerjs\"></script>";

        public EntryPoint(
            IConfigurationManager configManager,
            IServerApplicationHost appHost,
            ILogger<EntryPoint> logger)
        {
            _configManager = configManager;
            _appHost = appHost;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            // Generate CSS on startup
            ApplyCss();

            // Inject script tag into index.html for header button
            InjectScript();

            // Listen for config changes (when user saves settings in Dashboard)
            _configManager.NamedConfigurationUpdated += OnConfigUpdated;

            return Task.CompletedTask;
        }

        private void OnConfigUpdated(object? sender, ConfigurationUpdateEventArgs e)
        {
            // When plugin config is saved, regenerate CSS
            if (string.Equals(e.Key, "Jellyfin.Plugin.CustomTheme", StringComparison.OrdinalIgnoreCase)
                || string.Equals(e.Key, Plugin.Instance?.Id.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("[Custom Theme] Config changed, regenerating CSS...");
                ApplyCss();
            }
        }

        private void ApplyCss()
        {
            try
            {
                var plugin = Plugin.Instance;
                if (plugin == null)
                {
                    _logger.LogWarning("[Custom Theme] Plugin instance not available");
                    return;
                }

                var config = plugin.Configuration;
                var css = CssGenerator.Generate(config);

                if (string.IsNullOrEmpty(css))
                {
                    _logger.LogWarning("[Custom Theme] Generated CSS is empty");
                    return;
                }

                var brandingConfig = _configManager.GetConfiguration<BrandingOptions>("branding");
                brandingConfig.CustomCss = css;
                _configManager.SaveConfiguration("branding", brandingConfig);
                _logger.LogInformation("[Custom Theme] CSS applied ({Length} bytes)", css.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to apply CSS");
            }
        }

        private void InjectScript()
        {
            try
            {
                var webPath = _appHost.GetType().GetProperty("WebPath")?.GetValue(_appHost) as string;
                if (string.IsNullOrEmpty(webPath))
                {
                    _logger.LogWarning("[Custom Theme] WebPath not found, trying common paths");
                    var candidates = new[] { "/jellyfin/jellyfin-web/index.html", "/usr/share/jellyfin/web/index.html" };
                    foreach (var c in candidates)
                    {
                        if (File.Exists(c)) { webPath = Path.GetDirectoryName(c); break; }
                    }
                }

                if (string.IsNullOrEmpty(webPath))
                {
                    _logger.LogWarning("[Custom Theme] Cannot find web path for script injection");
                    return;
                }

                var indexPath = Path.Combine(webPath, "index.html");
                if (!File.Exists(indexPath))
                {
                    _logger.LogWarning("[Custom Theme] index.html not found at {Path}", indexPath);
                    return;
                }

                var html = File.ReadAllText(indexPath);
                if (html.Contains(ScriptMarker))
                {
                    _logger.LogInformation("[Custom Theme] Script already injected");
                    return;
                }

                html = html.Replace("</body>", $"{ScriptMarker}\n{ScriptTag}\n</body>");
                File.WriteAllText(indexPath, html);
                _logger.LogInformation("[Custom Theme] Script injected into index.html");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Custom Theme] Could not inject script (read-only filesystem?). Header button won't appear, but theme CSS still works.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _configManager.NamedConfigurationUpdated -= OnConfigUpdated;
            RemoveScript();
            return Task.CompletedTask;
        }

        private void RemoveScript()
        {
            try
            {
                var webPath = _appHost.GetType().GetProperty("WebPath")?.GetValue(_appHost) as string;
                if (string.IsNullOrEmpty(webPath)) return;
                var indexPath = Path.Combine(webPath, "index.html");
                if (!File.Exists(indexPath)) return;
                var html = File.ReadAllText(indexPath);
                if (!html.Contains(ScriptMarker)) return;
                html = html.Replace($"{ScriptMarker}\n{ScriptTag}\n", "");
                File.WriteAllText(indexPath, html);
                _logger.LogInformation("[Custom Theme] Script removed from index.html");
            }
            catch { /* Ignore cleanup errors */ }
        }

        public void Dispose()
        {
            _configManager.NamedConfigurationUpdated -= OnConfigUpdated;
            GC.SuppressFinalize(this);
        }
    }
}
