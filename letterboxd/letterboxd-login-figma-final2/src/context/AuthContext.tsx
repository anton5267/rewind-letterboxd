import { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi } from "../api/auth.api";
import api from "../api/axios";

interface AuthContextType {
  isAuth: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.get("/users/me")
      .then(() => setIsAuth(true))
      .catch(() => setIsAuth(false))
      .finally(() => setReady(true));
  }, []);

  const login = async (email: string, password: string) => {
    await loginApi(email, password);
    setIsAuth(true);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setIsAuth(false);
  };

  return <AuthContext.Provider value={{ isAuth, ready, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
