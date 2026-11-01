namespace  Domain.Entities;
    public class User: BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string ChatRoom { get; set; } = string.Empty;
}