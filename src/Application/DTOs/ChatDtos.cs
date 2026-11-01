namespace Application.DTOs;

public record JoinRoomRequest(string Username, string ChatRoom);
public record SendMessageRequest(string Message);
public record ChatMessageDto(Guid Id, string Sender, string Message, DateTime TimestampUtc, bool IsSystem = false);
public record ConnectedUserDto(string ConnectionId, string Username, string ChatRoom, DateTime ConnectedAtUtc);
