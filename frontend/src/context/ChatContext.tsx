import React, { createContext, useContext, useEffect } from "react";
import { useChatStore } from "../stores/useChatStore";
import { chatSignalR } from "../services/chatService";

interface ChatContextValue {
  messages: ReturnType<typeof useChatStore.getState>["messages"];
  connectedUsers: string[];
  connectionStatus: ReturnType<typeof useChatStore.getState>["connectionStatus"];
  isConnected: boolean;
  typingUser: string | null;
  currentUser: string;
  currentRoom: string;
  sendMessage: (message: string) => Promise<void>;
  joinRoom: (username: string, chatRoom: string) => Promise<void>;
  sendStartTyping: () => void;
  sendStopTyping: () => void;
  leaveChat: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const messages = useChatStore((s) => s.messages);
  const connectedUsers = useChatStore((s) => s.connectedUsers);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const typingUser = useChatStore((s) => s.typingUser);
  const currentUser = useChatStore((s) => s.currentUser);
  const currentRoom = useChatStore((s) => s.currentRoom);

  useEffect(() => {
    chatSignalR.initConnection();
  }, []);

  const value: ChatContextValue = {
    messages,
    connectedUsers,
    connectionStatus,
    isConnected: connectionStatus === "connected",
    typingUser,
    currentUser,
    currentRoom,
    sendMessage: (msg) => chatSignalR.sendMessage(msg),
    joinRoom: (u, r) => chatSignalR.joinRoom(u, r),
    sendStartTyping: () => chatSignalR.sendStartTyping(),
    sendStopTyping: () => chatSignalR.sendStopTyping(),
    leaveChat: () => chatSignalR.leaveChat(),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat deve ser utilizado dentro de ChatProvider");
  return context;
};
