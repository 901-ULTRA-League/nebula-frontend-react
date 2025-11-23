import type { Card, Stats } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message =
      (await response.text()) || `Request failed with ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};

export const fetchCards = async (filters: Record<string, string | number | boolean | undefined>) => {
  // Build query string from truthy filters
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });

  const url = `${API_BASE_URL}/cards${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);
  return handleResponse<Card[]>(response);
};

export const searchCards = async (query: string) => {
  const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  return handleResponse<Card[]>(response);
};

export const fetchCardByNumber = async (number: string) => {
  const trimmed = number.trim();
  const url = `${API_BASE_URL}/cards?number=${encodeURIComponent(trimmed)}`;
  const response = await fetch(url);
  const cards = await handleResponse<Card[]>(response);
  if (!cards.length) {
    throw new Error("Card not found");
  }
  return cards[0];
};

export const fetchStats = async () => {
  const url = `${API_BASE_URL}/stats`;
  const response = await fetch(url);
  return handleResponse<Stats>(response);
};
