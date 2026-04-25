import { createAdminClient } from "@/lib/supabase/admin";

// Fixed demo identity — auth is stubbed out so the whole booking flow
// can be exercised without sign-in. All trips/bookings are scoped to this id.
//
// The schema FKs user_id → auth.users(id), so the demo user must exist
// in auth.users. We ensure it on boot via the admin client.
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_USER_EMAIL = "demo@wanderly.test";

let ensurePromise: Promise<void> | null = null;

async function ensureDemoUserExists() {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(DEMO_USER_ID);
  if (data?.user) return;
  // Create if missing. If another request created it in parallel, ignore 422.
  const { error } = await admin.auth.admin.createUser({
    user_metadata: { demo: true },
    email: DEMO_USER_EMAIL,
    email_confirm: true,
    id: DEMO_USER_ID,
  } as Parameters<typeof admin.auth.admin.createUser>[0] & { id: string });
  if (error && !/already/i.test(error.message)) throw error;
}

export async function getDemoContext() {
  if (!ensurePromise) ensurePromise = ensureDemoUserExists();
  await ensurePromise;
  return {
    supabase: createAdminClient(),
    user: { id: DEMO_USER_ID, email: DEMO_USER_EMAIL },
  };
}
