using System;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Branding;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.CustomTheme
{
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
            // Generate CSS on startup
            ApplyCss();

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

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _configManager.NamedConfigurationUpdated -= OnConfigUpdated;
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _configManager.NamedConfigurationUpdated -= OnConfigUpdated;
            GC.SuppressFinalize(this);
        }
    }
}
