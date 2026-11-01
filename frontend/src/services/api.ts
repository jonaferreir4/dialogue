import axios from "axios";

const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    // No dev server local do Vite (porta 5173), consome backend na porta 5000 do mesmo host/IP
    if (window.location.port === "5173") {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    // Em produção, Docker Nginx (porta 8080) ou Tunnels HTTPS (Cloudflare/Ngrok), usa o mesmo origin
    return window.location.origin;
  }
  return "http://localhost:5000";
};

export const API_URL = getApiUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export const fetchBackendHealth = async (): Promise<HealthResponse> => {
  const { data } = await apiClient.get<HealthResponse>("/health");
  return data;
};
