import { apiRequest } from "./queryClient";
import type { User } from "@shared/schema";

export interface AuthUser extends Omit<User, "password"> {}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiRequest("POST", "/api/auth/login", { email, password });
  return response.json();
};

export const register = async (userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  userType: "client" | "provider";
}): Promise<AuthResponse> => {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  return response.json();
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await apiRequest("GET", "/api/auth/me");
  return response.json();
};

export const setAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
