import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import Login from "./auth/Login";
import Register from "./auth/Register";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import Search from "./pages/Search";
import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import Profile from "./pages/Profile";
import UserLists from "./pages/UserLists";
import PublicList from "./pages/PublicList";
import About from "./pages/About";
import Layout from "./layout/Layout";

function LegacyRedirect() {
  const location = useLocation();
  const target = location.pathname === "/" ? "/uk/films" : `/uk${location.pathname}`;
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}

function LocalizedApp() {
  const { lang } = useParams();
  const location = useLocation();
  useEffect(() => { document.documentElement.lang = lang === "en" ? "en" : "uk"; }, [lang]);
  if (lang !== "uk" && lang !== "en") {
    return <Navigate to={`/uk${location.pathname}${location.search}${location.hash}`} replace />;
  }

  return <Routes>
    <Route index element={<Navigate to="home" replace />} />
    <Route path="home" element={<Layout><Home /></Layout>} />
    <Route path="films" element={<Layout><Search /></Layout>} />
    <Route path="films/:id" element={<Layout><MovieDetails /></Layout>} />
    <Route path="profile" element={<Layout><Profile /></Layout>} />
    <Route path="lists" element={<Layout><UserLists /></Layout>} />
    <Route path="lists/public/:id" element={<Layout><PublicList /></Layout>} />
    <Route path="about" element={<Layout><About /></Layout>} />
    <Route path="login" element={<Layout><Login /></Layout>} />
    <Route path="register" element={<Layout><Register /></Layout>} />
    <Route path="forgot-password" element={<Layout><ForgotPassword /></Layout>} />
    <Route path="reset-password" element={<Layout><ResetPassword /></Layout>} />
    <Route path="*" element={<Navigate to="films" replace />} />
  </Routes>;
}

export default function App() {
  return <Routes>
    <Route path="/:lang/*" element={<LocalizedApp />} />
    <Route path="*" element={<LegacyRedirect />} />
  </Routes>;
}
