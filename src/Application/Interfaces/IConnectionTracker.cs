namespace Application.Interfaces;

using Application.DTOs;

public interface IConnectionTracker
{
    Task AddConnectionAsync(string connectionId, string username, string chatRoom, CancellationToken cancellationToken = default);
    Task<ConnectedUserDto?> RemoveConnectionAsync(string connectionId, CancellationToken cancellationToken = default);
    Task<ConnectedUserDto?> GetConnectionAsync(string connectionId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> GetUsersInRoomAsync(string chatRoom, CancellationToken cancellationToken = default);
}
