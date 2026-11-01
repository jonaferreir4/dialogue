import * as signalR from "@microsoft/signalr";
import { useChatStore, type ChatMessage, type ConnectedUserDetailed } from "../../stores/useChatStore";
import { API_URL } from "../api";

class ChatSignalRService {
  private connection: signalR.HubConnection | null = null;
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  // WebRTC callbacks
  public onCallAnswerReceived?: (answererConnectionId: string, sdpAnswer: string) => void;
  public onIceCandidateReceived?: (senderConnectionId: string, candidateJson: string) => void;
  public onCallEnded?: (senderConnectionId: string) => void;
  public onCallRejected?: (responderConnectionId: string) => void;
  public onCallUnavailable?: (targetUsername: string) => void;

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

    conn.on("ConnectedUsersDetailed", (connections: ConnectedUserDetailed[]) => {
      useChatStore.getState().setConnectedUsersDetailed(connections);
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

    // WebRTC Signaling Events
    conn.on("ReceiveCallOffer", (callerConnectionId: string, callerUsername: string, sdpOffer: string) => {
      const { callStatus } = useChatStore.getState();
      if (callStatus !== "idle") {
        this.rejectCall(callerConnectionId);
        return;
      }
      useChatStore.getState().setPendingOffer({ callerConnectionId, callerUsername, sdpOffer });
      useChatStore.getState().setCallStatus("receiving");
    });

    conn.on("ReceiveCallAnswer", (answererConnectionId: string, sdpAnswer: string) => {
      if (this.onCallAnswerReceived) {
        this.onCallAnswerReceived(answererConnectionId, sdpAnswer);
      }
    });

    conn.on("ReceiveIceCandidate", (senderConnectionId: string, candidateJson: string) => {
      if (this.onIceCandidateReceived) {
        this.onIceCandidateReceived(senderConnectionId, candidateJson);
      }
    });

    conn.on("CallRejected", (responderConnectionId: string) => {
      if (this.onCallRejected) {
        this.onCallRejected(responderConnectionId);
      }
      useChatStore.getState().setCallError("Chamada recusada pelo usuário.");
      useChatStore.getState().resetCall();
    });

    conn.on("CallEnded", (senderConnectionId: string) => {
      if (this.onCallEnded) {
        this.onCallEnded(senderConnectionId);
      }
      useChatStore.getState().setCallError("Chamada encerrada.");
      useChatStore.getState().resetCall();
    });

    conn.on("CallUnavailable", (targetUsername: string) => {
      if (this.onCallUnavailable) {
        this.onCallUnavailable(targetUsername);
      }
      useChatStore.getState().setCallError(`Usuário "${targetUsername}" não está disponível ou offline.`);
      useChatStore.getState().resetCall();
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

  // WebRTC Hub Invocations
  public async callUser(targetUsername: string, sdpOffer: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke("CallUser", targetUsername, sdpOffer);
  }

  public async answerCall(callerConnectionId: string, sdpAnswer: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke("AnswerCall", callerConnectionId, sdpAnswer);
  }

  public async sendIceCandidate(targetConnectionId: string, candidateJson: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke("SendIceCandidate", targetConnectionId, candidateJson);
  }

  public async rejectCall(callerConnectionId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke("RejectCall", callerConnectionId);
  }

  public async hangUp(targetConnectionId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke("HangUp", targetConnectionId);
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

