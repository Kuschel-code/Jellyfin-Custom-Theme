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

namespace Jellyfin.Plugin.CustomTheme
{
    public class SkinInjector : IHostedService
    {
        private readonly IServerApplicationPaths _appPaths;
        private readonly IConfigurationManager _configManager;
        private readonly ILogger<SkinInjector> _logger;
        private const string ScriptTag = "<script src=\"/web/configurationpage?name=custom-theme-js\"></script>";
        private const string Marker = "<!-- Custom Theme -->";

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

        private void InjectCss()
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                var resourceName = "Jellyfin.Plugin.CustomTheme.netflix.css";

                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream == null)
                {
                    _logger.LogWarning("[Custom Theme] CSS resource not found: {Resource}", resourceName);
                    return;
                }

                using var reader = new StreamReader(stream);
                var css = reader.ReadToEnd();

                var brandingConfig = _configManager.GetConfiguration<BrandingOptions>("branding");
                brandingConfig.CustomCss = css;
                _configManager.SaveConfiguration("branding", brandingConfig);
                _logger.LogInformation("[Custom Theme] CSS set ({Length} bytes)", css.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to inject CSS");
            }
        }

        private void InjectScript()
        {
            try
            {
                var webPath = _appPaths.WebPath;
                if (string.IsNullOrEmpty(webPath)) return;

                var indexPath = Path.Combine(webPath, "index.html");
                if (!File.Exists(indexPath)) return;

                var html = File.ReadAllText(indexPath);
                if (html.Contains(Marker)) return;

                html = html.Replace("</body>", $"\n    {Marker}\n    {ScriptTag}\n</body>");
                File.WriteAllText(indexPath, html);
                _logger.LogInformation("[Custom Theme] Script injected into index.html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Script injection failed (read-only fs?), CSS loader in stylesheet will handle it");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
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
                }
            }
            catch { /* ignore cleanup errors */ }
            return Task.CompletedTask;
        }
    }
}
