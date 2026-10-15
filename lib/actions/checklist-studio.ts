"use server";

import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { hasFeature, isPlanId } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import {
  generateChecklist,
  type GeneratedChecklist,
} from "@/lib/checklists/generator";

const inputSchema = z.object({
  homeType: z.enum(["house", "apartment", "condo"]),
  bedrooms: z.coerce.number().int().min(0).max(10),
  bathrooms: z.coerce.number().int().min(1).max(10),
  serviceLevel: z.enum(["standard", "deep", "move-out"]),
  pets: z.coerce.boolean(),
  kids: z.coerce.boolean(),
  notes: z.string().trim().max(500).optional(),
});

export type GenerateResult =
  | { ok: true; checklist: GeneratedChecklist }
  | { ok: false; error: "NOT_PERMITTED" | "RATE_LIMITED" | "INVALID" };

/**
 * Build a tailored residential checklist from the home description.
 * Owner-only, Growth+ feature gate, rate-limited per company. Runs on a
 * curated expert knowledge base — no AI key, no per-call cost, instant.
 */
export async function generateChecklistAction(
  input: unknown,
): Promise<GenerateResult> {
  const { company } = await requireOwner();
  const plan = isPlanId(company.plan) ? company.plan : "essential";
  if (!hasFeature(plan, "checklists")) return { ok: false, error: "NOT_PERMITTED" };

  const rl = await rateLimit(`checklist-gen:${company.id}`, 20, 24 * 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "RATE_LIMITED" };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };

  return { ok: true, checklist: generateChecklist(parsed.data) };
}
