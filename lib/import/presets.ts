/**
 * Column-mapping presets for import source platforms (best-effort aliases;
 * the user can always remap) plus fuzzy header matching.
 */

export type PlatformId =
  | "jobber"
  | "zenmaid"
  | "bookingkoala"
  | "housecallpro"
  | "generic";

export const PLATFORM_IDS: PlatformId[] = [
  "jobber",
  "zenmaid",
  "bookingkoala",
  "housecallpro",
  "generic",
];

/** TidyPro fields a CSV column can map to (null = do not import). */
export const TIDYPRO_FIELDS = [
  "name",
  "first_name",
  "last_name",
  "email",
  "phone",
  "customer_type",
  "notes",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "zip",
  "appt_customer_email",
  "appt_date",
  "appt_start",
  "appt_end",
  "appt_service",
  "appt_notes",
  "appt_recurrence",
] as const;

export type TidyProField = (typeof TIDYPRO_FIELDS)[number];

/** Alias lists: field -> header strings that suggest it. */
type AliasMap = Partial<Record<TidyProField, string[]>>;

const JOBBER: AliasMap = {
  first_name: ["first name", "firstname"],
  last_name: ["last name", "lastname"],
  email: ["email", "e-mail"],
  phone: ["phone", "mobile", "cell"],
  address_line1: ["billing street", "street", "address"],
  city: ["billing city", "city"],
  state: ["billing state", "state", "province"],
  zip: ["billing zip", "billing postal code", "zip", "postal code"],
  notes: ["notes", "client notes"],
};

const ZENMAID: AliasMap = {
  name: ["name", "contact name", "client"],
  email: ["email"],
  phone: ["phone"],
  address_line1: ["address"],
  city: ["city"],
  state: ["state"],
  zip: ["zip"],
  notes: ["notes"],
  appt_date: ["appointment date", "date"],
  appt_start: ["start time", "start"],
  // The customer column may hold an email or a name; linking handles both.
  appt_customer_email: ["customer", "client name"],
};

const BOOKING_KOALA: AliasMap = {
  first_name: ["first name"],
  last_name: ["last name"],
  email: ["email"],
  phone: ["phone"],
  address_line1: ["address"],
  city: ["city"],
  state: ["state"],
  zip: ["zip"],
  notes: ["notes"],
};

const HOUSECALL_PRO: AliasMap = {
  first_name: ["first name"],
  last_name: ["last name"],
  email: ["email"],
  phone: ["mobile", "phone"],
  address_line1: ["street", "address"],
  city: ["city"],
  state: ["state"],
  zip: ["zip"],
  notes: ["notes"],
  appt_date: ["scheduled date", "date"],
  appt_customer_email: ["customer"],
};

/** Generic fallback aliases used for every platform after its own presets. */
const GENERIC: AliasMap = {
  name: ["name", "full name", "customer name", "contact name"],
  first_name: ["first name", "firstname", "given name"],
  last_name: ["last name", "lastname", "surname", "family name"],
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "phone number", "mobile", "cell", "telephone"],
  customer_type: ["customer type", "type"],
  notes: ["notes", "note", "comments"],
  address_line1: ["address", "street", "street address", "address line 1", "line 1"],
  address_line2: ["address line 2", "line 2", "apt", "suite", "unit"],
  city: ["city", "town"],
  state: ["state", "province", "region"],
  zip: ["zip", "zip code", "postal code", "postcode"],
  appt_customer_email: ["customer email", "client email", "customer", "client"],
  appt_date: ["date", "appointment date", "service date", "scheduled date"],
  appt_start: ["start", "start time", "time", "start datetime"],
  appt_end: ["end", "end time"],
  appt_service: ["service", "service name", "service type"],
  appt_notes: ["appointment notes", "visit notes"],
  appt_recurrence: ["recurrence", "frequency"],
};

const PRESETS: Record<PlatformId, AliasMap> = {
  jobber: JOBBER,
  zenmaid: ZENMAID,
  bookingkoala: BOOKING_KOALA,
  housecallpro: HOUSECALL_PRO,
  generic: {},
};

/** Lowercase, strip everything that isn't a letter or digit. */
export function fuzzyHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Suggest a field for every detected header. Each header maps to at most
 * one field (first field wins), and a field is only suggested once.
 */
export function suggestMapping(
  platform: PlatformId,
  headers: string[],
): Record<string, TidyProField | null> {
  const preset = PRESETS[platform];
  const mapping: Record<string, TidyProField | null> = {};
  const usedFields = new Set<TidyProField>();

  for (const header of headers) {
    const norm = fuzzyHeader(header);
    let found: TidyProField | null = null;

    const tryAliases = (aliases: AliasMap) => {
      if (found) return;
      for (const field of TIDYPRO_FIELDS) {
        if (usedFields.has(field)) continue;
        const list = aliases[field] ?? [];
        if (list.some((a) => fuzzyHeader(a) === norm)) {
          found = field;
          break;
        }
      }
    };

    tryAliases(preset);
    tryAliases(GENERIC);
    if (found) usedFields.add(found);
    mapping[header] = found;
  }
  return mapping;
}
