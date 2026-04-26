import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import type { TravelRequest } from "@/lib/types";

interface Props {
  searchParams: Promise<{ token?: string; action?: string }>;
}

export default async function RespondPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : null;
  const action =
    sp.action === "accept"
      ? "accepted"
      : sp.action === "reject"
      ? "rejected"
      : null;

  if (!token || !action) {
    return <ErrorView message="Invalid link. Missing token or action." />;
  }

  const supabase = createServerSupabaseClient();

  // Look up by token
  const { data: existing, error: lookupError } = await supabase
    .from("travel_requests")
    .select("*")
    .eq("action_token", token)
    .single();

  if (lookupError || !existing) {
    return <ErrorView message="Request not found. The link may be invalid." />;
  }

  const req = existing as TravelRequest;

  if (req.token_used) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
          <h1 className="text-2xl font-bold">Already Responded</h1>
          <p className="mt-3 text-muted-foreground">
            Request <span className="font-medium">#{req.request_number}</span>{" "}
            for <span className="font-medium">{req.guest_name}</span> has
            already been{" "}
            <span className="font-medium capitalize">{req.status}</span>.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Update status and mark token used
  const { error: updateError } = await supabase
    .from("travel_requests")
    .update({ status: action, token_used: true })
    .eq("id", req.id);

  if (updateError) {
    return <ErrorView message="Failed to update request status. Please try again." />;
  }

  const accepted = action === "accepted";

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        {accepted ? (
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        )}
        <h1 className="text-2xl font-bold">
          Request #{req.request_number}{" "}
          {accepted ? "Accepted" : "Rejected"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Travel request for{" "}
          <span className="font-medium">{req.guest_name}</span> has been{" "}
          <span
            className={
              accepted ? "font-medium text-emerald-600" : "font-medium text-red-600"
            }
          >
            {accepted ? "accepted" : "rejected"}
          </span>
          .
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <PageTransition>
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">{message}</p>
        <Link href="/" className="mt-8 inline-block">
          <Button>Go Home</Button>
        </Link>
      </div>
    </PageTransition>
  );
}
