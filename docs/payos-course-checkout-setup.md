# PayOS Course Checkout Setup

## 1) Environment variables

Set these variables on your production runtime:

```env
COURSE_PAYMENT_PROVIDER=payos
PAYOS_CLIENT_ID=<your-client-id>
PAYOS_API_KEY=<your-api-key>
PAYOS_CHECKSUM_KEY=<your-checksum-key>
PAYOS_API_BASE_URL=https://api-merchant.payos.vn
```

Also ensure:

```env
BETTER_AUTH_URL=https://<your-domain>
```

`BETTER_AUTH_URL` is used to build PayOS return/cancel URLs.

### Docker Compose (local/prod-like)

`docker-compose.yml` is wired to read PayOS values from an external env file:

```bash
DOCKER_ENV_FILE=.env docker compose up -d --build
```

Or point to a dedicated secrets file outside repo:

```bash
DOCKER_ENV_FILE=C:\secure\ccth-payos.env docker compose up -d --build
```

Required keys in that file:

```env
COURSE_PAYMENT_PROVIDER=payos
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
PAYOS_API_BASE_URL=https://api-merchant.payos.vn
```

## 2) PayOS webhook

In PayOS dashboard, configure webhook:

- Method: `POST`
- URL: `https://<your-domain>/api/billing/webhooks/payos`

## 3) Verification checklist

1. Start a checkout from `/courses/:slug`.
2. Confirm payment on PayOS.
3. Verify webhook hit in logs (`billing.webhook.payos.processed`).
4. Verify `PaymentRecord.status=SUCCEEDED`.
5. Verify `CourseEnrollment` is created/upserted.
6. Verify return URL redirects user back to purchased course flow.
