import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "../stores/useChatStore";
import { chatSignalR } from "../services/chatService";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC() {
  const {
    callStatus,
    activeCallPeer,
    pendingOffer,
    isAudioMuted,
    isVideoDisabled,
    setCallStatus,
    setActiveCallPeer,
    setCallError,
    setIsAudioMuted,
    setIsVideoDisabled,
    resetCall,
  } = useChatStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteIceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const localIceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const targetConnectionIdRef = useRef<string | null>(null);

  // Mantém targetConnectionIdRef sincronizado com activeCallPeer
  useEffect(() => {
    targetConnectionIdRef.current = activeCallPeer?.connectionId || null;
  }, [activeCallPeer]);

  // Função para parar todas as faixas de um stream de mídia
  const stopStream = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Limpeza completa da conexão Peer e Streams
  const cleanupCall = useCallback(() => {
    stopStream(localStreamRef.current);
    stopStream(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    remoteIceCandidatesQueue.current = [];
    localIceCandidatesQueue.current = [];
    targetConnectionIdRef.current = null;
    resetCall();
  }, [resetCall]);

  // Inicializa o PeerConnection com callbacks padrão
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const destConnId = targetConnectionIdRef.current;
        if (destConnId) {
          chatSignalR.sendIceCandidate(destConnId, JSON.stringify(event.candidate.toJSON()));
        } else {
          localIceCandidatesQueue.current.push(event.candidate.toJSON());
        }
      }
    };

    pc.ontrack = (event) => {
      const incomingStream = event.streams && event.streams[0] ? event.streams[0] : null;
      let stream = remoteStreamRef.current;

      if (incomingStream) {
        stream = incomingStream;
      } else {
        if (!stream) {
          stream = new MediaStream();
        }
        stream.addTrack(event.track);
      }

      remoteStreamRef.current = stream;
      // Clona/cria nova instância para forçar atualização no React a cada track (áudio e vídeo)
      setRemoteStream(new MediaStream(stream.getTracks()));

      event.track.onunmute = () => {
        if (remoteStreamRef.current) {
          setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        }
      };
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        cleanupCall();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanupCall]);

  // Iniciar chamada de vídeo para um usuário
  const startCall = useCallback(
    async (targetUsername: string) => {
      try {
        // Tenta encontrar connectionId imediato na lista detalhada
        const knownUser = useChatStore
          .getState()
          .connectedUsersDetailed.find((u) => u.username.toLowerCase() === targetUsername.toLowerCase());
        const initialConnId = knownUser?.connectionId || "";

        targetConnectionIdRef.current = initialConnId || null;
        setCallStatus("calling");
        setActiveCallPeer({ connectionId: initialConnId, username: targetUsername });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = createPeerConnection();

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await chatSignalR.callUser(targetUsername, JSON.stringify(offer));
      } catch (err: unknown) {
        console.error("Erro ao iniciar chamada:", err);
        const errorMsg =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Permissão de câmera e microfone negada."
            : "Não foi possível acessar seus dispositivos de mídia.";
        setCallError(errorMsg);
        cleanupCall();
      }
    },
    [setCallStatus, setActiveCallPeer, createPeerConnection, setCallError, cleanupCall]
  );

  // Atender chamada recebida
  const acceptCall = useCallback(async () => {
    if (!pendingOffer) return;

    try {
      const { callerConnectionId, callerUsername, sdpOffer } = pendingOffer;
      setActiveCallPeer({ connectionId: callerConnectionId, username: callerUsername });
      targetConnectionIdRef.current = callerConnectionId;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection();

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offerDesc = JSON.parse(sdpOffer);
      await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

      // Descarrega candidatos ICE remotos acumulados enquanto a descrição remota não estava pronta
      while (remoteIceCandidatesQueue.current.length > 0) {
        const candidate = remoteIceCandidatesQueue.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await chatSignalR.answerCall(callerConnectionId, JSON.stringify(answer));
      setCallStatus("in-call");
    } catch (err) {
      console.error("Erro ao atender chamada:", err);
      setCallError("Falha ao conectar chamada.");
      cleanupCall();
    }
  }, [pendingOffer, setActiveCallPeer, createPeerConnection, setCallStatus, setCallError, cleanupCall]);

  // Rejeitar chamada recebida
  const rejectCall = useCallback(async () => {
    if (pendingOffer) {
      await chatSignalR.rejectCall(pendingOffer.callerConnectionId);
    }
    cleanupCall();
  }, [pendingOffer, cleanupCall]);

  // Desligar chamada ativa
  const endCall = useCallback(async () => {
    const targetConnId = targetConnectionIdRef.current || activeCallPeer?.connectionId;
    if (targetConnId) {
      await chatSignalR.hangUp(targetConnId);
    }
    cleanupCall();
  }, [activeCallPeer, cleanupCall]);

  // Alternar mudo de áudio
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [setIsAudioMuted]);

  // Alternar vídeo ligado/desligado
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  }, [setIsVideoDisabled]);

  // Registro de listeners de eventos WebRTC no chatSignalR
  useEffect(() => {
    // 1. Resposta da oferta (Caller recebe Answer do Target)
    chatSignalR.onCallAnswerReceived = async (answererConnectionId, sdpAnswer) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;

        targetConnectionIdRef.current = answererConnectionId;
        setActiveCallPeer({
          connectionId: answererConnectionId,
          username: activeCallPeer?.username || "Interlocutor",
        });

        const answerDesc = JSON.parse(sdpAnswer);
        await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));

        // Descarrega candidatos ICE locais acumulados antes de ter o answererConnectionId
        while (localIceCandidatesQueue.current.length > 0) {
          const cand = localIceCandidatesQueue.current.shift();
          if (cand) {
            chatSignalR.sendIceCandidate(answererConnectionId, JSON.stringify(cand));
          }
        }

        // Descarrega candidatos ICE remotos acumulados antes de ter a descrição remota
        while (remoteIceCandidatesQueue.current.length > 0) {
          const candidate = remoteIceCandidatesQueue.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }

        setCallStatus("in-call");
      } catch (err) {
        console.error("Erro ao processar Answer da chamada:", err);
        cleanupCall();
      }
    };

    // 2. Recebimento de ICE Candidate
    chatSignalR.onIceCandidateReceived = async (_senderConnectionId, candidateJson) => {
      try {
        const candidateInit: RTCIceCandidateInit = JSON.parse(candidateJson);
        const pc = pcRef.current;

        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } else {
          remoteIceCandidatesQueue.current.push(candidateInit);
        }
      } catch (err) {
        console.error("Erro ao processar ICE Candidate:", err);
      }
    };

    // 3. Chamada encerrada pelo outro lado
    chatSignalR.onCallEnded = () => {
      cleanupCall();
    };

    // 4. Chamada recusada
    chatSignalR.onCallRejected = () => {
      cleanupCall();
    };

    // 5. Destinatário indisponível
    chatSignalR.onCallUnavailable = () => {
      cleanupCall();
    };

    return () => {
      chatSignalR.onCallAnswerReceived = undefined;
      chatSignalR.onIceCandidateReceived = undefined;
      chatSignalR.onCallEnded = undefined;
      chatSignalR.onCallRejected = undefined;
      chatSignalR.onCallUnavailable = undefined;
    };
  }, [activeCallPeer, setActiveCallPeer, setCallStatus, cleanupCall]);

  return {
    callStatus,
    activeCallPeer,
    pendingOffer,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoDisabled,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
