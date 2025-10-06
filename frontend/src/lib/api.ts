export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function apiGet(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}
