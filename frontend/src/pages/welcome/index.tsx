import { Box, Button, Typography, Paper, Stack, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          top: "10%",
          left: "15%",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)",
          bottom: "10%",
          right: "15%",
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: 6 },
          textAlign: "center",
          borderRadius: 4,
          maxWidth: 480,
          width: "100%",
          bgcolor: "background.paper",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            bgcolor: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            color: "primary.light",
          }}
        >
          <ChatRoundedIcon sx={{ fontSize: 36 }} />
        </Box>

        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
          Dialogue
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
          Comunicação em tempo real de alta performance com WebSockets, SignalR e arquitetura distribuída.
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 4, flexWrap: "wrap", gap: 1 }}>
          <Chip
            icon={<BoltRoundedIcon sx={{ fontSize: 16 }} />}
            label="Ultra Rápido"
            size="small"
            sx={{ bgcolor: "rgba(255, 255, 255, 0.04)" }}
          />
          <Chip
            icon={<SecurityRoundedIcon sx={{ fontSize: 16 }} />}
            label="Thread-Safe"
            size="small"
            sx={{ bgcolor: "rgba(255, 255, 255, 0.04)" }}
          />
        </Stack>

        <Button
          variant="contained"
          size="large"
          color="primary"
          fullWidth
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={() => navigate("/join-room")}
          sx={{ py: 1.5, fontSize: "1rem" }}
        >
          Entrar em uma Sala
        </Button>
      </Paper>
    </Box>
  );
}

export default Welcome;
