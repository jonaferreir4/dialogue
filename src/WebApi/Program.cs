using Domain.Entities;
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
builder.Services.AddSingleton<IDictionary<string, User>>(opt =>
        new Dictionary<string, User>());

var app = builder.Build();

app.UseRouting();
app.UseCors("AllowAll");
app.MapHub<ChatRoom>("/chat");

app.Run();
