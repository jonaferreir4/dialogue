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
    private readonly Mock<IClientProxy> _groupClientProxyMock = new();
    private readonly Mock<ISingleClientProxy> _singleClientProxyMock = new();
    private readonly Mock<IGroupManager> _groupsMock = new();
    private readonly Mock<HubCallerContext> _contextMock = new();

    private readonly ChatRoom _hub;
    private const string TestConnectionId = "test-conn-123";

    public ChatRoomHubTests()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns(TestConnectionId);
        _clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_groupClientProxyMock.Object);
        _clientsMock.Setup(c => c.OthersInGroup(It.IsAny<string>())).Returns(_groupClientProxyMock.Object);
        _clientsMock.Setup(c => c.Client(It.IsAny<string>())).Returns(_singleClientProxyMock.Object);
        _clientsMock.Setup(c => c.Caller).Returns(_singleClientProxyMock.Object);

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
        _trackerMock.Setup(t => t.GetConnectionsInRoomAsync("dev-room", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ConnectedUserDto> { new(TestConnectionId, "JohnDoe", "dev-room", DateTime.UtcNow) });

        // Act
        await _hub.JoinRoom(request);

        // Assert
        _groupsMock.Verify(g => g.AddToGroupAsync(TestConnectionId, "dev-room", default), Times.Once);
        _trackerMock.Verify(t => t.AddConnectionAsync(TestConnectionId, "JohnDoe", "dev-room", default), Times.Once);
        _groupClientProxyMock.Verify(p => p.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args => (string)args[0]! == "system" && ((string)args[1]!).Contains("JohnDoe")), default), Times.Once);
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
        _groupClientProxyMock.Verify(p => p.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args => (string)args[0]! == "Alice" && (string)args[1]! == "Hello, world!"), default), Times.Once);
    }

    [Fact]
    public async Task SendMessage_WithEmptyText_ShouldNotBroadcast()
    {
        // Act
        await _hub.SendMessage("   ");

        // Assert
        _groupClientProxyMock.Verify(p => p.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), default), Times.Never);
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
        _trackerMock.Setup(t => t.GetConnectionsInRoomAsync("gaming", default))
            .ReturnsAsync(new List<ConnectedUserDto>());

        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert
        _trackerMock.Verify(t => t.RemoveConnectionAsync(TestConnectionId, default), Times.Once);
        _clientsMock.Verify(c => c.Group("gaming"), Times.AtLeastOnce);
        _groupClientProxyMock.Verify(p => p.SendCoreAsync("ReceiveMessage", It.Is<object?[]>(args => (string)args[0]! == "system" && ((string)args[1]!).Contains("Bob")), default), Times.Once);
    }

    [Fact]
    public async Task StartTyping_ShouldNotifyOthersInGroup()
    {
        // Act
        await _hub.StartTyping("general", "Alice");

        // Assert
        _clientsMock.Verify(c => c.OthersInGroup("general"), Times.Once);
        _groupClientProxyMock.Verify(p => p.SendCoreAsync("UserTyping", It.Is<object?[]>(args => (string)args[0]! == "Alice"), default), Times.Once);
    }

    [Fact]
    public async Task StopTyping_ShouldNotifyOthersInGroup()
    {
        // Act
        await _hub.StopTyping("general", "Alice");

        // Assert
        _clientsMock.Verify(c => c.OthersInGroup("general"), Times.Once);
        _groupClientProxyMock.Verify(p => p.SendCoreAsync("UserStopTyping", It.Is<object?[]>(args => (string)args[0]! == "Alice"), default), Times.Once);
    }

    // ==========================================
    // WebRTC Signaling Tests
    // ==========================================

    [Fact]
    public async Task CallUser_WhenTargetExists_ShouldForwardOfferToTargetClient()
    {
        // Arrange
        var caller = new ConnectedUserDto(TestConnectionId, "Alice", "dev-room", DateTime.UtcNow);
        var target = new ConnectedUserDto("target-conn-456", "Bob", "dev-room", DateTime.UtcNow);

        _trackerMock.Setup(t => t.GetConnectionAsync(TestConnectionId, default))
            .ReturnsAsync(caller);
        _trackerMock.Setup(t => t.GetConnectionByUsernameAsync("dev-room", "Bob", default))
            .ReturnsAsync(target);

        // Act
        await _hub.CallUser("Bob", "sample-sdp-offer");

        // Assert
        _clientsMock.Verify(c => c.Client("target-conn-456"), Times.Once);
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("ReceiveCallOffer", It.Is<object?[]>(args =>
            (string)args[0]! == TestConnectionId &&
            (string)args[1]! == "Alice" &&
            (string)args[2]! == "sample-sdp-offer"), default), Times.Once);
    }

    [Fact]
    public async Task AnswerCall_ShouldForwardAnswerToCallerClient()
    {
        // Act
        await _hub.AnswerCall("target-conn-456", "sample-sdp-answer");

        // Assert
        _clientsMock.Verify(c => c.Client("target-conn-456"), Times.Once);
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("ReceiveCallAnswer", It.Is<object?[]>(args =>
            (string)args[0]! == TestConnectionId &&
            (string)args[1]! == "sample-sdp-answer"), default), Times.Once);
    }

    [Fact]
    public async Task SendIceCandidate_ShouldForwardCandidateToTargetClient()
    {
        // Act
        await _hub.SendIceCandidate("target-conn-456", "sample-ice-candidate-json");

        // Assert
        _clientsMock.Verify(c => c.Client("target-conn-456"), Times.Once);
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("ReceiveIceCandidate", It.Is<object?[]>(args =>
            (string)args[0]! == TestConnectionId &&
            (string)args[1]! == "sample-ice-candidate-json"), default), Times.Once);
    }

    [Fact]
    public async Task RejectCall_ShouldForwardRejectionToCaller()
    {
        // Act
        await _hub.RejectCall("target-conn-456");

        // Assert
        _clientsMock.Verify(c => c.Client("target-conn-456"), Times.Once);
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("CallRejected", It.Is<object?[]>(args =>
            (string)args[0]! == TestConnectionId), default), Times.Once);
    }

    [Fact]
    public async Task HangUp_ShouldNotifyTargetClient()
    {
        // Act
        await _hub.HangUp("target-conn-456");

        // Assert
        _clientsMock.Verify(c => c.Client("target-conn-456"), Times.Once);
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("CallEnded", It.Is<object?[]>(args =>
            (string)args[0]! == TestConnectionId), default), Times.Once);
    }
}
