# Render Environment Variable Templates

Replace the placeholder values before saving. Use the same `JWT_SECRET` value in every service that has `JWT_SECRET`.

## Shared Values

```env
DATABASE_URL=<RENDER_POSTGRES_INTERNAL_DATABASE_URL>
READ_DATABASE_URL=<RENDER_POSTGRES_INTERNAL_DATABASE_URL>
JWT_SECRET=<ONE_LONG_RANDOM_SECRET_USED_BY_ALL_SERVICES>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://lounge-bar-system.vercel.app
NOTIFICATION_SERVICE_URL=https://lounge-notification-service.onrender.com
```

## lounge-auth-service

```env
DATABASE_URL=<RENDER_POSTGRES_INTERNAL_DATABASE_URL>
JWT_SECRET=<ONE_LONG_RANDOM_SECRET_USED_BY_ALL_SERVICES>
JWT_EXPIRES_IN=7d
```

## lounge-lounge-service

```env
DATABASE_URL=<RENDER_POSTGRES_INTERNAL_DATABASE_URL>
READ_DATABASE_URL=<RENDER_POSTGRES_INTERNAL_DATABASE_URL>
JWT_SECRET=<ONE_LONG_RANDOM_SECRET_USED_BY_ALL_SERVICES>
JWT_EXPIRES_IN=7d
NOTIFICATION_SERVICE_URL=https://lounge-notification-service.onrender.com
CACHE_TTL_MS=30000
```

## lounge-reservation-service

```env
DATABASE_URL=<RENDER_POSTGRES_INTERNAL_DATABASE_URL>
JWT_SECRET=<ONE_LONG_RANDOM_SECRET_USED_BY_ALL_SERVICES>
JWT_EXPIRES_IN=7d
NOTIFICATION_SERVICE_URL=https://lounge-notification-service.onrender.com
RESERVATION_DURATION_MINUTES=120
RESERVATION_EXPIRE_JOB_INTERVAL_MS=60000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<YOUR_GMAIL_ADDRESS>
SMTP_PASS=<YOUR_GMAIL_APP_PASSWORD>
EMAIL_FROM=<YOUR_GMAIL_ADDRESS>
SENDGRID_API_KEY=
```

## lounge-payment-service

```env
DATABASE_URL=<RENDER_POSTGRES_INTERNAL_DATABASE_URL>
JWT_SECRET=<ONE_LONG_RANDOM_SECRET_USED_BY_ALL_SERVICES>
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
STRIPE_CURRENCY=usd
STRIPE_SUCCESS_URL=https://lounge-bar-system.vercel.app/subscription?success=true
STRIPE_CANCEL_URL=https://lounge-bar-system.vercel.app/subscription?cancelled=true
STRIPE_PORTAL_RETURN_URL=https://lounge-bar-system.vercel.app/subscription
QPAY_CALLBACK_URL=https://lounge-gateway.onrender.com/payments/webhook/qpay
```

## lounge-notification-service

```env
CLIENT_ORIGIN=https://lounge-bar-system.vercel.app
```

## lounge-gateway

```env
CLIENT_ORIGIN=https://lounge-bar-system.vercel.app
AUTH_SERVICE_URL=https://lounge-auth-service.onrender.com
LOUNGE_SERVICE_URL=https://lounge-lounge-service.onrender.com
RESERVATION_SERVICE_URL=https://lounge-reservation-service.onrender.com
PAYMENT_SERVICE_URL=https://lounge-payment-service.onrender.com
NOTIFICATION_SERVICE_URL=https://lounge-notification-service.onrender.com
RATE_LIMIT_WINDOW_MS=1000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_BLOCK_MS=1800000
```

## Vercel Client

Add this to the Vercel project after `lounge-gateway` is live, then redeploy the client.

```env
VITE_API_URL=https://lounge-gateway.onrender.com
```
