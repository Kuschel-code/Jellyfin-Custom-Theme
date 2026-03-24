using System;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller;
using MediaBrowser.Model.Branding;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.NetflixSkin
{
    /// <summary>
    /// Automatically injects CSS (via Branding config) and JS (via index.html script tag) at startup.
    /// Install the plugin and everything works — no manual steps needed.
    /// </summary>
    public class SkinInjector : IHostedService
    {
        private readonly IServerApplicationPaths _appPaths;
        private readonly IConfigurationManager _configManager;
        private readonly ILogger<SkinInjector> _logger;
        private const string ScriptTag = "<script src=\"/web/configurationpage?name=netflix-js\"></script>";
        private const string Marker = "<!-- Netflix Skin -->";
        private const string CssMarker = "/* === JELLYFIN CUSTOM THEME === */";

        public SkinInjector(
            IServerApplicationPaths appPaths,
            IConfigurationManager configManager,
            ILogger<SkinInjector> logger)
        {
            _appPaths = appPaths;
            _configManager = configManager;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            InjectCss();
            InjectScript();
            return Task.CompletedTask;
        }

        /// <summary>
        /// Reads the embedded netflix.css and sets it as Custom CSS in Jellyfin's Branding config.
        /// Also appends a JS loader snippet that loads the settings module from the plugin endpoint.
        /// </summary>
        private void InjectCss()
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                var resourceName = "Jellyfin.Plugin.NetflixSkin.netflix.css";

                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream == null)
                {
                    _logger.LogWarning("[Custom Theme] CSS resource not found: {Resource}", resourceName);
                    return;
                }

                using var reader = new StreamReader(stream);
                var css = CssMarker + "\n" + reader.ReadToEnd();

                var brandingConfig = _configManager.GetConfiguration<BrandingOptions>("branding");

                // Always replace entire Custom CSS with latest theme
                brandingConfig.CustomCss = css;
                _configManager.SaveConfiguration("branding", brandingConfig);
                _logger.LogInformation("[Custom Theme] CSS replaced in branding config ({Length} bytes)", css.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to inject CSS");
            }
        }

        /// <summary>
        /// Injects a script tag into index.html to load the settings JS module.
        /// </summary>
        private void InjectScript()
        {
            try
            {
                var webPath = _appPaths.WebPath;
                if (string.IsNullOrEmpty(webPath))
                {
                    _logger.LogWarning("[Custom Theme] WebPath is empty, cannot inject script");
                    return;
                }

                var indexPath = Path.Combine(webPath, "index.html");
                if (!File.Exists(indexPath))
                {
                    _logger.LogWarning("[Custom Theme] index.html not found at {Path}", indexPath);
                    return;
                }

                var html = File.ReadAllText(indexPath);

                if (html.Contains(Marker))
                {
                    _logger.LogInformation("[Custom Theme] Script already injected in index.html");
                    return;
                }

                var injection = $"\n    {Marker}\n    {ScriptTag}\n";
                html = html.Replace("</body>", injection + "</body>");

                File.WriteAllText(indexPath, html);
                _logger.LogInformation("[Custom Theme] Script tag injected into index.html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to inject script");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            // Remove script tag from index.html on shutdown (clean uninstall)
            try
            {
                var webPath = _appPaths.WebPath;
                if (string.IsNullOrEmpty(webPath)) return Task.CompletedTask;

                var indexPath = Path.Combine(webPath, "index.html");
                if (!File.Exists(indexPath)) return Task.CompletedTask;

                var html = File.ReadAllText(indexPath);
                if (html.Contains(Marker))
                {
                    html = html.Replace($"\n    {Marker}\n    {ScriptTag}\n", "");
                    File.WriteAllText(indexPath, html);
                    _logger.LogInformation("[Custom Theme] Script removed from index.html");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to remove script");
            }

            return Task.CompletedTask;
        }
    }
}
