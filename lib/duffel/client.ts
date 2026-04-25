const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

export class DuffelError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function duffelRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) throw new DuffelError("DUFFEL_ACCESS_TOKEN is missing", 500);

  const url = new URL(path, DUFFEL_BASE);
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": DUFFEL_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify({ data: body }) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // Duffel returned non-JSON (feature not enabled, maintenance, etc.)
    throw new DuffelError(
      text.slice(0, 200) || `Duffel request failed (${res.status})`,
      res.status,
    );
  }

  if (!res.ok) {
    const msg =
      (json?.errors as { message?: string }[])?.[0]?.message ?? `Duffel request failed (${res.status})`;
    throw new DuffelError(msg, res.status, json);
  }

  return json as T;
}

export function duffelGet<T>(path: string): Promise<T> {
  return duffelRequest<T>("GET", path);
}

export function duffelPost<T>(path: string, body: unknown): Promise<T> {
  return duffelRequest<T>("POST", path, body);
}
