import { API } from "@/lib/api";
import {
  AuthUser,
  getApiErrorMessage,
  getAuthHeaders,
  readApiResponse,
} from "@/lib/auth";

const accountRequest = async <T>(
  path: string,
  token: string,
  options: {
    method?: "PATCH" | "DELETE";
    body?: unknown;
  },
) => {
  const headers: HeadersInit = options.body
    ? { "Content-Type": "application/json" }
    : {};

  const response = await fetch(`${API}${path}`, {
    method: options.method,
    headers: getAuthHeaders(token, headers),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const payload = await readApiResponse(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Request failed."));
  }

  return payload as T;
};

export const updateCurrentUser = (
  token: string,
  body: {
    name?: string;
    email?: string;
    location?: AuthUser["location"];
    searchRadiusKm?: number;
  },
) =>
  accountRequest<{ message: string; user: AuthUser }>("/api/auth/me", token, {
    method: "PATCH",
    body,
  });

export const resetCurrentUserPassword = (
  token: string,
  body: { currentPassword: string; newPassword: string },
) =>
  accountRequest<{ message: string }>("/api/auth/reset-password", token, {
    method: "PATCH",
    body,
  });

export const deleteCurrentUserAccount = (token: string, password: string) =>
  accountRequest<{ message: string }>("/api/auth/me", token, {
    method: "DELETE",
    body: { password },
  });
