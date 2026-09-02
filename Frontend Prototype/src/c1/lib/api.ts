import product from "../../../../packages/contracts/product.json";
import { mockApi } from "./mockApi";

export const PRODUCT = product;

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.status = status;
    this.detail = detail;
  }
}

export function persistCsrf(token?: string) {
  if (token && typeof sessionStorage !== "undefined") sessionStorage.setItem("cnip_csrf", token);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await mockApi<T>(path, init);
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(404, error.message);
    }
    throw error;
  }
}
