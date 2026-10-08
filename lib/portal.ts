import { createServiceClient } from "@/lib/supabase/server";

export type PortalContext = {
  token: string;
  company: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    timezone: string;
    stripe_account_id: string | null;
    stripe_onboarded: boolean;
  };
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
};

/**
 * Resolve a portal bearer token to its company + customer.
 * Uses the service-role key: token possession IS the authorization here,
 * since portal visitors have no Supabase session. Tokens should be treated
 * like passwords — long, random, and revocable.
 */
export async function getPortalContext(token: string): Promise<PortalContext | null> {
  const svc = await createServiceClient();
  const { data } = await svc
    .from("portal_tokens")
    .select("token, expires_at, companies(id, name, phone, email, timezone, stripe_account_id, stripe_onboarded), customers(id, name, email, phone)")
    .eq("token", token)
    .maybeSingle();

  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
  if (!company || !customer) return null;

  return {
    token: data.token,
    company: {
      ...company,
      timezone: company.timezone || "America/New_York",
    },
    customer,
  };
}
