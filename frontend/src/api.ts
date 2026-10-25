/** Same-origin API; Vite proxies /api during development. No credentials are persisted. */
export async function apiRequest<T = unknown>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401 && token)
      window.dispatchEvent(
        new CustomEvent("session-expired", { detail: { token } }),
      );
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map(
                (item: { loc?: string[]; msg?: string }) =>
                  `${item.loc?.slice(1).join(".") || "Input"}: ${item.msg || "Invalid value"}`,
              )
              .join("; ")
          : `Request failed (${response.status}). Please try again.`;
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
