# LoungeBarSystem

## Run

```bash
docker compose up --build
```

## Docker Images

Build local images:

```powershell
docker compose build
```

Default image tags:

```text
loungebarsystem:client-latest
loungebarsystem:gateway-latest
loungebarsystem:auth-service-latest
loungebarsystem:lounge-service-latest
loungebarsystem:reservation-service-latest
loungebarsystem:payment-service-latest
loungebarsystem:notification-service-latest
```

Push to Docker Hub:

```powershell
$env:DOCKER_IMAGE_REPOSITORY="myngaa/loungebar"
$env:IMAGE_TAG="latest"
docker compose build
docker compose push
```

This publishes images like `myngaa/loungebar:client-latest`.

## Local URLs

| Role | URL | Notes |
| --- | --- | --- |
| User | http://localhost:5173/ | Public lounge search and reservation page. No login required. |
| Owner Portal | http://localhost:5173/for-owners | Owner login, token, and subscription payment page. |
| Owner | http://localhost:5173/login | Legacy owner login page. |
| Owner Dashboard | http://localhost:5173/dashboard | Requires owner login token. |
| Owner Subscription | http://localhost:5173/subscription | Requires owner login token. Owner can pay Stripe/QPay subscription here. |
| Admin | http://localhost:5173/admin/login | Admin login page. |
| Admin Dashboard | http://localhost:5173/admin/dashboard | Requires admin login token. |
| API Gateway | http://localhost:3000/health | Backend gateway health check. |

## Access Rules

- User pages are public. Users do not need login or registration.
- Owner pages require owner login and `owner_token`.
- Admin pages require admin login and `admin_token`.
- RBAC applies only to owner and admin areas.
- Owner subscription/payment starts from `/for-owners`: owner logs in, receives `owner_token`, then pays by Stripe/QPay.
- A successful owner subscription activates the organization for 30 days.
- If the subscription is expired or inactive, owner dashboard APIs are blocked with payment-required status until the owner renews.

## Ports

| Service | Local Port |
| --- | --- |
| Client | 5173 |
| API Gateway | 3000 |
| Postgres | 5433 |

## Email / OTP

Reservation verification codes are sent by SMTP. For Gmail, create a Google App Password and put these values in a root `.env` file next to `docker-compose.yml`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM=your-gmail@gmail.com
```

Then restart the reservation service:

```bash
docker compose up -d --no-deps --build reservation-service
```

If OTP emails do not arrive:

1. Open Google Account Security.
2. Turn on 2-Step Verification.
3. Create an App Password for Mail.
4. Put that 16-character password in `SMTP_PASS`.
5. Restart `reservation-service`.

Quick check:

```bash
docker exec lounge_reservation_service node -e "console.log({SMTP_USER:!!process.env.SMTP_USER, SMTP_PASS:!!process.env.SMTP_PASS})"
```

## Stripe Subscription

Set these in the root `.env` next to `docker-compose.yml`:

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_CURRENCY=usd
STRIPE_SUCCESS_URL=http://localhost:5173/subscription?success=true
STRIPE_CANCEL_URL=http://localhost:5173/subscription?cancelled=true
STRIPE_PORTAL_RETURN_URL=http://localhost:5173/subscription
```

If `STRIPE_PRICE_ID` is set, Checkout uses Stripe subscription mode. If it is empty, the app falls back to one-time Checkout and activates 30 days after Stripe webhook confirms payment.

Webhook endpoint:

```bash
http://localhost:3000/payments/webhook/stripe
```

Stripe events to enable:

```text
checkout.session.completed
checkout.session.expired
payment_intent.succeeded
payment_intent.payment_failed
customer.subscription.updated
customer.subscription.deleted
```

## Backup / Restore

Code backup:

- Code must be pushed to GitHub/GitLab regularly.
- `.env` files are ignored and must be stored separately in a safe password manager or deployment dashboard.

Database backup:

Local Docker PostgreSQL backup:

```powershell
.\server\scripts\backup-postgres.ps1
```

This creates a timestamped dump under `backups/`. The `backups/` folder is ignored by Git.

Render/production PostgreSQL backup:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
.\server\scripts\backup-postgres.ps1
```

Restore local Docker PostgreSQL from a dump:

```powershell
.\server\scripts\restore-postgres.ps1 -BackupFile .\backups\loungebar-YYYYMMDD-HHMMSS.dump
```

Recommended production safety rule:

- Take at least one manual backup before deployment.
- Keep daily automated database backups on the hosting provider if available.
- Download an extra backup before schema migrations.
- Never commit backup dumps or `.env` secrets.
