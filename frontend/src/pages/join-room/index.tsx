import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import { useChat } from "../../context/ChatContext";
import { fetchBackendHealth } from "../../services/api";

export const JoinRoom = () => {
  const { joinRoom, isConnected } = useChat();
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    localStorage.getItem("dialogue_username") || ""
  );
  const [roomName, setRoomName] = useState(
    localStorage.getItem("dialogue_room") || "geral"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TanStack Query: verifica a saúde do backend em segundo plano
  const { data: health, isLoading: isCheckingHealth } = useQuery({
    queryKey: ["backendHealth"],
    queryFn: fetchBackendHealth,
    refetchInterval: 15000,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !roomName.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await joinRoom(username.trim(), roomName.trim());
      navigate("/chat");
    } catch (error) {
      console.error("Erro ao ingressar na sala:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 2,
        position: "relative",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 420,
          width: "100%",
          borderRadius: 4,
          bgcolor: "background.paper",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Button
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/welcome")}
            sx={{ color: "text.secondary" }}
          >
            Voltar
          </Button>

          <Chip
            icon={
              <FiberManualRecordRoundedIcon
                sx={{
                  fontSize: 10,
                  color: isConnected || health?.status === "Healthy" ? "success.main" : "warning.main",
                }}
              />
            }
            label={isCheckingHealth ? "Verificando..." : health?.status === "Healthy" ? "API Online" : "Conectando"}
            size="small"
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "0.75rem",
            }}
          />
        </Box>

        <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ fontWeight: 700 }}>
          Ingressar no Chat
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Escolha seu apelido e a sala para começar a conversar.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            label="Seu Nome / Apelido"
            variant="outlined"
            fullWidth
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Nome da Sala"
            variant="outlined"
            fullWidth
            required
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TagRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={!username.trim() || !roomName.trim() || isSubmitting}
            endIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <LoginRoundedIcon />}
            sx={{ mt: 1, py: 1.4 }}
          >
            {isSubmitting ? "Entrando..." : "Entrar na Sala"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default JoinRoom;
