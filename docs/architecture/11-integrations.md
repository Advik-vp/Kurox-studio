# 11 — Integrations

Integrations never leak into domain services. Domain code talks to ports; adapters implement ports.

```
Kurox domain service
        ↓
IntegrationService
        ↓
Provider Adapter (GoogleAdsAdapter, RazorpayAdapter, S3StorageAdapter)
        ↓
External API
```

---

## Ports (interfaces)

| Port | Methods | MVP adapter |
|------|---------|-------------|
| `EmailPort` | send(template, to, data) | Console / SMTP |
| `StoragePort` | presign_put, presign_get, delete | MinIO/S3 |
| `PaymentPort` | create_checkout, verify_webhook | `NoOpPaymentAdapter` |
| `CalendarSyncPort` | push_event, pull | `NoOpCalendarAdapter` |
| `AdsMetricsPort` | fetch_campaigns, fetch_metrics | `NoOpAdsAdapter` |
| `SearchConsolePort` | fetch_queries | `NoOpGscAdapter` |
| `WeatherPort` | forecast(lat,lng,date) | `NoOpWeatherAdapter` |
| `SmsPort` / `WhatsAppPort` | send | NoOp |

---

## Credentials

Stored in `integrations` table, encrypted. OAuth state CSRF-protected. Tokens never returned to frontend.

---

## Phase mapping

| Provider | Phase |
|----------|-------|
| SMTP / Console email | 1 |
| S3-compatible storage | 1 |
| Stripe / Razorpay checkout | 2+ (interface in 1) |
| Google / Outlook calendar | 4+ |
| Google Ads, Meta, LinkedIn | 3 |
| GA4, GSC | 3 |
| WordPress/Shopify/Webflow | future |

---

## Webhooks

`POST /api/v1/webhooks/{provider}` — signature verify in adapter, then map to domain (`payment.captured` → record payment).
