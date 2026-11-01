import * as signalR from "@microsoft/signalr";
import { useChatStore, type ChatMessage } from "../../stores/useChatStore";
import { API_URL } from "../api";

class ChatSignalRService {
  private connection: signalR.HubConnection | null = null;
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  public async initConnection(): Promise<signalR.HubConnection> {
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      return this.connection;
    }

    const hubUrl = `${API_URL}/chat`;
    useChatStore.getState().setConnectionStatus("connecting");

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.registerEventListeners(this.connection);

    try {
      await this.connection.start();
      useChatStore.getState().setConnectionStatus("connected");
      console.log("Conectado ao SignalR Hub em", hubUrl);

      // Auto re-join se houver sala e usuário salvos
      const { currentUser, currentRoom } = useChatStore.getState();
      if (currentUser && currentRoom) {
        await this.joinRoom(currentUser, currentRoom);
      }
    } catch (error) {
      console.error("Falha ao iniciar conexão SignalR:", error);
      useChatStore.getState().setConnectionStatus("disconnected");
    }

    return this.connection;
  }

  private registerEventListeners(conn: signalR.HubConnection) {
    conn.on("ReceiveMessage", (sender: string, message: string, timestampUtc?: string, messageId?: string) => {
      const isSystem = sender.toLowerCase() === "system";
      const newMsg: ChatMessage = {
        id: messageId || crypto.randomUUID(),
        user: sender,
        message,
        timestamp: timestampUtc || new Date().toISOString(),
        isSystem,
      };
      useChatStore.getState().addMessage(newMsg);
    });

    conn.on("ConnectedUser", (users: string[]) => {
      useChatStore.getState().setConnectedUsers(users);
    });

    conn.on("UserTyping", (username: string) => {
      const myUsername = useChatStore.getState().currentUser;
      if (username !== myUsername) {
        useChatStore.getState().setTypingUser(username);
      }
    });

    conn.on("UserStopTyping", (_username: string) => {
      useChatStore.getState().setTypingUser(null);
    });

    conn.onreconnecting((error) => {
      console.warn("SignalR reconectando...", error);
      useChatStore.getState().setConnectionStatus("reconnecting");
    });

    conn.onreconnected(async (connectionId) => {
      console.log("SignalR reconectado! Novo connectionId:", connectionId);
      useChatStore.getState().setConnectionStatus("connected");

      const { currentUser, currentRoom } = useChatStore.getState();
      if (currentUser && currentRoom) {
        await this.joinRoom(currentUser, currentRoom);
      }
    });

    conn.onclose(() => {
      console.warn("SignalR desconectado.");
      useChatStore.getState().setConnectionStatus("disconnected");
    });
  }

  public async joinRoom(username: string, chatRoom: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.initConnection();
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("JoinRoom", {
        username: username.trim(),
        chatRoom: chatRoom.trim(),
      });
      useChatStore.getState().setCurrentUser(username.trim());
      useChatStore.getState().setCurrentRoom(chatRoom.trim());
    }
  }

  public async sendMessage(message: string): Promise<void> {
    if (!message.trim() || !this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    await this.connection.invoke("SendMessage", message.trim());
    this.sendStopTyping();
  }

  public sendStartTyping(): void {
    const { currentUser, currentRoom } = useChatStore.getState();
    if (!currentUser || !currentRoom || !this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    this.connection.invoke("StartTyping", currentRoom, currentUser);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.sendStopTyping();
    }, 1500);
  }

  public sendStopTyping(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    const { currentUser, currentRoom } = useChatStore.getState();
    if (currentUser && currentRoom && this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      this.connection.invoke("StopTyping", currentRoom, currentUser);
    }
  }

  public async leaveChat(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (err) {
        console.error("Erro ao desconectar:", err);
      }
    }
    useChatStore.getState().resetChat();
    useChatStore.getState().setConnectionStatus("disconnected");
  }
}

export const chatSignalR = new ChatSignalRService();
