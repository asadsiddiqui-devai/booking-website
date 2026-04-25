export class TravelpayoutsError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) throw new TravelpayoutsError("TRAVELPAYOUTS_TOKEN is missing", 500);
  return token;
}

export function getMarker(): string {
  return process.env.TRAVELPAYOUTS_MARKER ?? "";
}

export async function tpGet<T>(
  baseUrl: string,
  params: Record<string, string>,
  auth = true,
): Promise<T> {
  const url = new URL(baseUrl);
  if (auth) url.searchParams.set("token", getToken());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  const text = await res.text();

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new TravelpayoutsError(
      text.slice(0, 200) || `Request failed (${res.status})`,
      res.status,
    );
  }

  if (!res.ok) {
    const msg =
      (json as { message?: string })?.message ??
      `Travelpayouts request failed (${res.status})`;
    throw new TravelpayoutsError(msg, res.status);
  }

  return json as T;
}
