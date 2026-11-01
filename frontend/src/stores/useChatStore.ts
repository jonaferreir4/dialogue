import { create } from "zustand";

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string; // ISO string UTC
  isSystem?: boolean;
}

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected";
export type CallStatus = "idle" | "calling" | "receiving" | "in-call";

export interface ConnectedUserDetailed {
  connectionId: string;
  username: string;
  chatRoom: string;
  connectedAtUtc: string;
}

export interface PendingOffer {
  callerConnectionId: string;
  callerUsername: string;
  sdpOffer: string;
}

export interface ActiveCallPeer {
  connectionId: string;
  username: string;
}

interface ChatState {
  currentUser: string;
  currentRoom: string;
  messages: ChatMessage[];
  connectedUsers: string[];
  typingUser: string | null;
  connectionStatus: ConnectionStatus;

  // WebRTC Call state
  callStatus: CallStatus;
  activeCallPeer: ActiveCallPeer | null;
  pendingOffer: PendingOffer | null;
  callError: string | null;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  connectedUsersDetailed: ConnectedUserDetailed[];

  // Chat Actions
  setCurrentUser: (user: string) => void;
  setCurrentRoom: (room: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setConnectedUsers: (users: string[]) => void;
  setTypingUser: (user: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  resetChat: () => void;

  // WebRTC Actions
  setCallStatus: (status: CallStatus) => void;
  setActiveCallPeer: (peer: ActiveCallPeer | null) => void;
  setPendingOffer: (offer: PendingOffer | null) => void;
  setCallError: (error: string | null) => void;
  setIsAudioMuted: (isMuted: boolean | ((prev: boolean) => boolean)) => void;
  setIsVideoDisabled: (isDisabled: boolean | ((prev: boolean) => boolean)) => void;
  setConnectedUsersDetailed: (users: ConnectedUserDetailed[]) => void;
  resetCall: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentUser: localStorage.getItem("dialogue_username") || "",
  currentRoom: localStorage.getItem("dialogue_room") || "",
  messages: [],
  connectedUsers: [],
  typingUser: null,
  connectionStatus: "disconnected",

  callStatus: "idle",
  activeCallPeer: null,
  pendingOffer: null,
  callError: null,
  isAudioMuted: false,
  isVideoDisabled: false,
  connectedUsersDetailed: [],

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
      connectedUsersDetailed: [],
      typingUser: null,
      currentRoom: "",
      callStatus: "idle",
      activeCallPeer: null,
      pendingOffer: null,
      callError: null,
      isAudioMuted: false,
      isVideoDisabled: false,
    }),

  setCallStatus: (callStatus) => set({ callStatus }),

  setActiveCallPeer: (activeCallPeer) => set({ activeCallPeer }),

  setPendingOffer: (pendingOffer) => set({ pendingOffer }),

  setCallError: (callError) => set({ callError }),

  setIsAudioMuted: (val) =>
    set((state) => ({
      isAudioMuted: typeof val === "function" ? val(state.isAudioMuted) : val,
    })),

  setIsVideoDisabled: (val) =>
    set((state) => ({
      isVideoDisabled: typeof val === "function" ? val(state.isVideoDisabled) : val,
    })),

  setConnectedUsersDetailed: (connectedUsersDetailed) => set({ connectedUsersDetailed }),

  resetCall: () =>
    set({
      callStatus: "idle",
      activeCallPeer: null,
      pendingOffer: null,
      callError: null,
      isAudioMuted: false,
      isVideoDisabled: false,
    }),
}));

