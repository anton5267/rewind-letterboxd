import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { useLocale } from "./i18n";
import Layout from "./layout/Layout";
import RouteTransition from "./components/RouteTransition";

const Login = lazy(() => import("./auth/Login"));
const Register = lazy(() => import("./auth/Register"));
const ForgotPassword = lazy(() => import("./auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./auth/ResetPassword"));
const Search = lazy(() => import("./pages/Search"));
const GlobalSearch = lazy(() => import("./pages/GlobalSearch"));
const Home = lazy(() => import("./pages/Home"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const ReviewDetails = lazy(() => import("./pages/ReviewDetails"));
const PopularReviews = lazy(() => import("./pages/PopularReviews"));
const Profile = lazy(() => import("./pages/Profile"));
const UserLists = lazy(() => import("./pages/UserLists"));
const PublicList = lazy(() => import("./pages/PublicList"));
const PublicLists = lazy(() => import("./pages/PublicLists"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Person = lazy(() => import("./pages/Person"));
const About = lazy(() => import("./pages/About"));
const Community = lazy(() => import("./pages/Community"));
const PopularReviewers = lazy(() => import("./pages/PopularReviewers"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Messages = lazy(() => import("./pages/Messages"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Journal = lazy(() => import("./pages/Journal"));
const JournalArticle = lazy(() => import("./pages/JournalArticle"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LegacyRedirect() {
  const location = useLocation();
  const target = location.pathname === "/" ? "/uk/home" : `/uk${location.pathname}`;
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}

function RouteLoading() {
  const { t } = useLocale();
  return <main className="routeLoading" aria-labelledby="route-loading-title" aria-busy={true}><h1 id="route-loading-title" className="srOnly">{t("loading")}</h1><p role="status">{t("loading")}</p></main>;
}

function LocalizedApp() {
  const { lang } = useParams();
  const location = useLocation();
  useEffect(() => { document.documentElement.lang = lang === "en" ? "en" : "uk"; }, [lang]);
  if (lang !== "uk" && lang !== "en") {
    return <Navigate to={`/uk${location.pathname}${location.search}${location.hash}`} replace />;
  }

  return <Suspense fallback={<RouteLoading />}><Routes>
    <Route index element={<Navigate to="home" replace />} />
    <Route path="home" element={<Layout><Home /></Layout>} />
    <Route path="films" element={<Layout><Search /></Layout>} />
    <Route path="search" element={<Layout><GlobalSearch /></Layout>} />
    <Route path="films/:id" element={<Layout><MovieDetails /></Layout>} />
    <Route path="reviews" element={<Layout><PopularReviews /></Layout>} />
    <Route path="reviews/:id" element={<Layout><ReviewDetails /></Layout>} />
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
    <Route path="community/reviewers" element={<Layout><PopularReviewers /></Layout>} />
    <Route path="login" element={<Layout><Login /></Layout>} />
    <Route path="register" element={<Layout><Register /></Layout>} />
    <Route path="forgot-password" element={<Layout><ForgotPassword /></Layout>} />
    <Route path="reset-password" element={<Layout><ResetPassword /></Layout>} />
    {/* Keep unknown localized paths inside the language namespace so the
        Figma-inspired error state can offer the correct localized home link. */}
    <Route path="*" element={<Layout><NotFound /></Layout>} />
  </Routes></Suspense>;
}

export default function App() {
  return <><RouteTransition /><Routes>
    <Route path="/:lang/*" element={<LocalizedApp />} />
    <Route path="*" element={<LegacyRedirect />} />
  </Routes></>;
}
