using Application.DTOs;
using Application.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using WebApi.Hubs;
using Xunit;

namespace Tests;

public class ChatRoomHubTests
{
    private readonly Mock<IConnectionTracker> _trackerMock = new();
    private readonly Mock<ILogger<ChatRoom>> _loggerMock = new();
    private readonly Mock<IHubCallerClients> _clientsMock = new();
    private readonly Mock<IClientProxy> _clientProxyMock = new();
    private readonly Mock<IGroupManager> _groupsMock = new();
    private readonly Mock<HubCallerContext> _contextMock = new();

    private readonly ChatRoom _hub;
    private const string TestConnectionId = "test-conn-123";

    public ChatRoomHubTests()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns(TestConnectionId);
        _clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_clientProxyMock.Object);
        _clientsMock.Setup(c => c.OthersInGroup(It.IsAny<string>())).Returns(_clientProxyMock.Object);

        _hub = new ChatRoom(_trackerMock.Object, _loggerMock.Object)
        {
            Context = _contextMock.Object,
            Clients = _clientsMock.Object,
            Groups = _groupsMock.Object
        };
    }

    [Fact]
    public async Task JoinRoom_WithValidRequest_ShouldAddToGroupAndTrackConnection()
    {
        // Arrange
        var request = new JoinRoomRequest("JohnDoe", "dev-room");
        _trackerMock.Setup(t => t.GetUsersInRoomAsync("dev-room", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string> { "JohnDoe" });

        // Act
        await _hub.JoinRoom(request);

        // Assert
        _groupsMock.Verify(g => g.AddToGroupAsync(TestConnectionId, "dev-room", default), Times.Once);
        _trackerMock.Verify(t => t.AddConnectionAsync(TestConnectionId, "JohnDoe", "dev-room", default), Times.Once);
        _clientProxyMock.Verify(p => p.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args => (string)args[0]! == "system" && ((string)args[1]!).Contains("JohnDoe")), default), Times.Once);
    }

    [Fact]
    public async Task JoinRoom_WithInvalidRequest_ShouldNotAddToGroup()
    {
        // Arrange
        var request = new JoinRoomRequest("", "   ");

        // Act
        await _hub.JoinRoom(request);

        // Assert
        _groupsMock.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
        _trackerMock.Verify(t => t.AddConnectionAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Fact]
    public async Task SendMessage_WhenUserIsConnected_ShouldBroadcastToGroup()
    {
        // Arrange
        var user = new ConnectedUserDto(TestConnectionId, "Alice", "general", DateTime.UtcNow);
        _trackerMock.Setup(t => t.GetConnectionAsync(TestConnectionId, default))
            .ReturnsAsync(user);

        // Act
        await _hub.SendMessage("Hello, world!");

        // Assert
        _clientsMock.Verify(c => c.Group("general"), Times.Once);
        _clientProxyMock.Verify(p => p.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args => (string)args[0]! == "Alice" && (string)args[1]! == "Hello, world!"), default), Times.Once);
    }

    [Fact]
    public async Task SendMessage_WithEmptyText_ShouldNotBroadcast()
    {
        // Act
        await _hub.SendMessage("   ");

        // Assert
        _clientProxyMock.Verify(p => p.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), default), Times.Never);
    }

    [Fact]
    public async Task OnDisconnectedAsync_WhenUserExists_ShouldRemoveAndNotifyRoom()
    {
        // Arrange
        var user = new ConnectedUserDto(TestConnectionId, "Bob", "gaming", DateTime.UtcNow);
        _trackerMock.Setup(t => t.RemoveConnectionAsync(TestConnectionId, default))
            .ReturnsAsync(user);
        _trackerMock.Setup(t => t.GetUsersInRoomAsync("gaming", default))
            .ReturnsAsync(new List<string>());

        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert
        _trackerMock.Verify(t => t.RemoveConnectionAsync(TestConnectionId, default), Times.Once);
        _clientsMock.Verify(c => c.Group("gaming"), Times.AtLeastOnce);
        _clientProxyMock.Verify(p => p.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args => (string)args[0]! == "system" && ((string)args[1]!).Contains("Bob")), default), Times.Once);
    }

    [Fact]
    public async Task StartTyping_ShouldNotifyOthersInGroup()
    {
        // Act
        await _hub.StartTyping("general", "Alice");

        // Assert
        _clientsMock.Verify(c => c.OthersInGroup("general"), Times.Once);
        _clientProxyMock.Verify(p => p.SendCoreAsync("UserTyping", It.Is<object?[]>(args => (string)args[0]! == "Alice"), default), Times.Once);
    }

    [Fact]
    public async Task StopTyping_ShouldNotifyOthersInGroup()
    {
        // Act
        await _hub.StopTyping("general", "Alice");

        // Assert
        _clientsMock.Verify(c => c.OthersInGroup("general"), Times.Once);
        _clientProxyMock.Verify(p => p.SendCoreAsync("UserStopTyping", It.Is<object?[]>(args => (string)args[0]! == "Alice"), default), Times.Once);
    }
}
