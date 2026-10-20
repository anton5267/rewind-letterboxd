import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });
const csrfClient = axios.create({ baseURL: "/api", withCredentials: true });
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
