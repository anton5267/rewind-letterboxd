import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { capturePkceSignupCallback } from "./auth/authCallbackState";
import "./global.css";

capturePkceSignupCallback();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
    <AppErrorBoundary>
      <AuthProvider><App /></AuthProvider>
    </AppErrorBoundary>
  </BrowserRouter>
);
