using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace WebApi.Hubs;

public class ChatRoom(IConnectionTracker connectionTracker, ILogger<ChatRoom> logger) : Hub
{
    private readonly IConnectionTracker _connectionTracker = connectionTracker;
    private readonly ILogger<ChatRoom> _logger = logger;

    public async Task JoinRoom(JoinRoomRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.ChatRoom))
        {
            _logger.LogWarning("Tentativa de JoinRoom com dados inválidos da conexão {ConnectionId}", Context.ConnectionId);
            return;
        }

        var username = request.Username.Trim();
        var chatRoom = request.ChatRoom.Trim();

        await Groups.AddToGroupAsync(Context.ConnectionId, chatRoom);
        await _connectionTracker.AddConnectionAsync(Context.ConnectionId, username, chatRoom);

        var timestamp = DateTime.UtcNow;
        var messageId = Guid.NewGuid();

        await Clients.Group(chatRoom)
            .SendAsync("ReceiveMessage", "system", $"{username} has joined the room", timestamp, messageId);

        await SendConnectedUser(chatRoom);

        _logger.LogInformation("Usuário {Username} entrou na sala {ChatRoom} (Conexão: {ConnectionId})", username, chatRoom, Context.ConnectionId);
    }

    public async Task SendMessage(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return;
        }

        var sanitizedMessage = message.Length > 2000 ? message[..2000] : message;
        var user = await _connectionTracker.GetConnectionAsync(Context.ConnectionId);

        if (user is not null)
        {
            var timestamp = DateTime.UtcNow;
            var messageId = Guid.NewGuid();

            await Clients.Group(user.ChatRoom)
                .SendAsync("ReceiveMessage", user.Username, sanitizedMessage, timestamp, messageId);

            _logger.LogDebug("Mensagem enviada por {Username} na sala {ChatRoom}", user.Username, user.ChatRoom);
        }
        else
        {
            _logger.LogWarning("Tentativa de envio de mensagem de conexão não associada a usuário: {ConnectionId}", Context.ConnectionId);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception is not null)
        {
            _logger.LogError(exception, "Desconexão com erro para a conexão {ConnectionId}", Context.ConnectionId);
        }

        var user = await _connectionTracker.RemoveConnectionAsync(Context.ConnectionId);
        if (user is not null)
        {
            var timestamp = DateTime.UtcNow;
            var messageId = Guid.NewGuid();

            await Clients.Group(user.ChatRoom)
                .SendAsync("ReceiveMessage", "system", $"{user.Username} has left the room", timestamp, messageId);

            await SendConnectedUser(user.ChatRoom);
            _logger.LogInformation("Usuário {Username} desconectou-se da sala {ChatRoom}", user.Username, user.ChatRoom);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendConnectedUser(string chatRoom)
    {
        if (string.IsNullOrWhiteSpace(chatRoom))
        {
            return;
        }

        var users = await _connectionTracker.GetUsersInRoomAsync(chatRoom.Trim());
        await Clients.Group(chatRoom.Trim())
            .SendAsync("ConnectedUser", users.ToArray());
    }

    public async Task StartTyping(string chatRoom, string username)
    {
        if (string.IsNullOrWhiteSpace(chatRoom) || string.IsNullOrWhiteSpace(username))
        {
            return;
        }

        await Clients.OthersInGroup(chatRoom.Trim()).SendAsync("UserTyping", username.Trim());
    }

    public async Task StopTyping(string chatRoom, string username)
    {
        if (string.IsNullOrWhiteSpace(chatRoom) || string.IsNullOrWhiteSpace(username))
        {
            return;
        }

        await Clients.OthersInGroup(chatRoom.Trim()).SendAsync("UserStopTyping", username.Trim());
    }
}