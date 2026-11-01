using Application.Interfaces;
using Infraestructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Infraestructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddSingleton<IConnectionTracker, InMemoryConnectionTracker>();
        return services;
    }
}
