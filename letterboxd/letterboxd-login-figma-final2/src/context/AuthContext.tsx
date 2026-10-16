import { createContext, useContext, useState } from "react";
import { login as loginApi } from "../api/auth.api";

interface AuthContextType {
  isAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));

  const login = async (email: string, password: string) => {
    const { data } = await loginApi(email, password);
    localStorage.setItem("token", data.token);
    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
