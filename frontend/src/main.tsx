import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import "./global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
    <AppErrorBoundary>
      {import.meta.env.VITE_PUBLIC_CATALOG_ONLY === "true"
        ? <App />
        : <AuthProvider><App /></AuthProvider>}
    </AppErrorBoundary>
  </BrowserRouter>
);
