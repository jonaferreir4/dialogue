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

        var room = chatRoom.Trim();
        var users = await _connectionTracker.GetUsersInRoomAsync(room);
        var connections = await _connectionTracker.GetConnectionsInRoomAsync(room);

        await Clients.Group(room).SendAsync("ConnectedUser", users.ToArray());
        await Clients.Group(room).SendAsync("ConnectedUsersDetailed", connections.ToArray());
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

    public async Task CallUser(string targetUsername, string sdpOffer)
    {
        if (string.IsNullOrWhiteSpace(targetUsername) || string.IsNullOrWhiteSpace(sdpOffer))
        {
            return;
        }

        var caller = await _connectionTracker.GetConnectionAsync(Context.ConnectionId);
        if (caller is null)
        {
            _logger.LogWarning("CallUser rejeitado: conexão chamadora não encontrada {ConnectionId}", Context.ConnectionId);
            return;
        }

        var target = await _connectionTracker.GetConnectionByUsernameAsync(caller.ChatRoom, targetUsername.Trim());
        if (target is null)
        {
            _logger.LogWarning("CallUser: destinatário {TargetUsername} não encontrado na sala {ChatRoom}", targetUsername, caller.ChatRoom);
            await Clients.Caller.SendAsync("CallUnavailable", targetUsername);
            return;
        }

        _logger.LogInformation("Sinal de chamada: {Caller} -> {Target} (ConnId: {TargetConnId})", caller.Username, target.Username, target.ConnectionId);

        await Clients.Client(target.ConnectionId)
            .SendAsync("ReceiveCallOffer", Context.ConnectionId, caller.Username, sdpOffer);
    }

    public async Task AnswerCall(string callerConnectionId, string sdpAnswer)
    {
        if (string.IsNullOrWhiteSpace(callerConnectionId) || string.IsNullOrWhiteSpace(sdpAnswer))
        {
            return;
        }

        var answerer = await _connectionTracker.GetConnectionAsync(Context.ConnectionId);
        _logger.LogInformation("Chamada atendida por {Answerer} para {CallerConnId}", answerer?.Username, callerConnectionId);

        await Clients.Client(callerConnectionId)
            .SendAsync("ReceiveCallAnswer", Context.ConnectionId, sdpAnswer);
    }

    public async Task SendIceCandidate(string targetConnectionId, string candidateJson)
    {
        if (string.IsNullOrWhiteSpace(targetConnectionId) || string.IsNullOrWhiteSpace(candidateJson))
        {
            return;
        }

        await Clients.Client(targetConnectionId)
            .SendAsync("ReceiveIceCandidate", Context.ConnectionId, candidateJson);
    }

    public async Task RejectCall(string callerConnectionId)
    {
        if (string.IsNullOrWhiteSpace(callerConnectionId))
        {
            return;
        }

        var rejecter = await _connectionTracker.GetConnectionAsync(Context.ConnectionId);
        _logger.LogInformation("Chamada rejeitada por {Rejecter} para {CallerConnId}", rejecter?.Username, callerConnectionId);

        await Clients.Client(callerConnectionId)
            .SendAsync("CallRejected", Context.ConnectionId);
    }

    public async Task HangUp(string targetConnectionId)
    {
        if (string.IsNullOrWhiteSpace(targetConnectionId))
        {
            return;
        }

        await Clients.Client(targetConnectionId)
            .SendAsync("CallEnded", Context.ConnectionId);
    }
}