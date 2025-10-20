using Microsoft.AspNetCore.SignalR; 

namespace WebApi.Hubs;

public class ChatRoom : Hub
{
    public async void SendMessage( string userName, string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", userName, message);
    }
}