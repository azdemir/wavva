/**
 * Expert residential checklist generator — no API key, no cost, instant.
 *
 * Produces a room-by-room cleaning checklist plus "surprise & delight"
 * extras (the little wow touches customers don't expect) from a short
 * description of the home. The output shape intentionally mirrors what an
 * LLM backend would return, so a model-backed provider can be swapped in
 * later behind the same `generateChecklist(input)` signature.
 */

export type GeneratorInput = {
  homeType: "house" | "apartment" | "condo";
  bedrooms: number;
  bathrooms: number;
  serviceLevel: "standard" | "deep" | "move-out";
  pets: boolean;
  kids: boolean;
  notes?: string;
};

export type GeneratedRoom = { name: string; tasks: string[] };
export type GeneratedChecklist = {
  rooms: GeneratedRoom[];
  surpriseExtras: string[];
};

const KITCHEN_STANDARD = [
  "Clear counters and wipe down all surfaces",
  "Scrub sink, faucet, and drain area",
  "Wipe appliance exteriors (fridge, dishwasher, microwave)",
  "Clean microwave inside and out",
  "Wipe stovetop and control knobs",
  "Spot-clean cabinet fronts and handles",
  "Empty trash, replace liner, wipe can rim",
  "Sweep and mop floor, including under edges",
];

const KITCHEN_DEEP = [
  "Degrease backsplash and wall behind stove",
  "Clean inside oven and oven racks",
  "Wipe inside cabinets and drawers",
  "Descale faucet and polish fixtures",
  "Clean range hood and filter",
  "Scrub grout lines on tile floors",
];

const KITCHEN_MOVEOUT = [
  "Clean inside refrigerator and freezer, including behind",
  "Clean inside all cabinets, drawers, and pantry shelves",
  "Detail-clean dishwasher interior and filter",
  "Polish all fixtures and hardware",
];

const BATHROOM_STANDARD = [
  "Scrub toilet bowl, seat, lid, and base",
  "Clean mirror and shine fixtures",
  "Wipe counters and sink",
  "Scrub shower/tub, tiles, and glass doors",
  "Replace used towels with fresh ones",
  "Empty trash and replace liner",
  "Sweep and mop floor, behind toilet included",
];

const BATHROOM_DEEP = [
  "Scrub grout with brush and rinse tile walls",
  "Descale showerhead and faucets",
  "Wash trash can inside and out",
  "Wipe baseboards",
];

const BATHROOM_MOVEOUT = [
  "Detail-scrub every tile edge, corner, and caulk line",
  "Remove limescale from all fixtures",
  "Clean inside vanity cabinets and drawers",
];

const BEDROOM_STANDARD = [
  "Change bed linens (or straighten bedding neatly)",
  "Dust all surfaces, nightstands, and lamps",
  "Vacuum or mop floors, under bed edges included",
  "Empty trash and replace liner",
  "Arrange pillows neatly",
];

const BEDROOM_DEEP = [
  "Vacuum mattress edges and under the bed",
  "Dust ceiling fan blades and vents",
  "Wipe baseboards and window sills",
];

const LIVING_STANDARD = [
  "Dust shelves, frames, electronics, and decor",
  "Vacuum upholstery and under cushions",
  "Vacuum/mop floors, including corners",
  "Fluff and arrange cushions and throws",
  "Wipe light switches, remotes, and doorknobs",
];

const LIVING_DEEP = [
  "Dust ceiling fans, vents, and blinds",
  "Spot-clean upholstery stains",
  "Wipe baseboards throughout",
];

const ENTRY_STANDARD = [
  "Shake out or vacuum entry mat",
  "Wipe front door handle and entry surfaces",
  "Dust hallway surfaces and vacuum runner",
];

const LAUNDRY_TASKS = [
  "Wipe washer and dryer exteriors",
  "Clean lint trap area and fold stray items",
  "Mop laundry floor",
];

const PET_TASKS = [
  "Vacuum pet hair from upholstery and rugs (two passes)",
  "Wash food and water bowls",
  "Lint-roll furniture throws and blankets",
];

const KID_TASKS = [
  "Sanitize high-touch toys and play surfaces",
  "Wipe fingerprints from walls and doors at child height",
];

const SURPRISE_EXTRAS = [
  "Fold toilet paper into a hotel point",
  "Arrange throw pillows symmetrically",
  "Wipe every light switch and doorknob in the home",
  "Leave a handwritten thank-you note on the counter",
  "Refill soap dispensers and replace the kitchen sponge",
  "Fold bath towels hotel-style",
  "Straighten books, magazines, and remotes",
  "Take out ALL trash, including small bathroom bins",
  "Air out the home for 10 minutes before leaving",
  "Clean the entryway mirror and front-door glass",
];

const SURPRISE_MOVEOUT = [
  "Final walkthrough: open every cabinet and closet for missed spots",
  "Leave the home smelling fresh and move-in ready",
];

function levelTasks(
  standard: string[],
  deep: string[],
  moveout: string[],
  level: GeneratorInput["serviceLevel"],
): string[] {
  if (level === "deep") return [...standard, ...deep];
  if (level === "move-out") return [...standard, ...moveout];
  return standard;
}

function numbered(base: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${base} ${i + 1}`);
}

/**
 * Build a tailored residential checklist. Pure function — deterministic,
 * instant, and free. Total tasks are capped so the result always fits the
 * 100-item template limit.
 */
export function generateChecklist(input: GeneratorInput): GeneratedChecklist {
  const { bedrooms, bathrooms, serviceLevel, pets, kids } = input;
  const rooms: GeneratedRoom[] = [];

  rooms.push({
    name: "Kitchen",
    tasks: levelTasks(KITCHEN_STANDARD, KITCHEN_DEEP, KITCHEN_MOVEOUT, serviceLevel),
  });

  for (const name of numbered("Bathroom", bathrooms)) {
    rooms.push({
      name,
      tasks: levelTasks(BATHROOM_STANDARD, BATHROOM_DEEP, BATHROOM_MOVEOUT, serviceLevel),
    });
  }

  for (const name of numbered("Bedroom", bedrooms)) {
    const tasks = levelTasks(BEDROOM_STANDARD, BEDROOM_DEEP, [], serviceLevel);
    if (serviceLevel === "move-out") {
      tasks.push("Wipe inside closets and shelving", "Vacuum carpet edges wall-to-wall");
    }
    rooms.push({ name, tasks });
  }

  rooms.push({
    name: "Living & dining areas",
    tasks: levelTasks(LIVING_STANDARD, LIVING_DEEP, [], serviceLevel),
  });

  rooms.push({ name: "Entryway & hallways", tasks: [...ENTRY_STANDARD] });
  rooms.push({ name: "Laundry area", tasks: [...LAUNDRY_TASKS] });

  if (pets || kids) {
    const extras: string[] = [];
    if (pets) extras.push(...PET_TASKS);
    if (kids) extras.push(...KID_TASKS);
    rooms.push({ name: "Family & pet touches", tasks: extras });
  }

  const surpriseExtras =
    serviceLevel === "move-out" ? [...SURPRISE_MOVEOUT] : [...SURPRISE_EXTRAS];

  // Hard cap: 100 template items total.
  const flat = rooms.flatMap((r) => r.tasks).length + surpriseExtras.length;
  if (flat > 100) {
    const overflow = flat - 100;
    const last = rooms[rooms.length - 1];
    last.tasks = last.tasks.slice(0, Math.max(0, last.tasks.length - overflow));
  }

  return { rooms, surpriseExtras };
}

/** Flatten a generated checklist into template items ("Room — task"). */
export function flattenChecklist(g: GeneratedChecklist): string[] {
  const items = g.rooms.flatMap((r) => r.tasks.map((t) => `${r.name} — ${t}`));
  for (const s of g.surpriseExtras) items.push(`Surprise touch — ${s}`);
  return items.slice(0, 100);
}
