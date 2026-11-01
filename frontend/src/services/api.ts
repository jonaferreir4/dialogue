import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
