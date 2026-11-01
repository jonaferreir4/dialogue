import { Dialog, DialogContent, Box, Typography, IconButton } from "@mui/material";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";
import Avatar from "react-avatar";
import { useChatStore } from "../../stores/useChatStore";

interface IncomingCallModalProps {
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({ onAccept, onReject }: IncomingCallModalProps) {
  const callStatus = useChatStore((s) => s.callStatus);
  const pendingOffer = useChatStore((s) => s.pendingOffer);

  const isOpen = callStatus === "receiving" && pendingOffer !== null;

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onReject}
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          borderRadius: 4,
          p: 2,
          minWidth: 320,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.7)",
          textAlign: "center",
        },
      }}
    >
      <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, px: 2 }}>
        {/* Avatar com pulsação */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <Box
            sx={{
              position: "absolute",
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: "50%",
              bgcolor: "primary.main",
              opacity: 0.25,
              animation: "pulse 1.8s infinite ease-in-out",
              "@keyframes pulse": {
                "0%": { transform: "scale(0.95)", opacity: 0.6 },
                "50%": { transform: "scale(1.2)", opacity: 0.1 },
                "100%": { transform: "scale(0.95)", opacity: 0.6 },
              },
            }}
          />
          <Avatar name={pendingOffer.callerUsername} size="80" round textSizeRatio={2.5} />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
          {pendingOffer.callerUsername}
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 3 }}>
          Chamada de vídeo recebida...
        </Typography>

        {/* Botões de Ação */}
        <Box sx={{ display: "flex", gap: 3, justifyContent: "center" }}>
          {/* Recusar */}
          <IconButton
            onClick={onReject}
            sx={{
              bgcolor: "error.main",
              color: "#ffffff",
              width: 56,
              height: 56,
              "&:hover": {
                bgcolor: "error.dark",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            <CallEndRoundedIcon fontSize="medium" />
          </IconButton>

          {/* Atender */}
          <IconButton
            onClick={onAccept}
            sx={{
              bgcolor: "success.main",
              color: "#ffffff",
              width: 56,
              height: 56,
              "&:hover": {
                bgcolor: "success.dark",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            <CallRoundedIcon fontSize="medium" />
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default IncomingCallModal;
