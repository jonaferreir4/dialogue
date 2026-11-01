import React from "react";
import { Box, Typography, styled } from "@mui/material";
import Avatar from "react-avatar";

const Dot = styled("span")(({ theme }) => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: theme.palette.primary.light,
  display: "inline-block",
  margin: "0 2px",
  animation: "typingPulse 1.2s infinite ease-in-out",
}));

interface TypingIndicatorProps {
  typingUser: string | null;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUser }) => {
  if (!typingUser) return null;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.2,
        px: 1.8,
        py: 0.8,
        borderRadius: "20px",
        backgroundColor: "rgba(30, 41, 59, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        maxWidth: "fit-content",
        mb: 1,
        "@keyframes typingPulse": {
          "0%, 100%": {
            transform: "translateY(0)",
            opacity: 0.4,
          },
          "50%": {
            transform: "translateY(-4px)",
            opacity: 1,
          },
        },
      }}
    >
      <Avatar name={typingUser} size="22" round textSizeRatio={2} />
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
        <strong style={{ color: "#818cf8" }}>{typingUser}</strong> está digitando
      </Typography>

      <Box sx={{ display: "inline-flex", alignItems: "center", ml: 0.5 }}>
        <Dot sx={{ animationDelay: "0s" }} />
        <Dot sx={{ animationDelay: "0.2s" }} />
        <Dot sx={{ animationDelay: "0.4s" }} />
      </Box>
    </Box>
  );
};

export default TypingIndicator;
