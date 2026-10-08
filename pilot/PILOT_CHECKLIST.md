# Pilot Checklist — TidyPro with 2–3 Upstate NY cleaning companies

Goal: 2–3 real companies running quotes → bookings → jobs → invoices for
4 weeks, then a go/no-go on paid launch.

## Before first contact

- [ ] Supabase project created; `0001`–`0003` migrations applied; RLS verified
      (run the checks in `SECURITY.md` P0 first)
- [ ] `RESEND_API_KEY` set; test email received from the queue
- [ ] Daily cron scheduled for `/api/cron/notifications` with `CRON_SECRET`
- [ ] Stripe test mode keys set; Connect onboarding walked through once
      end-to-end with a test company
- [ ] `PLATFORM_ADMIN_EMAILS` set to your email
- [ ] Staging URL stable (e.g. tidypro-staging.vercel.app)

## Recruiting (weeks 1–2)

- [ ] List 20 candidate companies (see `OUTREACH_SCRIPT.md` for where to look)
- [ ] Call 10+ owners; goal: 3 verbal yeses
- [ ] Send each the pilot agreement (`PILOT_AGREEMENT.md`); get a signed reply
- [ ] Schedule a 30-min onboarding call per company

## Onboarding call (30 min each)

- [ ] Create their Supabase Auth user; walk the 4-step onboarding wizard
- [ ] Import (or hand-enter) 5–10 real customers + 1 service address each
- [ ] Enter their real services + pricing; set tax rate and cancellation policy
- [ ] Invite 1 manager and 1 cleaner; have the cleaner open **My jobs** on
      their phone during the call
- [ ] Create one real quote together, approve it, convert to a booking
- [ ] Generate the customer's portal link; send it to the owner to forward
- [ ] Confirm they know how to reach you (phone/text, not a ticket queue)

## During the pilot (weeks 3–6)

- [ ] Weekly 15-min check-in call with each owner
- [ ] Watch `/admin`: are bookings/jobs/invoices actually being created?
- [ ] Log every bug and feature request the same day (keep a running list)
- [ ] Mid-pilot (week 4): collect the feedback form (`FEEDBACK.md`)

## Go / no-go (end of week 6)

- [ ] Score against `SUCCESS_METRICS.md`
- [ ] Decide: paid launch, extend pilot, or pivot
- [ ] If go: fix `SECURITY.md` P0 items, set real pricing, launch
