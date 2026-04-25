import { NextResponse, type NextRequest } from "next/server";
import { suggestPlaces } from "@/lib/duffel/flights";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const results = await suggestPlaces(q);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
