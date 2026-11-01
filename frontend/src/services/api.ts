import axios from "axios";

const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;

  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    // Se estiver no dev server local do Vite (porta 5173), consome backend na porta 5000
    if (window.location.port === "5173") {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }

    // Se acessado via HTTPS (Cloudflare Tunnel), IP de rede (celular) ou porta 8080 (Nginx Gateway),
    // sempre utiliza a mesma origem da página para passar pelo proxy reverso do Nginx
    if (!isLocalhost || window.location.protocol === "https:" || window.location.port === "8080") {
      return window.location.origin;
    }

    if (envUrl && envUrl.trim() !== "") {
      return envUrl;
    }

    return window.location.origin;
  }

  return envUrl || "http://localhost:5000";
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
