import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import type { TravelRequest } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body as { status?: string };
  if (!status || !["pending", "accepted", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "status must be pending | accepted | rejected" },
      { status: 422 }
    );
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("travel_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as TravelRequest });
}
