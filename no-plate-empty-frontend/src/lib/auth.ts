import { API } from "@/lib/api";

export type UserRole = "SUPER_ADMIN" | "DONOR" | "NGO";

export interface UserLocation {
  id?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  latitudeDelta?: number;
  longitude?: number;
  longitudeDelta?: number;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  isBlocked: boolean;
  isRejected?: boolean;
  rejectedAt?: string | null;
  rejectionDeleteAt?: string | null;
  location?: UserLocation;
  searchRadiusKm?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiPayload {
  message?: string;
  error?: string;
  token?: string;
  role?: UserRole;
  [key: string]: unknown;
}

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "auth_user";

const getStorage = () =>
  typeof window !== "undefined" ? window.localStorage : null;

export const getStoredToken = () => getStorage()?.getItem(TOKEN_STORAGE_KEY) ?? null;

export const setStoredToken = (token: string) => {
  getStorage()?.setItem(TOKEN_STORAGE_KEY, token);
};

export const getStoredUser = (): AuthUser | null => {
  const storedUser = getStorage()?.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    getStorage()?.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const setStoredUser = (user: AuthUser) => {
  getStorage()?.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredSession = () => {
  getStorage()?.removeItem(TOKEN_STORAGE_KEY);
  getStorage()?.removeItem(USER_STORAGE_KEY);
};

export const getRoleHomePath = (role: UserRole) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin/dashboard";
    case "DONOR":
      return "/donor/home";
    case "NGO":
      return "/recipient/home";
    default:
      return "/";
  }
};

export const getDashboardPath = (role: UserRole) => getRoleHomePath(role);

export const getRoleHomeLabel = (role: UserRole) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "Dashboard";
    case "DONOR":
      return "Donor Page";
    case "NGO":
      return "Recipient Page";
    default:
      return "Home";
  }
};

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "DONOR":
      return "Donor";
    case "NGO":
      return "NGO";
    default:
      return "User";
  }
};

const normalizeApiMessage = (message?: string) => {
  if (!message) {
    return message;
  }

  if (message.startsWith("Admin rejected your registration.")) {
    return message;
  }

  switch (message) {
    case "Approval pending":
      return "Your account is not approved yet. Please wait for admin approval.";
    case "User blocked":
      return "Your account has been blocked. Please contact the administrator.";
    case "Your rejected registration has been deleted. Please register again.":
      return "Your rejected registration has been deleted. Please register again.";
    case "Invalid credentials":
      return "The email or password you entered is incorrect.";
    case "User not found":
      return "We could not find an account with that email address.";
    case "No token provided":
    case "Invalid token":
    case "Token has been revoked":
      return "Your session has expired. Please sign in again.";
    default:
      return message;
  }
};

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return fallback;
};

export const getApiErrorMessage = (
  payload: ApiPayload | null,
  fallback = "Something went wrong",
) => normalizeApiMessage(payload?.message || payload?.error || fallback) ?? fallback;

export const readApiResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ApiPayload;
  } catch {
    return { message: text } as ApiPayload;
  }
};

export const getAuthHeaders = (
  token: string,
  headers: HeadersInit = {},
): HeadersInit => ({
  ...headers,
  Authorization: `Bearer ${token}`,
});

export const fetchCurrentUser = async (token: string) => {
  const response = await fetch(`${API}/api/auth/me`, {
    headers: getAuthHeaders(token),
  });
  const payload = await readApiResponse(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Unable to load your account."));
  }

  return payload as AuthUser;
};
