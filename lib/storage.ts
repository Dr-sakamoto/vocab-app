const isClient = typeof window !== "undefined";

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!isClient) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    if (!isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  getString(key: string, fallback: string): string {
    if (!isClient) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? raw : fallback;
    } catch {
      return fallback;
    }
  },
  setString(key: string, value: string): void {
    if (!isClient) return;
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};
export default storage;
