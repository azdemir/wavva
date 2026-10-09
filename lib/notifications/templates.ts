/**
 * Compatibility adapter — the template catalog now lives in
 * `lib/communications/templates.ts` (data-driven, with per-company
 * overrides). This module keeps the old import surface working.
 *
 * @deprecated Import from "@/lib/communications/templates" instead.
 */

import {
  renderCommunicationTemplate,
  type TemplateKey,
  type TemplateValues,
} from "@/lib/communications/templates";

export type { TemplateKey as TemplateName };

type Payload = Record<string, string | number | undefined>;

export function renderTemplate(
  template: TemplateKey,
  p: Payload,
): { subject: string; html: string; text: string } {
  return renderCommunicationTemplate(template, p as TemplateValues);
}
