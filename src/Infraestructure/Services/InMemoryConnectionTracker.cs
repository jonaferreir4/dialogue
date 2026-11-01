using System.Collections.Concurrent;
using Application.DTOs;
using Application.Interfaces;

namespace Infraestructure.Services;

public class InMemoryConnectionTracker : IConnectionTracker
{
    private readonly ConcurrentDictionary<string, ConnectedUserDto> _connections = new();

    public Task AddConnectionAsync(string connectionId, string username, string chatRoom, CancellationToken cancellationToken = default)
    {
        var userDto = new ConnectedUserDto(connectionId, username, chatRoom, DateTime.UtcNow);
        _connections[connectionId] = userDto;
        return Task.CompletedTask;
    }

    public Task<ConnectedUserDto?> RemoveConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        _connections.TryRemove(connectionId, out var removed);
        return Task.FromResult(removed);
    }

    public Task<ConnectedUserDto?> GetConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        _connections.TryGetValue(connectionId, out var user);
        return Task.FromResult(user);
    }

    public Task<IReadOnlyList<string>> GetUsersInRoomAsync(string chatRoom, CancellationToken cancellationToken = default)
    {
        var users = _connections.Values
            .Where(u => string.Equals(u.ChatRoom, chatRoom, StringComparison.OrdinalIgnoreCase))
            .Select(u => u.Username)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return Task.FromResult<IReadOnlyList<string>>(users);
    }
}
