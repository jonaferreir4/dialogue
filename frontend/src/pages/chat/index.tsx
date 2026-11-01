import { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Button,
  Chip,
  
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import TypingIndicator from "../../components/dot";

export function Chat() {
  const navigate = useNavigate();
  const {
    messages,
    connectedUsers,
    sendMessage,
    leaveChat,
    connectionStatus,
    sendStartTyping,
    sendStopTyping,
    typingUser,
    currentUser,
    currentRoom,
  } = useChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redireciona se não houver usuário ou sala configurados
  useEffect(() => {
    if (!currentUser || !currentRoom) {
      navigate("/join-room");
    }
  }, [currentUser, currentRoom, navigate]);

  // Auto-scroll suave para novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const textToSend = input;
    setInput("");
    sendStopTyping();
    try {
      await sendMessage(textToSend);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const handleLeaveChat = async () => {
    await leaveChat();
    navigate("/join-room");
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "";
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default", overflow: "hidden" }}>
      {/* Sidebar Lateral */}
      <Box
        sx={{
          width: { xs: 80, sm: 260 },
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Header do Sidebar */}
        <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TagRoundedIcon sx={{ color: "primary.main", fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }} noWrap>
              {currentRoom || "Geral"}
            </Typography>
          </Box>
        </Box>

        {/* Lista de Usuários Conectados */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1.5 }}>
          <Box sx={{ px: 1, py: 1, display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}>
            <PeopleAltRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Membros ({connectedUsers.length})
            </Typography>
          </Box>

          <List sx={{ p: 0 }}>
            {connectedUsers.map((user) => {
              const isMe = user.toLowerCase() === currentUser.toLowerCase();
              return (
                <ListItem
                  key={user}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    px: { xs: 1, sm: 1.5 },
                    py: 1,
                    bgcolor: isMe ? "rgba(99, 102, 241, 0.08)" : "transparent",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.03)" },
                  }}
                >
                  <Box sx={{ position: "relative", mr: { xs: 0, sm: 1.5 } }}>
                    <Avatar name={user} size="32" round textSizeRatio={2} />
                    <FiberManualRecordRoundedIcon
                      sx={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        fontSize: 10,
                        color: "success.main",
                        bgcolor: "background.paper",
                        borderRadius: "50%",
                      }}
                    />
                  </Box>

                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: isMe ? 700 : 500 }} noWrap>
                        {user} {isMe && <span style={{ color: "#818cf8", fontSize: "0.75rem" }}>(Você)</span>}
                      </Typography>
                    }
                    sx={{ display: { xs: "none", sm: "block" }, m: 0 }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Rodapé do Sidebar */}
        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            fullWidth
            startIcon={<LogoutRoundedIcon />}
            onClick={handleLeaveChat}
            sx={{
              display: { xs: "none", sm: "flex" },
              borderWidth: 1,
              "&:hover": { borderWidth: 1, bgcolor: "rgba(239, 68, 68, 0.1)" },
            }}
          >
            Sair da Sala
          </Button>

          <IconButton
            color="error"
            onClick={handleLeaveChat}
            sx={{ display: { xs: "flex", sm: "none" }, mx: "auto" }}
          >
            <LogoutRoundedIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Área Central de Conversa */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Barra Superior do Chat */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                #{currentRoom}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {connectedUsers.length} participante{connectedUsers.length !== 1 ? "s" : ""} online
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={
              <FiberManualRecordRoundedIcon
                sx={{
                  fontSize: 10,
                  color:
                    connectionStatus === "connected"
                      ? "success.main"
                      : connectionStatus === "reconnecting"
                      ? "warning.main"
                      : "error.main",
                }}
              />
            }
            label={
              connectionStatus === "connected"
                ? "Conectado"
                : connectionStatus === "reconnecting"
                ? "Reconectando..."
                : "Desconectado"
            }
            size="small"
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "0.75rem",
            }}
          />
        </Box>

        {/* Mensagens */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {messages.length === 0 && (
            <Box sx={{ m: "auto", textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body1">Nenhuma mensagem ainda.</Typography>
              <Typography variant="caption">Envie uma mensagem para iniciar o diálogo na sala #{currentRoom}!</Typography>
            </Box>
          )}

          {messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <Box key={msg.id} sx={{ alignSelf: "center", my: 1 }}>
                  <Chip
                    label={`${msg.message} • ${formatTime(msg.timestamp)}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.04)",
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  />
                </Box>
              );
            }

            const isMe = msg.user.toLowerCase() === currentUser.toLowerCase();

            return (
              <Box
                key={msg.id}
                sx={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: { xs: "85%", sm: "65%" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                }}
              >
                {!isMe && (
                  <Typography variant="caption" sx={{ color: "primary.light", fontWeight: 600, ml: 1, mb: 0.5 }}>
                    {msg.user}
                  </Typography>
                )}

                <Paper
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1.2,
                    borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    bgcolor: isMe ? "primary.main" : "rgba(255, 255, 255, 0.06)",
                    color: isMe ? "#ffffff" : "text.primary",
                    border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                    wordBreak: "break-word",
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: "0.925rem" }}>
                    {msg.message}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.4 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.68rem",
                        color: isMe ? "rgba(255, 255, 255, 0.7)" : "text.secondary",
                      }}
                    >
                      {formatTime(msg.timestamp)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            );
          })}

          <TypingIndicator typingUser={typingUser} />
          <div ref={messagesEndRef} />
        </Box>

        {/* Barra de Entrada de Mensagem */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            sx={{ display: "flex", gap: 1 }}
          >
            <TextField
              fullWidth
              size="medium"
              placeholder={`Mensagem em #${currentRoom}... (Enter para enviar)`}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                sendStartTyping();
              }}
              onBlur={() => sendStopTyping()}
              autoComplete="off"
            />

            <IconButton
              type="submit"
              color="primary"
              disabled={!input.trim()}
              sx={{
                bgcolor: input.trim() ? "primary.main" : "rgba(255, 255, 255, 0.05)",
                color: input.trim() ? "#ffffff" : "text.secondary",
                borderRadius: 2.5,
                width: 52,
                height: 52,
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              <SendRoundedIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Chat;
