import { api } from "./api";

export type HealthResponse = {
  status: string;
  timestamp: string;
  version: string;
};

export function checkHealth(): Promise<HealthResponse> {
  return api.request<HealthResponse>("/bgh/v1/health", { auth: false });
}
