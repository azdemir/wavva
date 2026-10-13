/**
 * TidyPro Studio — content registry.
 *
 * This is the LOW-CODE layer for the marketing site. Every editable piece of
 * website copy is described here once:
 *   - `default` is what the site renders when no override is saved,
 *   - the Studio website editor builds its forms from these definitions,
 *   - `paths` tells the save action which routes to revalidate so edits
 *     go live without a redeploy.
 *
 * To make a new piece of copy editable: add a definition below, then read it
 * in the component with `getContent("your.key")` from `@/lib/studio/content`.
 * No editor UI code changes needed.
 */

export type StudioPageId =
  | "global"
  | "home"
  | "features"
  | "pricing"
  | "faq"
  | "contact"
  | "demo";

export const STUDIO_PAGES: { id: StudioPageId; label: string }[] = [
  { id: "global", label: "Global" },
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
  { id: "demo", label: "Trial page" },
];

export type ListItemField =
  | { key: string; label: string; kind: "text"; max?: number }
  | { key: string; label: string; kind: "textarea"; rows?: number; max?: number }
  | { key: string; label: string; kind: "lines"; rows?: number; max?: number }
  | {
      key: string;
      label: string;
      kind: "select";
      options: { value: string; label: string }[];
    };

export type FieldDef =
  | { kind: "text"; max?: number }
  | { kind: "textarea"; rows?: number; max?: number }
  /** Multi-line textarea stored as a string array (one item per line). */
  | { kind: "lines"; rows?: number; max?: number; maxItems?: number }
  | { kind: "toggle" }
  | { kind: "number"; min?: number; max?: number }
  | {
      kind: "select";
      options: { value: string; label: string }[];
    }
  | { kind: "list"; item: ListItemField[]; maxItems?: number; minItems?: number }
  /** Simple array of strings (e.g. rotating headlines, city list). */
  | { kind: "string-list"; maxItems?: number; minItems?: number };

export type ContentDef = {
  key: string;
  page: StudioPageId;
  section: string;
  label: string;
  help?: string;
  field: FieldDef;
  default: unknown;
  /** Marketing routes revalidated when this key is saved. */
  paths: string[];
};

const HOME = ["/"];
const ALL = ["/", "/features", "/pricing", "/faq", "/contact", "/demo"];

const ICON_OPTIONS = [
  { value: "calendar", label: "Calendar" },
  { value: "quote", label: "Quote" },
  { value: "users", label: "Crew / users" },
  { value: "card", label: "Payment card" },
  { value: "portal", label: "Portal" },
  { value: "bell", label: "Bell" },
];

/** yes / partial / no — rendered as the glyphs in the comparison table. */
const VERDICT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "partial", label: "Partial" },
  { value: "no", label: "No" },
];

export const CONTENT_REGISTRY: ContentDef[] = [
  // ------------------------------------------------------------------ Global
  {
    key: "site.name",
    page: "global",
    section: "Brand",
    label: "Product name",
    help: "Used across the marketing site, emails, and page titles.",
    field: { kind: "text", max: 40 },
    default: "TidyPro",
    paths: ALL,
  },
  {
    key: "site.tagline",
    page: "global",
    section: "Brand",
    label: "Tagline",
    field: { kind: "text", max: 120 },
    default: "Operations software for cleaning businesses",
    paths: ALL,
  },
  {
    key: "site.description",
    page: "global",
    section: "Brand",
    label: "Short description",
    help: "One-paragraph summary used in metadata and the footer.",
    field: { kind: "textarea", rows: 3, max: 400 },
    default:
      "TidyPro helps residential and commercial cleaning businesses manage quotes, scheduling, teams, invoices, and customers in one simple place.",
    paths: ALL,
  },
  {
    key: "site.email",
    page: "global",
    section: "Brand",
    label: "Contact email",
    field: { kind: "text", max: 200 },
    default: "hello@tidypro.example",
    paths: ALL,
  },
  {
    key: "site.cities",
    page: "global",
    section: "Brand",
    label: "Service cities",
    help: "One city per line.",
    field: { kind: "lines", rows: 7, maxItems: 20 },
    default: [
      "Albany",
      "Saratoga Springs",
      "Schenectady",
      "Troy",
      "Syracuse",
      "Rochester",
      "Buffalo",
    ],
    paths: ALL,
  },

  // -------------------------------------------------------------------- Home
  {
    key: "home.hero.static_line",
    page: "home",
    section: "Hero",
    label: "Headline — first line (static)",
    field: { kind: "text", max: 80 },
    default: "Run your cleaning business",
    paths: HOME,
  },
  {
    key: "home.hero.dynamic_lines",
    page: "home",
    section: "Hero",
    label: "Headline — rotating lines",
    help: "One phrase per line. They cycle with a soft fade under the static line.",
    field: { kind: "string-list", maxItems: 6, minItems: 1 },
    default: [
      "from one tidy place.",
      "without missed calls.",
      "that follows up for you.",
    ],
    paths: HOME,
  },
  {
    key: "home.hero.subcopy",
    page: "home",
    section: "Hero",
    label: "Subcopy under the headline",
    field: { kind: "textarea", rows: 3, max: 400 },
    default:
      "Quotes, scheduling, crew, invoices, and customer messages — in one simple workspace for every cleaning company.",
    paths: HOME,
  },
  {
    key: "home.hero.trial_note",
    page: "home",
    section: "Hero",
    label: "Trial note under the buttons",
    field: { kind: "text", max: 120 },
    default: "Free 14-day trial · No credit card required · Cancel anytime",
    paths: HOME,
  },
  {
    key: "home.hero.show_tour",
    page: "home",
    section: "Hero",
    label: "Show animated dashboard tour",
    help: "The auto-playing product tour next to the headline.",
    field: { kind: "toggle" },
    default: true,
    paths: HOME,
  },
  {
    key: "home.features.eyebrow",
    page: "home",
    section: "Features",
    label: "Section eyebrow",
    field: { kind: "text", max: 40 },
    default: "Features",
    paths: HOME,
  },
  {
    key: "home.features.title",
    page: "home",
    section: "Features",
    label: "Section title",
    field: { kind: "text", max: 120 },
    default: "Everything a cleaning business needs, nothing it doesn't",
    paths: HOME,
  },
  {
    key: "home.features.description",
    page: "home",
    section: "Features",
    label: "Section description",
    field: { kind: "textarea", rows: 2, max: 300 },
    default:
      "One workspace for winning customers, running jobs, and getting paid — simple enough for owners who'd rather be cleaning than clicking.",
    paths: HOME,
  },
  {
    key: "home.features.items",
    page: "home",
    section: "Features",
    label: "Feature cards",
    field: {
      kind: "list",
      maxItems: 8,
      minItems: 1,
      item: [
        { key: "icon", label: "Icon", kind: "select", options: ICON_OPTIONS },
        { key: "title", label: "Title", kind: "text", max: 80 },
        {
          key: "description",
          label: "Description",
          kind: "textarea",
          rows: 3,
          max: 400,
        },
      ],
    },
    default: [
      {
        icon: "calendar",
        title: "Scheduling without double-bookings",
        description:
          "Day, week, and month views with crew assignments and automatic conflict warnings — so no two jobs land on the same crew at the same time.",
      },
      {
        icon: "quote",
        title: "Quotes that turn into bookings",
        description:
          "Take quote requests online, price by service, property size, frequency, and add-ons, then convert an approved quote into a booking in one click.",
      },
      {
        icon: "users",
        title: "Crew tools for the field",
        description:
          "Cleaners see their day's jobs on their phones, work through checklists, upload before-and-after photos, and mark jobs complete from the job site.",
      },
      {
        icon: "card",
        title: "Invoicing and online payments",
        description:
          "Create and send invoices, track payment status, and let customers pay by card. Customer payments go to your business — separate from your TidyPro subscription.",
      },
      {
        icon: "portal",
        title: "A portal your customers will actually use",
        description:
          "Clients approve quotes, view upcoming and past appointments, request reschedules, pay invoices, and update their preferences — without calling you.",
      },
      {
        icon: "bell",
        title: "Reminders that reduce no-shows",
        description:
          "Automatic booking confirmations, reminders, and staff assignment notifications by email, with consent controls and notification preferences.",
      },
    ],
    paths: HOME,
  },
  {
    key: "home.compare.eyebrow",
    page: "home",
    section: "Comparison",
    label: "Section eyebrow",
    field: { kind: "text", max: 40 },
    default: "Why TidyPro",
    paths: HOME,
  },
  {
    key: "home.compare.title",
    page: "home",
    section: "Comparison",
    label: "Section title",
    field: { kind: "text", max: 120 },
    default: "Built for cleaning, not repackaged for plumbing",
    paths: HOME,
  },
  {
    key: "home.compare.description",
    page: "home",
    section: "Comparison",
    label: "Section description",
    field: { kind: "textarea", rows: 2, max: 300 },
    default:
      "Generalist field-service software makes you pay per seat and bolt on the essentials. Here's the honest side-by-side.",
    paths: HOME,
  },
  {
    key: "home.compare.rows",
    page: "home",
    section: "Comparison",
    label: "Comparison rows",
    field: {
      kind: "list",
      maxItems: 12,
      minItems: 1,
      item: [
        { key: "feature", label: "Feature", kind: "text", max: 80 },
        { key: "us", label: "TidyPro", kind: "select", options: VERDICT_OPTIONS },
        {
          key: "them",
          label: "Big platforms",
          kind: "select",
          options: VERDICT_OPTIONS,
        },
      ],
    },
    default: [
      { feature: "Flat price as you grow", us: "yes", them: "no" },
      { feature: "Crew seats included in the plan", us: "yes", them: "no" },
      { feature: "Quotes that follow up automatically", us: "yes", them: "no" },
      { feature: "Recurring cleaning routes built in", us: "yes", them: "partial" },
      { feature: "Mobile checklists and job photos", us: "yes", them: "partial" },
      { feature: "Customer portal with online payment", us: "yes", them: "partial" },
      { feature: "Every essential included in the base price", us: "yes", them: "no" },
      { feature: "Gates essentials behind paid add-ons", us: "no", them: "yes" },
      { feature: "Steep learning curve for the owner", us: "no", them: "yes" },
    ],
    paths: HOME,
  },
  {
    key: "home.how.eyebrow",
    page: "home",
    section: "How it works",
    label: "Section eyebrow",
    field: { kind: "text", max: 40 },
    default: "How it works",
    paths: HOME,
  },
  {
    key: "home.how.title",
    page: "home",
    section: "How it works",
    label: "Section title",
    field: { kind: "text", max: 120 },
    default: "From first quote to paid invoice in three steps",
    paths: HOME,
  },
  {
    key: "home.how.description",
    page: "home",
    section: "How it works",
    label: "Section description",
    field: { kind: "textarea", rows: 2, max: 300 },
    default:
      "Built for owners who are not technically experienced — if you can send a text, you can run TidyPro.",
    paths: HOME,
  },
  {
    key: "home.how.steps",
    page: "home",
    section: "How it works",
    label: "Steps",
    field: {
      kind: "list",
      maxItems: 5,
      minItems: 1,
      item: [
        { key: "title", label: "Title", kind: "text", max: 80 },
        {
          key: "description",
          label: "Description",
          kind: "textarea",
          rows: 3,
          max: 400,
        },
      ],
    },
    default: [
      {
        title: "Set up your company",
        description:
          "Add your business profile, logo, services, and pricing. Define your service area by city, county, ZIP code, or radius — then invite your team and set permissions.",
      },
      {
        title: "Win jobs and schedule crews",
        description:
          "Share your online quote form, approve quotes into one-time or recurring bookings, and assign cleaners with conflict warnings keeping every day realistic.",
      },
      {
        title: "Get paid faster",
        description:
          "Send invoices the moment a job is done, track what's outstanding at a glance, and let customers pay online through their portal. Reminders go out automatically.",
      },
    ],
    paths: HOME,
  },
  {
    key: "home.pricing.eyebrow",
    page: "home",
    section: "Pricing",
    label: "Section eyebrow",
    field: { kind: "text", max: 40 },
    default: "Pricing",
    paths: HOME,
  },
  {
    key: "home.pricing.title",
    page: "home",
    section: "Pricing",
    label: "Section title",
    field: { kind: "text", max: 120 },
    default: "Simple plans that pay for themselves",
    paths: HOME,
  },
  {
    key: "home.pricing.description",
    page: "home",
    section: "Pricing",
    label: "Section description",
    field: { kind: "textarea", rows: 2, max: 300 },
    default:
      "One booking a month covers the subscription for most companies. Start free, upgrade when you grow.",
    paths: HOME,
  },
  {
    key: "home.pricing.disclaimer",
    page: "home",
    section: "Pricing",
    label: "Disclaimer under the plans",
    help: "Plan names, prices, and features come from the billing source of truth and stay in code so the site can never drift from the dashboard.",
    field: { kind: "text", max: 200 },
    default:
      "Suggested pricing shown for illustration — final plans confirmed at launch. Prices in USD. Cancel anytime.",
    paths: HOME,
  },
  {
    key: "home.stories.eyebrow",
    page: "home",
    section: "Customer stories",
    label: "Section eyebrow",
    field: { kind: "text", max: 40 },
    default: "Customer stories",
    paths: HOME,
  },
  {
    key: "home.stories.title",
    page: "home",
    section: "Customer stories",
    label: "Section title",
    field: { kind: "text", max: 120 },
    default: "Loved by cleaning businesses",
    paths: HOME,
  },
  {
    key: "home.stories.description",
    page: "home",
    section: "Customer stories",
    label: "Section description",
    field: { kind: "textarea", rows: 2, max: 300 },
    default: "Owners who switched to TidyPro and never looked back.",
    paths: HOME,
  },
  {
    key: "home.stories.disclaimer",
    page: "home",
    section: "Customer stories",
    label: "Sample-stories disclaimer",
    help: "Shown under the stories while they are illustrative samples. Clear it once real customer stories are published.",
    field: { kind: "text", max: 200 },
    default:
      "",
    paths: HOME,
  },
  {
    key: "home.stories.items",
    page: "home",
    section: "Customer stories",
    label: "Testimonials",
    help: "Sample stories — replace with real pilot customer stories once collected.",
    field: {
      kind: "list",
      maxItems: 12,
      minItems: 1,
      item: [
        { key: "quote", label: "Quote", kind: "textarea", rows: 4, max: 800 },
        { key: "name", label: "Name", kind: "text", max: 80 },
        { key: "role", label: "Role / company", kind: "text", max: 120 },
        { key: "city", label: "City", kind: "text", max: 80 },
      ],
    },
    default: [
      {
        quote:
          "We switched from a per-user platform that kept raising our bill every time we hired. TidyPro's flat pricing alone sold us — then the quote follow-up started booking jobs we'd written off.",
        name: "Maria Santos",
        role: "Owner, Spotless Home Cleaning",
        city: "Albany, NY",
      },
      {
        quote:
          "The automated quote follow-up is unreal. I send a quote in the morning and by the afternoon half of them have booked themselves. I used to lose those jobs to silence.",
        name: "James Carter",
        role: "Owner, Carter Commercial Clean",
        city: "Syracuse, NY",
      },
      {
        quote:
          "My cleaners actually use the mobile app — that never happened with our old software. Checklists, job notes, everything's just there. Training a new hire takes an afternoon now.",
        name: "Priya Raman",
        role: "Operations Manager, FreshNest Maids",
        city: "Rochester, NY",
      },
      {
        quote:
          "I run a two-person operation and every other tool felt built for a 50-truck franchise. TidyPro feels like it was designed for exactly my size — simple where I need it, powerful where it counts.",
        name: "Dan Whitfield",
        role: "Owner, Whitfield Cleaning Co.",
        city: "Schenectady, NY",
      },
      {
        quote:
          "Invoicing used to eat my Sundays. Now quotes turn into bookings, bookings turn into invoices, and customers pay from the portal link. I got my weekends back.",
        name: "Lisa Nguyen",
        role: "Owner, Crystal Clear Homes",
        city: "Troy, NY",
      },
      {
        quote:
          "We tried two of the big names before this. Both charged extra for every seat and every feature that mattered. TidyPro gave us the whole toolkit on day one for less than we were paying.",
        name: "Robert Hayes",
        role: "Owner, Hayes Janitorial Services",
        city: "Utica, NY",
      },
    ],
    paths: HOME,
  },
  {
    key: "home.faq.eyebrow",
    page: "home",
    section: "FAQ",
    label: "Section eyebrow",
    field: { kind: "text", max: 40 },
    default: "FAQ",
    paths: HOME,
  },
  {
    key: "home.faq.title",
    page: "home",
    section: "FAQ",
    label: "Section title",
    field: { kind: "text", max: 120 },
    default: "Questions cleaning owners ask us",
    paths: HOME,
  },
  {
    key: "home.faq.description",
    page: "home",
    section: "FAQ",
    label: "Section description",
    field: { kind: "textarea", rows: 2, max: 300 },
    default: "Straight answers — including the ones about tax and payments.",
    paths: HOME,
  },
  {
    key: "site.faqs",
    page: "home",
    section: "FAQ",
    label: "Questions & answers",
    help: "Shared by the home page and the dedicated FAQ page.",
    field: {
      kind: "list",
      maxItems: 20,
      minItems: 1,
      item: [
        { key: "q", label: "Question", kind: "text", max: 200 },
        { key: "a", label: "Answer", kind: "textarea", rows: 4, max: 1200 },
      ],
    },
    default: [
      {
        q: "Is TidyPro only for cleaning businesses in Upstate New York?",
        a: "We designed TidyPro with Upstate cleaners in mind — service areas by city, county, ZIP code, or radius, Eastern Time scheduling, and USD pricing. But any residential or commercial cleaning business in the US can use it.",
      },
      {
        q: "I'm not technical. Is it hard to set up?",
        a: "No. A guided setup walks you through your business profile, services, pricing, and service area, then helps you invite your team. Most owners finish in under 30 minutes, and there's no software to install.",
      },
      {
        q: "How do my customers pay me?",
        a: "You create and send invoices from TidyPro, and customers pay by card through their customer portal. Payments go directly to your business account — completely separate from your TidyPro subscription.",
      },
      {
        q: "Does TidyPro handle sales tax for me?",
        a: "You can configure tax rates on your invoices, but tax rules vary by location and situation. Have your accountant verify what's required for your business — we don't assume tax requirements on your behalf.",
      },
      {
        q: "Can my cleaners use it on their phones?",
        a: "Yes. Job views are designed mobile-first: cleaners see their day's jobs, tap into job details, work through checklists, upload before-and-after photos, and mark jobs complete — all from a phone browser.",
      },
      {
        q: "What is the Front Office Service?",
        a: "It's our done-for-you tier: an AI assistant answers every call, text, web form and email in your company's name, sends quotes from your price list and follows up, books visits into your schedule, and — on Full Office — invoices and collects. Front Desk is $300/month, Full Office is $600/month, both month to month with no per-call charges.",
      },
      {
        q: "What happens when the AI assistant can't answer?",
        a: "Anything it can't handle comes straight to you by text — including anything unusual, or any quote outside your price list. It never guesses on your behalf.",
      },
      {
        q: "Does my phone number change with the Front Office Service?",
        a: "No. Your business line and enquiry inbox forward to your AI assistant, and your number stays yours. Everything goes out under your company's name.",
      },
      {
        q: "Who gets paid when customers pay by card?",
        a: "You do. Card payments go straight to your own account; we never hold your money.",
      },
    ],
    paths: ["/", "/faq"],
  },
  {
    key: "home.cta.title",
    page: "home",
    section: "Call to action",
    label: "Title",
    field: { kind: "text", max: 120 },
    default: "Ready to spend less time on paperwork?",
    paths: HOME,
  },
  {
    key: "home.cta.body",
    page: "home",
    section: "Call to action",
    label: "Body",
    field: { kind: "textarea", rows: 3, max: 400 },
    default:
      "Join the cleaning businesses getting organized with TidyPro. Set up in under 30 minutes — your first 14 days are free.",
    paths: HOME,
  },

  // --------------------------------------------------------------- Features
  {
    key: "features.hero.eyebrow",
    page: "features",
    section: "Page hero",
    label: "Eyebrow",
    field: { kind: "text", max: 40 },
    default: "Features",
    paths: ["/features"],
  },
  {
    key: "features.hero.title",
    page: "features",
    section: "Page hero",
    label: "Title",
    field: { kind: "text", max: 120 },
    default: "Everything you need to run your cleaning business",
    paths: ["/features"],
  },
  {
    key: "features.hero.description",
    page: "features",
    section: "Page hero",
    label: "Description",
    field: { kind: "textarea", rows: 3, max: 400 },
    default:
      "One workspace for quotes, scheduling, crews, invoices, and customers — designed for owners who'd rather be cleaning than clicking.",
    paths: ["/features"],
  },
  {
    key: "features.deep_dives",
    page: "features",
    section: "Feature deep dives",
    label: "Feature cards",
    help: "Bullets: one per line.",
    field: {
      kind: "list",
      maxItems: 8,
      minItems: 1,
      item: [
        { key: "icon", label: "Icon", kind: "select", options: ICON_OPTIONS },
        { key: "title", label: "Title", kind: "text", max: 80 },
        {
          key: "description",
          label: "Description",
          kind: "textarea",
          rows: 3,
          max: 500,
        },
        { key: "bullets", label: "Bullets", kind: "lines", rows: 3, max: 120 },
      ],
    },
    default: [
      {
        icon: "calendar",
        title: "Scheduling without double-bookings",
        description:
          "A calendar built for cleaning work: see the day, week, or month, assign cleaners or crews, and let TidyPro warn you before two jobs collide.",
        bullets: [
          "Day, week, and month views with crew assignments",
          "Automatic conflict warnings on overlapping jobs",
          "Job statuses: scheduled, in progress, completed, canceled",
        ],
      },
      {
        icon: "quote",
        title: "Quotes that turn into bookings",
        description:
          "Win work faster with an online quote-request form and pricing that adapts to each job. Approved quotes become bookings in one click.",
        bullets: [
          "Shareable online quote-request form",
          "Pricing by service, property size, frequency, and add-ons",
          "One-time and recurring bookings; configurable cancellation rules",
        ],
      },
      {
        icon: "users",
        title: "Crew tools for the field",
        description:
          "Your cleaners get a mobile-first view of their day — job details, checklists, and photos — without paperwork to bring home.",
        bullets: [
          "Today's jobs with addresses and access instructions on any phone",
          "Completion checklists for consistent quality",
          "Optional before-and-after photo uploads",
        ],
      },
      {
        icon: "card",
        title: "Invoicing and online payments",
        description:
          "Send invoices the moment a job is done and watch them get paid. Customer payments go straight to your business — separate from your TidyPro subscription.",
        bullets: [
          "Create, send, and track invoices; see what's overdue at a glance",
          "Customers pay by card through their portal (Stripe Connect)",
          "Configurable tax settings — have your accountant verify requirements",
        ],
      },
      {
        icon: "portal",
        title: "A portal your customers will actually use",
        description:
          "Give clients a simple login where they can handle everything themselves — fewer phone calls and emails for you.",
        bullets: [
          "Approve quotes online",
          "View upcoming and past appointments; request rescheduling",
          "View and pay invoices; update contact details and preferences",
        ],
      },
      {
        icon: "bell",
        title: "Reminders that reduce no-shows",
        description:
          "Automatic, well-timed messages keep everyone in the loop — customers show up ready, and crews know where to be.",
        bullets: [
          "Booking confirmations and reminders",
          "Quote, invoice, and staff-assignment notifications",
          "Email now with consent controls; optional SMS in a later release",
        ],
      },
    ],
    paths: ["/features"],
  },
  {
    key: "features.audiences.eyebrow",
    page: "features",
    section: "Who it's for",
    label: "Section eyebrow",
    field: { kind: "text", max: 40 },
    default: "Who it's for",
    paths: ["/features"],
  },
  {
    key: "features.audiences.title",
    page: "features",
    section: "Who it's for",
    label: "Section title",
    field: { kind: "text", max: 120 },
    default: "Built for everyone who touches the job",
    paths: ["/features"],
  },
  {
    key: "features.audiences.description",
    page: "features",
    section: "Who it's for",
    label: "Section description",
    field: { kind: "textarea", rows: 2, max: 300 },
    default:
      "Owners, cleaners, and customers each get an experience designed around what they actually do.",
    paths: ["/features"],
  },
  {
    key: "features.audiences.items",
    page: "features",
    section: "Who it's for",
    label: "Audience cards",
    field: {
      kind: "list",
      maxItems: 6,
      minItems: 1,
      item: [
        { key: "title", label: "Title", kind: "text", max: 80 },
        {
          key: "description",
          label: "Description",
          kind: "textarea",
          rows: 3,
          max: 400,
        },
      ],
    },
    default: [
      {
        title: "Owners & managers",
        description:
          "Today's jobs, new quote requests, and outstanding invoices on one dashboard. Run the business in minutes a day — not late evenings.",
      },
      {
        title: "Cleaners",
        description:
          "Your day's jobs on your phone with checklists and one-tap completion. No apps to install, no paperwork to bring home.",
      },
      {
        title: "Customers",
        description:
          "Approve quotes, pay invoices, and reschedule online at midnight if they want. No phone tag, no waiting on hold.",
      },
    ],
    paths: ["/features"],
  },

  // ---------------------------------------------------------------- Pricing
  {
    key: "pricing.hero.eyebrow",
    page: "pricing",
    section: "Page hero",
    label: "Eyebrow",
    field: { kind: "text", max: 40 },
    default: "Pricing",
    paths: ["/pricing"],
  },
  {
    key: "pricing.hero.title",
    page: "pricing",
    section: "Page hero",
    label: "Title",
    field: { kind: "text", max: 120 },
    default: "Simple pricing that pays for itself",
    paths: ["/pricing"],
  },
  {
    key: "pricing.hero.description",
    page: "pricing",
    section: "Page hero",
    label: "Description",
    field: { kind: "textarea", rows: 3, max: 400 },
    default:
      "One extra booking a month covers TidyPro for most companies. Start free for 14 days — no credit card required.",
    paths: ["/pricing"],
  },
  {
    key: "pricing.billing_faqs",
    page: "pricing",
    section: "Billing questions",
    label: "Billing questions & answers",
    field: {
      kind: "list",
      maxItems: 12,
      minItems: 1,
      item: [
        { key: "q", label: "Question", kind: "text", max: 200 },
        { key: "a", label: "Answer", kind: "textarea", rows: 4, max: 1200 },
      ],
    },
    default: [
      {
        q: "How does billing work?",
        a: "TidyPro is a monthly subscription per cleaning company — not per customer. Your subscription is completely separate from the payments your customers make to you, which go directly to your business.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes. Plans are month-to-month with no contracts. If you cancel, you keep access until the end of your billing period.",
      },
      {
        q: "What counts as a user?",
        a: "Each team member who logs in — owners, managers, and cleaners. Your customers don't count as users; they use the free customer portal.",
      },
      {
        q: "Do my customers pay extra to use the portal?",
        a: "No. The customer portal is included in your plan at no extra cost to your customers.",
      },
    ],
    paths: ["/pricing"],
  },

  // -------------------------------------------------------------------- FAQ
  {
    key: "faq.hero.eyebrow",
    page: "faq",
    section: "Page hero",
    label: "Eyebrow",
    field: { kind: "text", max: 40 },
    default: "FAQ",
    paths: ["/faq"],
  },
  {
    key: "faq.hero.title",
    page: "faq",
    section: "Page hero",
    label: "Title",
    field: { kind: "text", max: 120 },
    default: "Questions cleaning owners ask us",
    paths: ["/faq"],
  },
  {
    key: "faq.hero.description",
    page: "faq",
    section: "Page hero",
    label: "Description",
    field: { kind: "textarea", rows: 3, max: 400 },
    default: "Straight answers — including the ones about tax, payments, and privacy.",
    paths: ["/faq"],
  },
  {
    key: "faq.groups",
    page: "faq",
    section: "Questions",
    label: "Grouped questions",
    help: "One card per question — questions are grouped under their group heading, in order.",
    field: {
      kind: "list",
      maxItems: 30,
      minItems: 1,
      item: [
        { key: "group", label: "Group", kind: "text", max: 60 },
        { key: "q", label: "Question", kind: "text", max: 200 },
        { key: "a", label: "Answer", kind: "textarea", rows: 4, max: 1200 },
      ],
    },
    default: [
      {
        group: "Getting started",
        q: "Is TidyPro only for cleaning businesses in Upstate New York?",
        a: "We designed TidyPro with Upstate cleaners in mind — service areas by city, county, ZIP code, or radius, Eastern Time scheduling, and USD pricing. But any residential or commercial cleaning business in the US can use it.",
      },
      {
        group: "Getting started",
        q: "I'm not technical. Is it hard to set up?",
        a: "No. A guided setup walks you through your business profile, services, pricing, and service area, then helps you invite your team. Most owners finish in under 30 minutes, and there's no software to install.",
      },
      {
        group: "Getting started",
        q: "What happens after my 14-day trial?",
        a: "Choose a plan to keep going — we'll remind you before the trial ends. If you don't pick a plan, your workspace is paused, not deleted, and you can reactivate it anytime.",
      },
      {
        group: "Getting started",
        q: "Do you offer onboarding help?",
        a: "Every plan includes a guided setup wizard and email support. The Pro plan adds dedicated onboarding where we help configure your services, pricing, and team.",
      },
      {
        group: "Product",
        q: "Can my cleaners use it on their phones?",
        a: "Yes. Job views are designed mobile-first: cleaners see their day's jobs, tap into job details, work through checklists, upload before-and-after photos, and mark jobs complete — all from a phone browser.",
      },
      {
        group: "Product",
        q: "I run multiple crews. Can TidyPro handle that?",
        a: "Yes. The Growth plan includes crew scheduling with conflict alerts, and Pro adds multi-crew scheduling views plus business reports for larger operations.",
      },
      {
        group: "Product",
        q: "Can customers reschedule without calling me?",
        a: "Yes — through the customer portal, using the cancellation and rescheduling rules you configure for your business. You stay in control of the policy; customers get the convenience.",
      },
      {
        group: "Product",
        q: "Where do job photos go?",
        a: "Before-and-after photos upload from the job site into secure storage attached to the job record (Pro plan). They're visible to your team and can be shared with the customer through their portal.",
      },
      {
        group: "Billing & privacy",
        q: "How do my customers pay me?",
        a: "You create and send invoices from TidyPro, and customers pay by card through their customer portal. Payments go directly to your business account — completely separate from your TidyPro subscription.",
      },
      {
        group: "Billing & privacy",
        q: "Does TidyPro handle sales tax for me?",
        a: "You can configure tax rates on your invoices, but tax rules vary by location and situation. Have your accountant verify what's required for your business — we don't assume tax requirements on your behalf.",
      },
      {
        group: "Billing & privacy",
        q: "Can I cancel anytime?",
        a: "Yes. Plans are month-to-month with no contracts, and you keep access until the end of your billing period.",
      },
      {
        group: "Billing & privacy",
        q: "Is my business data private from other cleaning companies?",
        a: "Yes. Every company gets its own private workspace — your customers, staff, schedules, and financial records are isolated and never visible to any other company on the platform.",
      },
    ],
    paths: ["/faq"],
  },

  // ---------------------------------------------------------------- Contact
  {
    key: "contact.hero.eyebrow",
    page: "contact",
    section: "Page hero",
    label: "Eyebrow",
    field: { kind: "text", max: 40 },
    default: "Contact",
    paths: ["/contact"],
  },
  {
    key: "contact.hero.title",
    page: "contact",
    section: "Page hero",
    label: "Title",
    field: { kind: "text", max: 120 },
    default: "Talk to us",
    paths: ["/contact"],
  },
  {
    key: "contact.hero.description",
    page: "contact",
    section: "Page hero",
    label: "Description",
    field: { kind: "textarea", rows: 3, max: 400 },
    default:
      "Questions about plans, the pilot program, or whether TidyPro fits your business — we reply within one business day.",
    paths: ["/contact"],
  },
  {
    key: "contact.pilot.title",
    page: "contact",
    section: "Pilot card",
    label: "Card title",
    field: { kind: "text", max: 120 },
    default: "Join the pilot program",
    paths: ["/contact"],
  },
  {
    key: "contact.pilot.body",
    page: "contact",
    section: "Pilot card",
    label: "Card body",
    field: { kind: "textarea", rows: 4, max: 600 },
    default:
      "We're onboarding a small group of cleaning businesses now and building the roadmap around their feedback. Pilot members get extra onboarding help and a voice in what we build next.",
    paths: ["/contact"],
  },

  // ------------------------------------------------------------------- Demo
  {
    key: "demo.title",
    page: "demo",
    section: "Trial form",
    label: "Title",
    field: { kind: "text", max: 120 },
    default: "Start your free 14-day trial",
    paths: ["/demo"],
  },
  {
    key: "demo.description",
    page: "demo",
    section: "Trial form",
    label: "Description",
    field: { kind: "textarea", rows: 3, max: 400 },
    default:
      "Tell us about your cleaning business and we'll get you set up. No credit card required.",
    paths: ["/demo"],
  },
];

/** Defaults keyed by content key — what the site renders with no overrides. */
export const CONTENT_DEFAULTS: Record<string, unknown> = Object.fromEntries(
  CONTENT_REGISTRY.map((d) => [d.key, d.default]),
);

export function getContentDef(key: string): ContentDef | undefined {
  return CONTENT_REGISTRY.find((d) => d.key === key);
}

// ---------------------------------------------------------------------------
// Validation — server actions validate incoming values against the registry
// so a bad Studio save can never corrupt rendered pages.
// ---------------------------------------------------------------------------

function checkString(
  value: unknown,
  max: number,
  label: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") return { ok: false, error: `${label} must be text.` };
  const trimmed = value.trim();
  if (trimmed.length > max)
    return { ok: false, error: `${label} must be under ${max} characters.` };
  return { ok: true, value: trimmed };
}

function checkListItemField(
  f: ListItemField,
  raw: unknown,
  label: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  if (f.kind === "text" || f.kind === "textarea") {
    return checkString(raw, f.max ?? (f.kind === "text" ? 200 : 2000), label);
  }
  if (f.kind === "lines") {
    if (typeof raw === "string") {
      const lines = raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 20);
      return { ok: true, value: lines };
    }
    if (Array.isArray(raw)) {
      const lines = raw
        .filter((l): l is string => typeof l === "string")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 20);
      return { ok: true, value: lines };
    }
    return { ok: false, error: `${label} must be one item per line.` };
  }
  // select
  if (typeof raw !== "string" || !f.options.some((o) => o.value === raw)) {
    return { ok: false, error: `${label} has an invalid choice.` };
  }
  return { ok: true, value: raw };
}

/**
 * Validate + normalize a raw value for a registry key.
 * Returns the cleaned value to store, or an error message.
 */
export function validateContentValue(
  def: ContentDef,
  raw: unknown,
): { ok: true; value: unknown } | { ok: false; error: string } {
  const label = def.label;
  const field = def.field;

  switch (field.kind) {
    case "text":
    case "textarea": {
      const r = checkString(
        raw,
        field.max ?? (field.kind === "text" ? 200 : 2000),
        label,
      );
      return r.ok ? { ok: true, value: r.value } : r;
    }
    case "lines": {
      if (typeof raw === "string") {
        const lines = raw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, field.maxItems ?? 20);
        return { ok: true, value: lines };
      }
      if (Array.isArray(raw)) {
        const lines = raw
          .filter((l): l is string => typeof l === "string")
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, field.maxItems ?? 20);
        return { ok: true, value: lines };
      }
      return { ok: false, error: `${label} must be one item per line.` };
    }
    case "string-list": {
      if (!Array.isArray(raw))
        return { ok: false, error: `${label} must be a list.` };
      const maxItems = field.maxItems ?? 20;
      const minItems = field.minItems ?? 0;
      const items = raw
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, maxItems);
      if (items.length < minItems)
        return { ok: false, error: `${label} needs at least ${minItems} item(s).` };
      return { ok: true, value: items };
    }
    case "toggle": {
      return { ok: true, value: raw === true };
    }
    case "number": {
      const n = typeof raw === "string" ? Number(raw) : raw;
      if (typeof n !== "number" || !Number.isFinite(n))
        return { ok: false, error: `${label} must be a number.` };
      if (field.min !== undefined && n < field.min)
        return { ok: false, error: `${label} is too small.` };
      if (field.max !== undefined && n > field.max)
        return { ok: false, error: `${label} is too large.` };
      return { ok: true, value: n };
    }
    case "select": {
      if (typeof raw !== "string" || !field.options.some((o) => o.value === raw))
        return { ok: false, error: `${label} has an invalid choice.` };
      return { ok: true, value: raw };
    }
    case "list": {
      if (!Array.isArray(raw))
        return { ok: false, error: `${label} must be a list.` };
      const maxItems = field.maxItems ?? 20;
      const minItems = field.minItems ?? 0;
      if (raw.length > maxItems)
        return { ok: false, error: `${label} allows at most ${maxItems} items.` };
      if (raw.length < minItems)
        return { ok: false, error: `${label} needs at least ${minItems} item(s).` };
      const cleaned: Record<string, unknown>[] = [];
      for (let i = 0; i < raw.length; i++) {
        const entry = raw[i];
        if (typeof entry !== "object" || entry === null)
          return { ok: false, error: `${label} item ${i + 1} is invalid.` };
        const obj: Record<string, unknown> = {};
        for (const f of field.item) {
          const r = checkListItemField(
            f,
            (entry as Record<string, unknown>)[f.key],
            `${label} → ${f.label} (item ${i + 1})`,
          );
          if (!r.ok) return r;
          obj[f.key] = r.value;
        }
        cleaned.push(obj);
      }
      return { ok: true, value: cleaned };
    }
  }
}
