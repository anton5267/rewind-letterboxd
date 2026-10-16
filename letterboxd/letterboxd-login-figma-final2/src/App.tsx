
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Register from "./auth/Register";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import Search from "./pages/Search";
import MovieDetails from "./pages/MovieDetails";
import Profile from "./pages/Profile";
import UserLists from "./pages/UserLists";
import About from "./pages/About";
import Layout from "./layout/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/films" replace />} />
      <Route path="/films" element={<Layout><Search /></Layout>} />
      <Route path="/films/:id" element={<Layout><MovieDetails /></Layout>} />
      <Route path="/profile" element={<Layout><Profile /></Layout>} />
      <Route path="/lists" element={<Layout><UserLists /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route
        path="/login"
        element={
          <Layout>
            <Login />
          </Layout>
        }
      />

      <Route path="/register" element={<Layout><Register /></Layout>} />

      <Route
        path="/forgot-password"
        element={
          <Layout>
            <ForgotPassword />
          </Layout>
        }
      />
      <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
    </Routes>
  );
}
