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
    public class EntryPoint : IHostedService, IDisposable
    {
        private readonly IConfigurationManager _configManager;
        private readonly IServerApplicationPaths _appPaths;
        private readonly ILogger<EntryPoint> _logger;
        private const string ScriptTag = "<script src=\"/web/configurationpage?name=custom-theme-js\"></script>";
        private const string Marker = "<!-- Custom Theme -->";

        public EntryPoint(
            IConfigurationManager configManager,
            IServerApplicationPaths appPaths,
            ILogger<EntryPoint> logger)
        {
            _configManager = configManager;
            _appPaths = appPaths;
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
                    _logger.LogWarning("[Custom Theme] CSS resource not found");
                    return;
                }

                using var reader = new StreamReader(stream);
                // Remove the broken HTML loader from CSS (clean CSS only)
                var css = reader.ReadToEnd();
                var loaderStart = css.IndexOf("/* === JS LOADER === */");
                if (loaderStart > 0)
                {
                    css = css.Substring(0, loaderStart).TrimEnd();
                }

                var brandingConfig = _configManager.GetConfiguration<BrandingOptions>("branding");
                brandingConfig.CustomCss = css;
                _configManager.SaveConfiguration("branding", brandingConfig);
                _logger.LogInformation("[Custom Theme] CSS injected ({Length} bytes)", css.Length);
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
                if (html.Contains(Marker))
                {
                    _logger.LogInformation("[Custom Theme] Script already in index.html");
                    return;
                }

                html = html.Replace("</body>", $"\n    {Marker}\n    {ScriptTag}\n</body>");
                File.WriteAllText(indexPath, html);
                _logger.LogInformation("[Custom Theme] Script injected into index.html");
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogWarning("[Custom Theme] index.html is read-only (Docker). JS settings panel won't auto-load. To fix: mount /jellyfin/jellyfin-web as writable volume, or load JS manually via browser console: var s=document.createElement('script');s.src='/web/configurationpage?name=custom-theme-js';document.head.appendChild(s);");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to inject script");
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

        public void Dispose()
        {
            GC.SuppressFinalize(this);
        }
    }
}
