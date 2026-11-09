import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSupabaseClient, isSupabaseAuthConfigured, usesHostedSupabaseAuth } from "./supabaseClient";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "/api";
const apiOrigin = new URL(apiBaseURL, window.location.href).origin;
const sameOriginApi = apiOrigin === window.location.origin;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const sharedApiConfig = {
  baseURL: apiBaseURL,
  withCredentials: sameOriginApi,
  ...(supabasePublishableKey ? { headers: { apikey: supabasePublishableKey } } : {}),
};
const api = axios.create(sharedApiConfig);
const csrfClient = axios.create(sharedApiConfig);
let csrfRequest: Promise<string> | null = null;
let refreshRequest: Promise<void> | null = null;

function cookie(name: string) {
  const entry = document.cookie.split("; ").find(part => part.startsWith(`${name}=`));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return null;
  }
}

async function ensureCsrf() {
  const cookieToken = cookie("XSRF-TOKEN");
  if (cookieToken) return cookieToken;
  // Login/logout can clear this cookie. A token cached before that boundary
  // must not replace fetching the new CSRF cookie.
  if (!csrfRequest) {
    csrfRequest = csrfClient.get<{ token: string }>("/auth/csrf")
      .then(({ data }) => cookie("XSRF-TOKEN") || data.token || "")
      .finally(() => { csrfRequest = null; });
  }
  const responseToken = await csrfRequest;
  return cookie("XSRF-TOKEN") || responseToken;
}

api.interceptors.request.use(async config => {
  if (usesHostedSupabaseAuth) {
    if (isSupabaseAuthConfigured) {
      const { data: { session }, error } = await getSupabaseClient().auth.getSession();
      if (error) throw error;
      if (session?.access_token) config.headers.set("Authorization", `Bearer ${session.access_token}`);
      else config.headers.delete("Authorization");
    }
    return config;
  }
  if (!["get", "head", "options"].includes(config.method?.toLowerCase() ?? "")) {
    const token = await ensureCsrf();
    if (token) config.headers.set("X-XSRF-TOKEN", token);
    else config.headers.delete("X-XSRF-TOKEN");
  }
  return config;
});

api.interceptors.response.use(response => response, async (error: AxiosError) => {
  const request = error.config as (InternalAxiosRequestConfig & { retried?: boolean }) | undefined;
  if (error.response?.status !== 401 || !request || request.retried || request.url?.startsWith("/auth/")) {
    return Promise.reject(error);
  }
  request.retried = true;
  try {
    if (usesHostedSupabaseAuth) {
      const { data, error: refreshError } = await getSupabaseClient().auth.refreshSession();
      if (refreshError || !data.session) throw refreshError ?? error;
      request.headers.set("Authorization", `Bearer ${data.session.access_token}`);
      return api(request);
    }
    if (!refreshRequest) {
      refreshRequest = api.post<void>("/auth/refresh").then(() => undefined).finally(() => { refreshRequest = null; });
    }
    await refreshRequest;
    return api(request);
  } catch {
    return Promise.reject(error);
  }
});

export default api;
