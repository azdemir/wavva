/**
 * Central site configuration and marketing copy.
 */

export const site = {
  name: "Switchboard",
  tagline: "The AI front office for every business",
  description:
    "Switchboard answers every call in your business's name, books appointments, follows up quotes, and collects invoices — one flat monthly fee.",
  email: "hello@switchboard.example",
  cities: [
    "Albany",
    "Saratoga Springs",
    "Schenectady",
    "Troy",
    "Syracuse",
    "Rochester",
    "Buffalo",
  ],
} as const;

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Will my callers know it's an AI?",
    a: "Yes — every caller is told they're speaking with your business's AI assistant. We never claim it's human.",
  },
  {
    q: "How many call minutes are included?",
    a: "Essential includes 250 AI-answered minutes a month, Complete includes 600. Minutes reset monthly, and anything beyond is 30¢ a minute — tracked live in your dashboard.",
  },
  {
    q: "What happens when it can't handle something?",
    a: "You get a text immediately. Anything unusual — or outside your price list — waits for your OK. It never guesses on your behalf.",
  },
  {
    q: "I'm not technical. Is it hard to set up?",
    a: "No. A guided setup walks you through your services, prices, hours and policies, then you forward your business line. Most owners are live the same day.",
  },
  {
    q: "How do my customers pay me?",
    a: "Card payments go straight to your own account through Stripe. We never hold your money.",
  },
];
