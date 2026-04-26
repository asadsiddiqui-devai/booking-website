import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { travelRequestSchema } from "@/lib/zod/schemas";
import { sendEmail } from "@/lib/gmail/send";
import { buildAgentNotificationEmail } from "@/lib/gmail/templates";
import type { TravelRequest } from "@/lib/types";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("travel_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as TravelRequest[]);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = travelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const action_token = randomBytes(16).toString("hex");

  const supabase = createServerSupabaseClient();
  const { data: inserted, error: dbError } = await supabase
    .from("travel_requests")
    .insert([{ ...parsed.data, action_token }])
    .select()
    .single();

  if (dbError || !inserted) {
    return NextResponse.json(
      { error: dbError?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  const req = inserted as TravelRequest;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { subject, html } = buildAgentNotificationEmail(req, siteUrl);

  try {
    await sendEmail({
      to: req.travel_agent_email,
      subject,
      html,
      replyTo: req.guest_name,
    });
  } catch (emailErr) {
    console.error("Email send failed:", emailErr);
    return NextResponse.json(
      { data: req, warning: "Request saved but email notification failed" },
      { status: 201 }
    );
  }

  return NextResponse.json({ data: req }, { status: 201 });
}
