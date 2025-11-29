import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

// device id for like/unlike
let deviceId = localStorage.getItem("device_id");
if (!deviceId) {
  deviceId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  localStorage.setItem("device_id", deviceId);
}
api.interceptors.request.use((cfg) => {
  cfg.headers["X-Client-Id"] = deviceId;
  return cfg;
});
