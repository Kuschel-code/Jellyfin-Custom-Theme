using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Controller;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.NetflixSkin
{
    /// <summary>
    /// Injects the Netflix Skin script tag into Jellyfin's index.html at startup.
    /// </summary>
    public class ScriptInjector : IHostedService
    {
        private readonly IServerApplicationPaths _appPaths;
        private readonly ILogger<ScriptInjector> _logger;
        private const string ScriptTag = "<script src=\"/web/configurationpage?name=netflix-js\"></script>";
        private const string Marker = "<!-- Netflix Skin -->";

        public ScriptInjector(IServerApplicationPaths appPaths, ILogger<ScriptInjector> logger)
        {
            _appPaths = appPaths;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                var webPath = _appPaths.WebPath;
                if (string.IsNullOrEmpty(webPath))
                {
                    _logger.LogWarning("[Netflix Skin] WebPath is empty, cannot inject script");
                    return Task.CompletedTask;
                }

                var indexPath = Path.Combine(webPath, "index.html");
                if (!File.Exists(indexPath))
                {
                    _logger.LogWarning("[Netflix Skin] index.html not found at {Path}", indexPath);
                    return Task.CompletedTask;
                }

                var html = File.ReadAllText(indexPath);

                // Already injected
                if (html.Contains(Marker))
                {
                    _logger.LogInformation("[Netflix Skin] Script already injected");
                    return Task.CompletedTask;
                }

                // Inject before </body>
                var injection = $"\n    {Marker}\n    {ScriptTag}\n";
                html = html.Replace("</body>", injection + "</body>");

                File.WriteAllText(indexPath, html);
                _logger.LogInformation("[Netflix Skin] Script injected into index.html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Netflix Skin] Failed to inject script");
            }

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            // Optionally remove the injected script on shutdown
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
                    _logger.LogInformation("[Netflix Skin] Script removed from index.html");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Netflix Skin] Failed to remove script");
            }

            return Task.CompletedTask;
        }
    }
}
