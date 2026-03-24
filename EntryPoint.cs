using System;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Branding;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// Hosted service that injects CSS into branding config on server startup.
    /// Registered via ServiceRegistrator so Jellyfin's DI actually starts it.
    /// </summary>
    public class EntryPoint : IHostedService, IDisposable
    {
        private readonly IConfigurationManager _configManager;
        private readonly ILogger<EntryPoint> _logger;

        public EntryPoint(
            IConfigurationManager configManager,
            ILogger<EntryPoint> logger)
        {
            _configManager = configManager;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            InjectCss();
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
                    _logger.LogWarning("[Custom Theme] CSS resource '{Resource}' not found. Available: {Resources}",
                        resourceName,
                        string.Join(", ", assembly.GetManifestResourceNames()));
                    return;
                }

                using var reader = new StreamReader(stream);
                var css = reader.ReadToEnd();

                var brandingConfig = _configManager.GetConfiguration<BrandingOptions>("branding");
                brandingConfig.CustomCss = css;
                _configManager.SaveConfiguration("branding", brandingConfig);
                _logger.LogInformation("[Custom Theme] CSS injected via EntryPoint ({Length} bytes)", css.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to inject CSS");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            GC.SuppressFinalize(this);
        }
    }
}
