/** Shared Switchboard marketing copy — every business, never cleaning-only. */

export const VERTICALS = [
  "Plumbers",
  "Dentists",
  "Lawyers",
  "Salons",
  "HVAC",
  "Real estate",
  "Auto shops",
  "Contractors",
  "Clinics",
  "Restaurants",
] as const;

export const FAQS: { q: string; a: string }[] = [
  {
    q: "Will my callers know it's an AI?",
    a: "Yes — every caller is told they're speaking with your business's AI assistant. We never claim it's human.",
  },
  {
    q: "What happens when it can't handle something?",
    a: "You get a text immediately. Anything unusual — or outside your price list — waits for your OK. It never guesses on your behalf.",
  },
  {
    q: "Does my number change?",
    a: "No. Your business line forwards to Switchboard; your number stays yours. Everything goes out in your business's name.",
  },
  {
    q: "What kinds of businesses is this for?",
    a: "Any business that takes calls and appointments — trades, clinics, salons, legal, real estate, auto, restaurants, and more.",
  },
  {
    q: "Who gets paid?",
    a: "You — card payments go straight to your own account. We never hold your money.",
  },
  {
    q: "Can I export my data?",
    a: "Yes — customers, calls, bookings, invoices, everything. Full export any time.",
  },
  {
    q: "What if a customer doesn't want texts?",
    a: "They don't get them. Follow-ups only go to people who agreed — and Switchboard never makes automated sales calls.",
  },
  {
    q: "How does the free trial work?",
    a: "Seven days, every feature, no card required. Connect your line and it's working within a day.",
  },
  {
    q: "Is there a contract?",
    a: "No — month to month, cancel any month.",
  },
];

export const HOW_STEPS: { title: string; body: string }[] = [
  {
    title: "Tell it about your business",
    body: "Services, prices, hours, policies — or just point it at your website. Switchboard trains on how you work.",
  },
  {
    title: "Connect your line",
    body: "Forward your business number. It stays yours — every call, text, and email goes out in your business's name.",
  },
  {
    title: "It runs the front office",
    body: "Answer, quote, book, remind — plus invoicing and collection on Complete. Anything unusual arrives by text for your OK.",
  },
  {
    title: "You get the report",
    body: "One page every week: enquiries, bookings, open quotes, money collected, and overdue.",
  },
];
