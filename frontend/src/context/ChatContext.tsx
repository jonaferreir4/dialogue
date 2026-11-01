import React, { createContext, useContext, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useChatStore } from "../stores/useChatStore";
import { chatSignalR } from "../services/chatService";
import { useWebRTC } from "../hooks/useWebRTC";
import { IncomingCallModal } from "../components/call/IncomingCallModal";
import { VideoCallModal } from "../components/call/VideoCallModal";

interface ChatContextValue {
  messages: ReturnType<typeof useChatStore.getState>["messages"];
  connectedUsers: string[];
  connectedUsersDetailed: ReturnType<typeof useChatStore.getState>["connectedUsersDetailed"];
  connectionStatus: ReturnType<typeof useChatStore.getState>["connectionStatus"];
  isConnected: boolean;
  typingUser: string | null;
  currentUser: string;
  currentRoom: string;
  callStatus: ReturnType<typeof useChatStore.getState>["callStatus"];
  activeCallPeer: ReturnType<typeof useChatStore.getState>["activeCallPeer"];
  sendMessage: (message: string) => Promise<void>;
  joinRoom: (username: string, chatRoom: string) => Promise<void>;
  sendStartTyping: () => void;
  sendStopTyping: () => void;
  leaveChat: () => Promise<void>;
  startCall: (targetUsername: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const messages = useChatStore((s) => s.messages);
  const connectedUsers = useChatStore((s) => s.connectedUsers);
  const connectedUsersDetailed = useChatStore((s) => s.connectedUsersDetailed);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const typingUser = useChatStore((s) => s.typingUser);
  const currentUser = useChatStore((s) => s.currentUser);
  const currentRoom = useChatStore((s) => s.currentRoom);
  const callError = useChatStore((s) => s.callError);
  const setCallError = useChatStore((s) => s.setCallError);

  const webrtc = useWebRTC();

  useEffect(() => {
    chatSignalR.initConnection();
  }, []);

  const value: ChatContextValue = {
    messages,
    connectedUsers,
    connectedUsersDetailed,
    connectionStatus,
    isConnected: connectionStatus === "connected",
    typingUser,
    currentUser,
    currentRoom,
    callStatus: webrtc.callStatus,
    activeCallPeer: webrtc.activeCallPeer,
    sendMessage: (msg) => chatSignalR.sendMessage(msg),
    joinRoom: (u, r) => chatSignalR.joinRoom(u, r),
    sendStartTyping: () => chatSignalR.sendStartTyping(),
    sendStopTyping: () => chatSignalR.sendStopTyping(),
    leaveChat: () => chatSignalR.leaveChat(),
    startCall: (targetUsername) => webrtc.startCall(targetUsername),
    acceptCall: () => webrtc.acceptCall(),
    rejectCall: () => webrtc.rejectCall(),
    endCall: () => webrtc.endCall(),
    toggleMute: () => webrtc.toggleMute(),
    toggleCamera: () => webrtc.toggleCamera(),
  };

  return (
    <ChatContext.Provider value={value}>
      {children}

      {/* Modal de Chamada Recebida */}
      <IncomingCallModal onAccept={webrtc.acceptCall} onReject={webrtc.rejectCall} />

      {/* Modal de Chamada de Vídeo Ativa */}
      <VideoCallModal
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        onEndCall={webrtc.endCall}
        onToggleMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
      />

      {/* Notificação de Erro de Chamada */}
      <Snackbar
        open={!!callError}
        autoHideDuration={4000}
        onClose={() => setCallError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={() => setCallError(null)}
          sx={{ width: "100%", borderRadius: 3 }}
        >
          {callError}
        </Alert>
      </Snackbar>
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat deve ser utilizado dentro de ChatProvider");
  return context;
};

