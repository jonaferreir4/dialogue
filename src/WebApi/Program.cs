using Infraestructure;
using WebApi.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyMethod()
              .AllowAnyHeader()
              .SetIsOriginAllowed(_ => true)
              .AllowCredentials());
});

builder.Services.AddSignalR();
builder.Services.AddInfrastructureServices();

var app = builder.Build();

app.UseRouting();
app.UseCors("AllowAll");

app.MapGet("/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));
app.MapHub<ChatRoom>("/chat");

app.Run();
