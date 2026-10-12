import { Platform } from "react-native";

export const API = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

// In-memory copy of the session token; AuthProvider keeps it in sync.
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (t: string | null) => {
  authToken = t;
};
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function authFetch(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (res.status === 401 && authToken) onUnauthorized?.();
  return res;
}

export type User = { user_id: string; email?: string | null; name?: string | null; picture?: string | null; provider?: string };

export type Report = {
  id: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  reporter_name?: string | null;
  photo_path?: string | null;
  user_id?: string | null;
  created_at: string;
};

export const fileUrl = (path: string) => `${API}/files/${path}`;

export async function exchangeSession(session_id: string): Promise<{ session_token: string; user: User }> {
  const res = await fetch(`${API}/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id }),
  });
  if (!res.ok) throw new Error("Falha no login com Google");
  return res.json();
}

export async function appleLogin(body: {
  identity_token: string;
  full_name?: string | null;
  email?: string | null;
}): Promise<{ session_token: string; user: User }> {
  const res = await fetch(`${API}/auth/apple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Falha no login com Apple");
  return res.json();
}

export async function fetchMe(): Promise<User | null> {
  const res = await authFetch("/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Falha ao verificar sessão");
  return res.json();
}

export async function logoutRequest() {
  await authFetch("/auth/logout", { method: "POST" }).catch(() => {});
}

export async function fetchReports(): Promise<Report[]> {
  const res = await authFetch("/reports");
  if (!res.ok) throw new Error("Falha ao carregar denúncias");
  return res.json();
}

export async function uploadPhoto(uri: string, mime = "image/jpeg"): Promise<string> {
  const name = `foto.${mime.split("/")[1] || "jpg"}`;
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, name);
  } else {
    form.append("file", { uri, name, type: mime } as any);
  }
  const res = await authFetch("/upload", { method: "POST", body: form });
  if (res.status === 402) throw new Error("Armazenamento sem créditos no momento.");
  if (!res.ok) throw new Error("Não foi possível enviar a foto.");
  const data = await res.json();
  return data.path;
}

export async function createReport(body: Omit<Report, "id" | "created_at" | "user_id">): Promise<Report> {
  const res = await authFetch("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Não foi possível salvar a denúncia.");
  return res.json();
}

export async function deleteReport(id: string) {
  const res = await authFetch(`/reports/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Falha ao remover");
}
