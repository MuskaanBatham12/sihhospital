import axios from "axios";

export const MAIN_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const PHYSIO_API_URL = import.meta.env.VITE_PHYSIO_URL || "http://localhost:8001";
export const PHYSIO_WS_URL = import.meta.env.VITE_PHYSIO_WS_URL || "ws://localhost:8001/physio/ws";

export const API = axios.create({
  baseURL: MAIN_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 6000,
});

export const PhysioAPI = axios.create({
  baseURL: PHYSIO_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 6000,
});

export default API;