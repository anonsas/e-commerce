# Authentication & Authorization

This document explains how sign-up, sign-in, token verification, and role-based access control work in this project end-to-end.

---

## The two systems

| Concern | Handled by |
|---|---|
| **Authentication** — who is this person? | Clerk |
| **Authorization** — what are they allowed to do? | Our database + middleware |

Clerk owns identity (passwords, OAuth, MFA, sessions).   
Our database owns what role that identity has.

---

## Sign-up flow

```
User fills in the Clerk sign-up form (modal, hosted by Clerk)
  → Clerk creates an account and issues a session
  → Clerk fires a "user.created" webhook to POST /webhooks/clerk
  → Our webhook handler verifies the signature, then inserts a row
    into the "users" table with role = "customer" (the safe default)
```

The user now exists in both Clerk (as the identity source) and    
in our database (as the business record with a role).

---

## Sign-in flow

```
User signs in via the Clerk modal
  → Clerk creates a short-lived JWT session token (~1 min expiry)
    and a long-lived session cookie
  → The browser stores the session cookie
  → On the next page load, the Clerk React SDK automatically
    refreshes the JWT before it expires — completely transparent
```

---

## How the frontend talks to the backend

Every authenticated API call follows this pattern:

```
Frontend (React)
  → useAuth().getToken()                    — asks the Clerk SDK for a fresh JWT
  → apiFetch("/api/me", { getToken })       — attaches it as "Authorization: Bearer <jwt>"
  → Backend receives the request
```

`apiFetch` in `web/src/lib/api.ts` calls `getToken()` before every request and   injects the result as a Bearer token in the `Authorization` header.

---

## How the backend verifies the token

`clerkMiddleware()` is registered in `app.ts` **before** any route handlers:

```
Incoming request
  → clerkMiddleware() reads the Authorization header
  → Fetches Clerk's JWKS (public keys) and verifies the JWT signature
  → Decodes the payload and attaches { userId, isAuthenticated, ... }
    to the request object
  → next() — the request continues to the route handler
```

This is **stateless** — no database call, no session store. The JWT is self-contained and cryptographically signed, so the backend just verifies the signature against Clerk's public keys.

---

## Route protection middleware

Two middleware functions in `backend/src/middlewares/auth.ts` gate the routes:

### `requireAuth`
Checks that `clerkMiddleware` found a valid session (`isAuthenticated && userId`). Returns 401 otherwise.

```
GET /api/me        → requireAuth → meController.getMe
POST /api/checkout → requireAuth → checkoutController.createCheckout
```

### `requireAdmin`
Does the same check **plus** loads the user from our database and verifies their role is `"admin"`. Returns 403 if they're not.

```
GET /api/admin/products → requireAdmin → adminController.listAdminProducts
```

`requireAuth` only trusts the JWT. `requireAdmin` also trusts the database role — this is where authorization lives.

---

## The role system

Roles are stored in `users.role` in our database:

| Role | What they can do |
|---|---|
| `customer` | Default. Browse, buy, chat. |
| `support` | Same as customer + send video invites in support chat. |
| `admin` | Everything + manage products. |

Roles are **not** stored in the JWT. Every role-sensitive request loads the user from the database. This means changing a user's role takes effect immediately — no token refresh required.

Roles are set in **Clerk's `public_metadata`** field. When a Clerk admin sets `public_metadata.role = "admin"` on a user, the next `user.updated` webhook fires and our handler writes that role into the database.

---

## Webhook integrity

The Clerk webhook endpoint (`POST /webhooks/clerk`) is public but protected by a **HMAC-SHA256 signature**. Clerk signs every webhook payload with the `CLERK_WEBHOOK_SECRET`. Our handler:

1. Reads the raw request body (before Express parses JSON — raw bytes matter for HMAC)
2. Calls `verifyWebhook()` from `@clerk/backend/webhooks`
3. Rejects the request with 400 if the signature is invalid

This prevents anyone from sending a fake `user.created` event to inject a row with an `admin` role.

---

## Summary diagram

```
Browser                     Backend                     Clerk
  |                            |                           |
  | -- sign up/in via modal -> |                     Clerk handles it
  |                            | <-- user.created webhook -|
  |                            |   verify signature        |
  |                            |   insert user row (role=customer)
  |                            |                           |
  | -- GET /api/me ----------> |                           |
  |    Authorization: Bearer jwt                           |
  |                            | verifyJWT (JWKS)          |
  |                            | load user from DB         |
  |                            | return { user }           |
  | <-- { user } ------------- |                           |
```
