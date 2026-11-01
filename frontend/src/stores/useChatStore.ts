import { create } from "zustand";

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string; // ISO string UTC
  isSystem?: boolean;
}

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected";

interface ChatState {
  currentUser: string;
  currentRoom: string;
  messages: ChatMessage[];
  connectedUsers: string[];
  typingUser: string | null;
  connectionStatus: ConnectionStatus;

  // Actions
  setCurrentUser: (user: string) => void;
  setCurrentRoom: (room: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setConnectedUsers: (users: string[]) => void;
  setTypingUser: (user: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentUser: localStorage.getItem("dialogue_username") || "",
  currentRoom: localStorage.getItem("dialogue_room") || "",
  messages: [],
  connectedUsers: [],
  typingUser: null,
  connectionStatus: "disconnected",

  setCurrentUser: (user) => {
    localStorage.setItem("dialogue_username", user);
    set({ currentUser: user });
  },

  setCurrentRoom: (room) => {
    localStorage.setItem("dialogue_room", room);
    set({ currentRoom: room });
  },

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  setMessages: (messages) => set({ messages }),

  setConnectedUsers: (connectedUsers) => set({ connectedUsers }),

  setTypingUser: (typingUser) => set({ typingUser }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  resetChat: () =>
    set({
      messages: [],
      connectedUsers: [],
      typingUser: null,
      currentRoom: "",
    }),
}));
