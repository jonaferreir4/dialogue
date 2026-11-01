using FluentAssertions;
using Infraestructure.Services;
using Xunit;

namespace Tests;

public class InMemoryConnectionTrackerTests
{
    private readonly InMemoryConnectionTracker _tracker = new();

    [Fact]
    public async Task AddConnectionAsync_ShouldStoreConnectionSuccessfully()
    {
        // Arrange
        var connectionId = "conn-1";
        var username = "Alice";
        var room = "general";

        // Act
        await _tracker.AddConnectionAsync(connectionId, username, room);
        var connection = await _tracker.GetConnectionAsync(connectionId);
        var users = await _tracker.GetUsersInRoomAsync(room);

        // Assert
        connection.Should().NotBeNull();
        connection!.Username.Should().Be("Alice");
        connection.ChatRoom.Should().Be("general");
        users.Should().ContainSingle().Which.Should().Be("Alice");
    }

    [Fact]
    public async Task RemoveConnectionAsync_ShouldRemoveAndReturnUser()
    {
        // Arrange
        var connectionId = "conn-2";
        await _tracker.AddConnectionAsync(connectionId, "Bob", "tech");

        // Act
        var removed = await _tracker.RemoveConnectionAsync(connectionId);
        var connectionAfter = await _tracker.GetConnectionAsync(connectionId);
        var users = await _tracker.GetUsersInRoomAsync("tech");

        // Assert
        removed.Should().NotBeNull();
        removed!.Username.Should().Be("Bob");
        connectionAfter.Should().BeNull();
        users.Should().BeEmpty();
    }

    [Fact]
    public async Task GetUsersInRoomAsync_ShouldBeCaseInsensitiveAndDistinct()
    {
        // Arrange
        await _tracker.AddConnectionAsync("conn-a", "Charlie", "ROOM-1");
        await _tracker.AddConnectionAsync("conn-b", "Charlie", "room-1"); // same user on another tab
        await _tracker.AddConnectionAsync("conn-c", "David", "room-1");

        // Act
        var users = await _tracker.GetUsersInRoomAsync("Room-1");

        // Assert
        users.Should().HaveCount(2);
        users.Should().Contain("Charlie");
        users.Should().Contain("David");
    }

    [Fact]
    public async Task ConcurrentAccess_ShouldNotThrowOrCorruptData()
    {
        // Arrange
        var tasks = new List<Task>();
        const int userCount = 200;

        // Act - Simulate 200 concurrent connections
        for (int i = 0; i < userCount; i++)
        {
            var id = $"conn-{i}";
            var name = $"User_{i}";
            var room = i % 2 == 0 ? "roomA" : "roomB";
            tasks.Add(Task.Run(async () =>
            {
                await _tracker.AddConnectionAsync(id, name, room);
                await _tracker.GetConnectionAsync(id);
                await _tracker.GetUsersInRoomAsync(room);
            }));
        }

        await Task.WhenAll(tasks);

        var roomAUsers = await _tracker.GetUsersInRoomAsync("roomA");
        var roomBUsers = await _tracker.GetUsersInRoomAsync("roomB");

        // Assert
        roomAUsers.Count.Should().Be(100);
        roomBUsers.Count.Should().Be(100);
    }
}
