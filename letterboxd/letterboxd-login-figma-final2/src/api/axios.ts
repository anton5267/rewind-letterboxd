import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });
const csrfClient = axios.create({ baseURL: "/api", withCredentials: true });
let csrfRequest: Promise<void> | null = null;
let refreshRequest: Promise<void> | null = null;

function cookie(name: string) {
  const entry = document.cookie.split("; ").find(part => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

async function ensureCsrf() {
  if (cookie("XSRF-TOKEN")) return;
  if (!csrfRequest) {
    csrfRequest = csrfClient.get("/auth/csrf").then(() => undefined).finally(() => { csrfRequest = null; });
  }
  await csrfRequest;
}

api.interceptors.request.use(async config => {
  if (!["get", "head", "options"].includes(config.method?.toLowerCase() ?? "")) {
    await ensureCsrf();
    const token = cookie("XSRF-TOKEN");
    if (token) config.headers.set("X-XSRF-TOKEN", token);
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
      refreshRequest = api.post("/auth/refresh").then(() => undefined).finally(() => { refreshRequest = null; });
    }
    await refreshRequest;
    return api(request);
  } catch {
    return Promise.reject(error);
  }
});

export default api;
