using System;
using System.Collections.Generic;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.NetflixSkin
{
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
    {
        public override string Name => "Netflix Skin";

        public override Guid Id => Guid.Parse("78b7b285-8d9e-4e4c-8e4d-7a71f76d4e2a");

        public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
            : base(applicationPaths, xmlSerializer)
        {
            Instance = this;
        }

        public static Plugin? Instance { get; private set; }

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "netflix-css",
                    EmbeddedResourcePath = GetType().Namespace + ".netflix.css",
                    EnableInMainMenu = false,
                    MenuSection = "Skin",
                    MenuIcon = "style"
                },
                new PluginPageInfo
                {
                    Name = "netflix-js",
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
