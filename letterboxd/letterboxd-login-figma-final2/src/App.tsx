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
import PublicLists from "./pages/PublicLists";
import PublicProfile from "./pages/PublicProfile";
import Person from "./pages/Person";
import About from "./pages/About";
import Community from "./pages/Community";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import AdminDashboard from "./pages/AdminDashboard";
import Journal from "./pages/Journal";
import JournalArticle from "./pages/JournalArticle";
import ServicePage from "./pages/ServicePage";
import Layout from "./layout/Layout";

function LegacyRedirect() {
  const location = useLocation();
  const target = location.pathname === "/" ? "/uk/home" : `/uk${location.pathname}`;
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
    <Route path="notifications" element={<Layout><Notifications /></Layout>} />
    <Route path="messages" element={<Layout><Messages /></Layout>} />
    <Route path="admin" element={<Layout><AdminDashboard /></Layout>} />
    <Route path="journal" element={<Layout><Journal /></Layout>} />
    <Route path="journal/:slug" element={<Layout><JournalArticle /></Layout>} />
    <Route path="help" element={<Layout><ServicePage kind="help" /></Layout>} />
    <Route path="contact" element={<Layout><ServicePage kind="contact" /></Layout>} />
    <Route path="rules" element={<Layout><ServicePage kind="rules" /></Layout>} />
    <Route path="privacy" element={<Layout><ServicePage kind="privacy" /></Layout>} />
    <Route path="film-data" element={<Layout><ServicePage kind="film-data" /></Layout>} />
    <Route path="delete-account" element={<Layout><ServicePage kind="delete-account" /></Layout>} />
    <Route path="users/:id" element={<Layout><PublicProfile /></Layout>} />
    <Route path="people/:type/:id" element={<Layout><Person /></Layout>} />
    <Route path="lists" element={<Layout><UserLists /></Layout>} />
    <Route path="lists/discover" element={<Layout><PublicLists /></Layout>} />
    <Route path="lists/public/:id" element={<Layout><PublicList /></Layout>} />
    <Route path="about" element={<Layout><About /></Layout>} />
    <Route path="community" element={<Layout><Community /></Layout>} />
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
