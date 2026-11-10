import { apiGet } from "./api";

export type HealthResponse = {
  status: string;
  time: string;
};

export function checkHealth() {
  return apiGet<HealthResponse>("/bgh/v1/health");
}
