import { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi } from "../api/auth.api";
import api from "../api/axios";

interface AuthContextType {
  isAuth: boolean;
  ready: boolean;
  user: { id: number; username: string; role: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthContextType["user"]>(null);

  useEffect(() => {
    api.get<AuthContextType["user"]>("/users/me")
      .then(({ data }) => { setIsAuth(true); setUser(data); })
      .catch(() => { setIsAuth(false); setUser(null); })
      .finally(() => setReady(true));
  }, []);

  const login = async (email: string, password: string) => {
    await loginApi(email, password);
    const { data } = await api.get<AuthContextType["user"]>("/users/me");
    setUser(data);
    setIsAuth(true);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setIsAuth(false);
    setUser(null);
  };

  return <AuthContext.Provider value={{ isAuth, ready, user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
