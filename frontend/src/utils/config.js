const backendUrl = import.meta.env.VITE_BACKEND_URL;

if (!backendUrl) {
  console.error("VITE_BACKEND_URL is not defined! Please add it in environment variables.");
  throw new Error("Missing VITE_BACKEND_URL environment variable");
}

export const API_URL = backendUrl.trim().replace(/\/+$/, '');
