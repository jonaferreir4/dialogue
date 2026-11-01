import { useEffect, useRef } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VideocamOffRoundedIcon from "@mui/icons-material/VideocamOffRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";
import Avatar from "react-avatar";
import { useChatStore } from "../../stores/useChatStore";

interface VideoCallModalProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

export function VideoCallModal({
  localStream,
  remoteStream,
  onEndCall,
  onToggleMute,
  onToggleCamera,
}: VideoCallModalProps) {
  const callStatus = useChatStore((s) => s.callStatus);
  const activeCallPeer = useChatStore((s) => s.activeCallPeer);
  const isAudioMuted = useChatStore((s) => s.isAudioMuted);
  const isVideoDisabled = useChatStore((s) => s.isVideoDisabled);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const isOpen = callStatus === "calling" || callStatus === "in-call";

  // Vincula localStream ao elemento HTMLVideoElement
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen]);

  // Vincula remoteStream ao elemento HTMLVideoElement
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isOpen]);

  if (!isOpen) return null;

  const peerName = activeCallPeer?.username || "Interlocutor";

  return (
    <Dialog
      open={isOpen}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: "#090d16",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 32px 64px -16px rgba(0, 0, 0, 0.9)",
          height: { xs: "90vh", sm: "600px" },
          position: "relative",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Container Principal de Vídeo Remoto */}
      <Box
        sx={{
          position: "relative",
          flexGrow: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#05080f",
          overflow: "hidden",
        }}
      >
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              textAlign: "center",
              p: 3,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar name={peerName} size="96" round textSizeRatio={2.5} />
              {callStatus === "calling" && (
                <CircularProgress
                  size={112}
                  thickness={2}
                  sx={{
                    position: "absolute",
                    top: -8,
                    left: -8,
                    color: "primary.main",
                  }}
                />
              )}
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {peerName}
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {callStatus === "calling" ? "Chamando..." : "Conectando stream de vídeo..."}
            </Typography>
          </Box>
        )}

        {/* Header Superior Flutuante */}
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 20,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(12px)",
            px: 2,
            py: 0.8,
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: callStatus === "in-call" ? "success.main" : "warning.main",
            }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {peerName}
          </Typography>
        </Box>

        {/* Miniatura Picture-in-Picture do Vídeo Local */}
        <Box
          sx={{
            position: "absolute",
            bottom: 88,
            right: 20,
            width: { xs: 110, sm: 160 },
            height: { xs: 80, sm: 120 },
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.6)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            bgcolor: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          {isVideoDisabled ? (
            <VideocamOffRoundedIcon sx={{ color: "text.secondary", fontSize: 32 }} />
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)", // Efeito espelho para a própria câmera
              }}
            />
          )}
        </Box>

        {/* Barra Inferior de Controles com Glassmorphism */}
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            bgcolor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(16px)",
            px: 3,
            py: 1,
            borderRadius: 6,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            zIndex: 20,
          }}
        >
          {/* Mudo / Microfone */}
          <Tooltip title={isAudioMuted ? "Desativar Mudo" : "Silenciar Microfone"}>
            <IconButton
              onClick={onToggleMute}
              sx={{
                bgcolor: isAudioMuted ? "error.main" : "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                "&:hover": {
                  bgcolor: isAudioMuted ? "error.dark" : "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              {isAudioMuted ? <MicOffRoundedIcon /> : <MicRoundedIcon />}
            </IconButton>
          </Tooltip>

          {/* Câmera / Vídeo */}
          <Tooltip title={isVideoDisabled ? "Ligar Câmera" : "Desligar Câmera"}>
            <IconButton
              onClick={onToggleCamera}
              sx={{
                bgcolor: isVideoDisabled ? "error.main" : "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                "&:hover": {
                  bgcolor: isVideoDisabled ? "error.dark" : "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              {isVideoDisabled ? <VideocamOffRoundedIcon /> : <VideocamRoundedIcon />}
            </IconButton>
          </Tooltip>

          {/* Desligar Chamada */}
          <Tooltip title="Encerrar Chamada">
            <IconButton
              onClick={onEndCall}
              sx={{
                bgcolor: "error.main",
                color: "#ffffff",
                px: 2,
                borderRadius: 4,
                "&:hover": {
                  bgcolor: "error.dark",
                  transform: "scale(1.05)",
                },
                transition: "all 0.15s ease-in-out",
              }}
            >
              <CallEndRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Dialog>
  );
}

export default VideoCallModal;
