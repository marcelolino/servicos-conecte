import React, { useState, useEffect, createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, getAuthToken, removeAuthToken, setAuthToken } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading: loading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
    enabled: isAuthenticated && !isLoggingOut,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const login = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsLoggingOut(true);
    
    // Set logout flag to suppress error messages
    sessionStorage.setItem('logout-in-progress', 'true');
    
    removeAuthToken();
    setIsAuthenticated(false);
    
    // Cancel all queries and clear cache
    queryClient.cancelQueries();
    queryClient.clear();
    
    // Reset logging out state after a short delay
    setTimeout(() => {
      setIsLoggingOut(false);
      sessionStorage.removeItem('logout-in-progress');
    }, 500);
  };

  useEffect(() => {
    // Update API request headers when authentication changes
    const token = getAuthToken();
    if (token) {
      // This would be handled by the queryClient interceptor
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const value = {
    user: user || null,
    loading,
    login,
    logout,
    isAuthenticated,
    isLoggingOut,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: value },
    children
  );
};