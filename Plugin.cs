using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Branding;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.CustomTheme
{
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
    {
        private readonly ILogger<Plugin> _logger;

        public override string Name => "Custom Theme";

        public override Guid Id => Guid.Parse("78b7b285-8d9e-4e4c-8e4d-7a71f76d4e2a");

        public Plugin(
            IApplicationPaths applicationPaths,
            IXmlSerializer xmlSerializer,
            IConfigurationManager configManager,
            ILogger<Plugin> logger)
            : base(applicationPaths, xmlSerializer)
        {
            Instance = this;
            _logger = logger;

            // Inject CSS into branding config immediately on plugin load
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

                var brandingConfig = configManager.GetConfiguration<BrandingOptions>("branding");
                brandingConfig.CustomCss = css;
                configManager.SaveConfiguration("branding", brandingConfig);
                _logger.LogInformation("[Custom Theme] CSS injected ({Length} bytes)", css.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Custom Theme] Failed to inject CSS");
            }
        }

        public static Plugin? Instance { get; private set; }

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "custom-theme-css",
                    EmbeddedResourcePath = GetType().Namespace + ".netflix.css",
                    EnableInMainMenu = false
                },
                new PluginPageInfo
                {
                    Name = "custom-theme-js",
                    EmbeddedResourcePath = GetType().Namespace + ".netflix.js",
                    EnableInMainMenu = false
                }
            };
        }
    }

    public class PluginConfiguration : BasePluginConfiguration
    {
    }
}
