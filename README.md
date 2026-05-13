# Predictable Customer Flow Diagnostic

Lead magnet web app for the **Predictable Customer Flow Framework**. It includes a short premium landing page, multi-step diagnostic, Vercel serverless submission endpoint, scoring, PDF report generation, prospect email, admin email, Zapier webhook support, and result page redirect.

## Install Dependencies

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Vercel CLI will serve the landing page and `/api/submit` serverless function locally.

## Configure Environment

Copy `.env.example` to `.env.local` for local development, then fill in the values you need.

```bash
cp .env.example .env.local
```

Required for live email delivery:

- `EMAIL_PROVIDER=api` or `EMAIL_PROVIDER=smtp`
- `FROM_EMAIL`
- Prospect email provider credentials

Optional but recommended:

- `ADMIN_EMAIL`
- `BOOKING_LINK`
- `RESULT_PAGE_URL`
- `ZAPIER_WEBHOOK_URL`

## Deploy To Vercel

1. Push the project to GitHub, GitLab, or Bitbucket.
2. Import the project in Vercel.
3. Add the environment variables from `.env.example` in Vercel Project Settings.
4. Deploy.

The frontend is static HTML/CSS/JS. The backend runs through `api/submit.js` as a Vercel Serverless Function.

## Connect Resend

Set:

```env
EMAIL_PROVIDER=api
RESEND_API_KEY=your_resend_key
FROM_EMAIL=Your Brand <hello@yourdomain.com>
```

Resend is used first when `RESEND_API_KEY` is present.

## Connect SendGrid

If Resend is not configured, the API email provider falls back to SendGrid.

```env
EMAIL_PROVIDER=api
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=hello@yourdomain.com
```

## Connect SMTP

Set:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourhost.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password
FROM_EMAIL=hello@yourdomain.com
```

Use port `465` for secure SMTP or `587` for standard TLS upgrade.

## Connect Zapier Webhook

Create a Zap with **Webhooks by Zapier** as the trigger and copy the catch hook URL into:

```env
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
```

If Zapier fails, the user flow continues and the error is logged.

## Change Redirect Result Page URL

By default, successful submissions redirect to `/result.html`.

To send users to an external result or offer page, set:

```env
RESULT_PAGE_URL=https://yourdomain.com/customer-flow-result
```

## Change Booking Link

Set:

```env
BOOKING_LINK=https://yourbookinglink.com
```

The booking link appears in the PDF report and emails. The included `result.html` also loads `/api/config` to use `BOOKING_LINK` on Vercel, with `https://yourbookinglink.com` as a fallback placeholder.
