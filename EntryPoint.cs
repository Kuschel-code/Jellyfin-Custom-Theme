using System;
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
    /// Keeps Jellyfin's branding CustomCss in sync with the plugin configuration:
    /// generates the stylesheet on startup and again whenever the settings are saved.
    /// Script injection for the optional header button is handled separately by
    /// <see cref="ScriptInjectionStartup"/>; this service never touches files on disk.
    /// </summary>
    public class EntryPoint : IHostedService
    {
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
    }
}
