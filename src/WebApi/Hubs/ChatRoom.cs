using Domain.Entities;
using Microsoft.AspNetCore.SignalR; 

namespace WebApi.Hubs;

public class ChatRoom(IDictionary<string, User> connections) : Hub
{

    private readonly IDictionary<string, User> _connections = connections;

    public async Task JoinRoom(User user) // Method to join a chat room
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, user.ChatRoom!);
        _connections[Context.ConnectionId] = user;
        await Clients.Group(user.ChatRoom!)
            .SendAsync("ReceiveMessage", "system", $"{user.Username} has join the Group", DateTime.Now);
        await SendConnectedUser(user.ChatRoom!);
    }
    public async Task SendMessage(string message) // Method to send a message to the chat room
    {
        if (_connections.TryGetValue(Context.ConnectionId, out User user))
        {
            await Clients.Group(user.ChatRoom!)
                .SendAsync("ReceiveMessage", user.Username, message, DateTime.Now);
        }
    }

    public override Task OnDisconnectedAsync(Exception? exp) // Method called when a user disconnects
    {
        if (!_connections.TryGetValue(Context.ConnectionId, out User user))
        {
            return base.OnDisconnectedAsync(exp);
        }

        _connections.Remove(Context.ConnectionId);
        Clients.Group(user.ChatRoom!)
            .SendAsync("ReceiveMessage", "system", $"{user.Username} has left the Group", DateTime.Now);
        SendConnectedUser(user.ChatRoom!);
        return base.OnDisconnectedAsync(exp);
    }
    
    public Task SendConnectedUser(string chatRoom) // Method to send the list of connected users in a chat room
    {
        var users = _connections.Values.
        Where(u => u.ChatRoom == chatRoom)
        .Select(s => s.Username).ToArray();

        return Clients.Group(chatRoom)
            .SendAsync("ConnectedUser", users);
    }
}