using Domain.Entities;
using WebApi.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalRCore();
builder.Services.AddSingleton<IDictionary<string, User>>(opt =>
        new Dictionary<string, User>());

var app = builder.Build();


app.MapHub<ChatRoom>("/chat");

app.Run();
