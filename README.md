# عيون النيل — Oyoun El Nile

**Bilingual (AR/EN) city infrastructure reporting platform for Aswan, Egypt.**

## 60-Second Local Setup

```bash
git clone <repo-url>
cd clauding-team

# Paste your .env.local (already filled in the repo root)
# Then install and run:
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/ar` automatically.

---

## Demo Credentials

All demo accounts use password: **`Demo@1234`**

| Role | Email |
|------|-------|
| Governor | `amr.lashin@aswan.gov.eg` |
| District Manager (Aswan 1) | `dm1@aswan.gov.eg` |
| Technician (Plumber) | `tech.plumber1@aswan.gov.eg` |
| Citizen | `citizen1@example.com` |

Or visit `/ar/demo` and click any role button for instant login.

---

## App Routes

| Route | Description |
|-------|-------------|
| `/ar` or `/en` | Landing page (public) |
| `/ar/login` | Login form |
| `/ar/signup` | Citizen signup with NID + OTP |
| `/ar/demo` | Quick-login demo page |
| `/ar/citizen` | Citizen dashboard |
| `/ar/technician` | Technician dashboard |
| `/ar/manager` | District Manager dashboard |
| `/ar/governor` | Governor dashboard |

---

## Trigger Cron Manually

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/sla
```

Where `CRON_SECRET` is from your `.env.local`.

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add all environment variables from `.env.example`
4. Vercel auto-detects Next.js and deploys
5. Cron job (`*/5 * * * *`) is configured in `vercel.json`

---

## Known Caveats

- **Seeded demo users** skip OTP verification (emails pre-confirmed in auth.users)
- **New citizen signups** go through full OTP flow
- **Realtime** notifications require the `supabase_realtime` publication (already set by schema.sql)
- **Frozen contracts**: never modify `lib/supabase/*` or `lib/workflow/*`
- Use Tailwind logical properties only (`ps-`, `pe-`, `ms-`, `me-`) for RTL support

---

*Foundation built by Prompt 0 — feat: foundation (prompt 0)*