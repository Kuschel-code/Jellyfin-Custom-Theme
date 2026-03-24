using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// Registers plugin services with Jellyfin's DI container.
    /// Jellyfin discovers this via IPluginServiceRegistrator and calls RegisterServices
    /// before the container is built, ensuring our hosted service actually runs.
    /// </summary>
    public class ServiceRegistrator : IPluginServiceRegistrator
    {
        public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
        {
            serviceCollection.AddHostedService<EntryPoint>();
        }
    }
}
