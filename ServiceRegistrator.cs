using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// Registers plugin services with Jellyfin's DI container.
    /// </summary>
    public class ServiceRegistrator : IPluginServiceRegistrator
    {
        public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
        {
            serviceCollection.AddHostedService<EntryPoint>();
            serviceCollection.AddTransient<IStartupFilter, ScriptInjectionStartup>();
        }
    }
}
