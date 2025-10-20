using WebApi.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalRCore();

var app = builder.Build();

app.MapHub<ChatRoom>("/chat");

app.Run();
