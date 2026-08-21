# User Journey — Buying a Product

End-to-end flow from registration through a completed order, including all webhook events.

---

## 1. Registration (Clerk)

1. User signs up via the frontend (Clerk-hosted UI or embedded component).
2. Clerk creates the user and fires a **`user.created`** webhook to `POST /webhooks/clerk`.
3. The webhook handler upserts a row in the `users` table, copying email, display name, and role from Clerk's public metadata.
4. From this point, every API call that passes a valid Clerk session JWT is mapped to the local `users.id` via `getLocalUser()`.

---

## 2. Browsing & Cart

- Products are fetched from `GET /api/products` (public, no auth required).
- The frontend maintains a cart in local state / localStorage.

---

## 3. Checkout Initiated — `POST /api/checkout`

1. The user submits their cart. The request hits `requireAuth` middleware first, which rejects unsigned requests with `401`.
2. **Validate cart** — the body is parsed against `cartSchema` (at least one item, valid UUID product IDs, positive quantities).
3. **Resolve local user** — `getLocalUser(userId)` looks up the `users` row for the authenticated Clerk session.
4. **Fetch active products** — only products that are active _and_ match the requested IDs are returned from the DB. If the count differs, one or more items are invalid.
5. **Calculate total** — unit prices come from the DB (not the client) to prevent price tampering.
6. **Enforce minimum** — totals below 10 cents are rejected (Polar's hard minimum).
7. **Save checkout session** — a `checkoutSessions` record is inserted as a snapshot of the cart. This links the cart to the eventual order when the webhook arrives.
8. **Create Polar checkout** — `polarCreateCheckout()` sends the total as a fixed-price override and embeds `checkout_session_id` in the metadata so the webhook can find it.
9. **Store Polar checkout ID** — the returned `polarCheckout.id` is written back to the `checkoutSessions` row.
10. **Return checkout URL** — the frontend redirects the user to `polarCheckout.url` (Polar-hosted payment page).

---

## 4. Payment (Polar-hosted page)

- The user enters card details on Polar's hosted checkout page.
- On success, Polar redirects to `FRONTEND_URL/checkout/return?checkout_id={CHECKOUT_ID}`.
- On abandonment, Polar redirects to `FRONTEND_URL/cart`.

---

## 5. Order Created — Polar Webhook `POST /webhooks/polar`

> **This is where the actual `orders` + `orderItems` rows are created.**

Polar fires an **`order.paid`** event to `POST /webhooks/polar`.

1. **Verify signature** — `standardwebhooks` checks the three Polar headers against `POLAR_WEBHOOK_SECRET`. Any mismatch is rejected with `400`.
2. **Deduplicate** — before doing anything, check if an `orders` row with this `polarOrderId` or `polarCheckoutId` already has `status: "paid"`. Polar retries on non-2xx so the same event can arrive more than once.
3. **Find the checkout session** — `checkout_session_id` is read from `event.data.metadata`, pointing to the `checkoutSessions` row saved in step 7 above.
4. **Fulfill in a transaction** — inside a single DB transaction: lock the `checkoutSessions` row, insert an `orders` row (`status: "paid"`), insert `orderItems` from the session's line snapshot, then delete the `checkoutSessions` row.
5. **Race condition guard** — if the transaction returns `false` (session already gone), check `alreadyPaid()` once more. If another delivery of the same event won the race, return `200` — otherwise return `500` so Polar retries.
6. **Acknowledge** — respond `200` so Polar stops retrying.

---

## 6. Post-Purchase — Order History

- The return page (`/checkout/return`) invalidates the orders cache and redirects the user to `/orders`.
- `GET /api/orders` returns all orders for the authenticated user, newest-first. Staff and admin roles see all orders across all users.
- `GET /api/orders/:id` returns the full order with its line items and product details.

---

## 7. Order Communication — Stream Chat

Each paid order can have a dedicated Stream Chat channel so the customer and support staff can communicate.

1. **Create channel** — the frontend calls `POST /api/orders/:id/stream-channel`.
2. The backend resolves both the customer and the requesting user (staff or customer) to Stream user IDs.
3. A channel of type `messaging` is created (or retrieved if it already exists) with ID `order-{orderId}`.
4. Both users are added as members. The response includes the channel ID the frontend uses to connect.
5. The frontend fetches a Stream token via `POST /api/stream/token`, connects `StreamChat`, and renders the chat UI (`Channel`, `MessageList`, `MessageComposer`).

---

## 8. Order Communication — Video Call

Support staff can escalate a chat to a live video call.

1. **Send invite** — a staff member clicks "Video call" in the chat. The frontend calls `POST /api/orders/:id/video-invite`.
2. The backend sends a Stream Chat message of type `video_invite` with a `join_url` field pointing to `/orders/{orderId}/call`.
3. The customer sees the invite card in chat and navigates to the call page.
4. Both sides fetch a Stream Video token via `POST /api/stream/token`, create a `StreamVideoClient`, join the call with ID `order-{orderId}`, and the call begins.

---

## Data Model Summary

```
users ──< orders ──< orderItems >── products
            │
            └── polarOrderId  ←─ Polar webhook
            
checkoutSessions  (transient, bridges cart → order)
  └── polarCheckoutId  ←─ written after step 10 above
  └── lines (jsonb snapshot of cart at checkout time)
```

Stream resources are not stored in the DB — they are created on demand via the Stream API and identified by the order ID:

| Stream resource | ID convention |
|---|---|
| Chat channel | `order-{orderId}` |
| Video call | `order-{orderId}` |

---

## Webhook Registration Checklist

| Service | Event(s) | Endpoint | Secret env var |
|---------|----------|----------|----------------|
| Clerk | `user.created`, `user.updated`, `user.deleted` | `POST /webhooks/clerk` | `CLERK_WEBHOOK_SECRET` |
| Polar | `order.paid` | `POST /webhooks/polar` | `POLAR_WEBHOOK_SECRET` |
