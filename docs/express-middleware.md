# Express Middleware & Error Handling

## How middleware works

Middleware is just a function Express calls in the order you register it. Each one receives `(req, res, next)` and must either send a response or call `next()` to pass control to the next function in the chain.

```ts
app.use((req, res, next) => {
  // do something, then continue
  next();
});
```

If you call `next(someError)`, Express skips all remaining normal middleware and jumps to the nearest error handler.

---

## The 4-parameter convention

Express identifies an error handler by its signature — **exactly 4 parameters**: `(err, req, res, next)`.

```ts
// normal middleware — 3 params
app.use((req, res, next) => { ... });

// error handler — 4 params
app.use((err, req, res, next) => { ... });
```

This is purely a function arity check. The names don't matter — what matters is that there are four of them. TypeScript types them as `(err: unknown, req: Request, res: Response, next: NextFunction)`.

---

## Chaining error handlers

You can have multiple error handlers — they chain the same way as normal middleware. Calling `next(err)` inside an error handler passes the error to the next one.

In this project there are two, registered in order:

```
Sentry.setupExpressErrorHandler(app)   ← captures the error and reports it, then calls next(err)
app.use((_err, _req, res, _next) => {  ← sends the JSON 500 response to the client
  res.status(500).json({ error: "Internal server error" });
})
```

Sentry's handler never sends a response — it only captures and forwards. The custom handler sends the response, so it must always come last.

---

## Registration order matters

Express processes middleware in the order `app.use()` is called. This means:

- **Webhooks** must be registered before `express.json()` — they need the raw request body for signature verification.
- **Routes** come after body parsers and auth middleware.
- **Error handlers** must be registered last, after all routes, so they can catch errors from anywhere above them.

The order in `app.ts`:

```
rawJson webhook routes         ← need raw body, come first
cors / express.json / clerk    ← body parsing and auth
sentryClerkUserMiddleware      ← attaches user to error reports
/api routes + /health          ← application logic
static file serving + SPA      ← frontend assets
Sentry error handler           ← captures errors
JSON 500 error handler         ← responds to the client
```

---

## How a controller error reaches the client

1. A route handler calls `next(e)` inside a `catch` block.
2. Express skips all remaining normal middleware.
3. `Sentry.setupExpressErrorHandler` captures the error and calls `next(err)`.
4. The JSON error handler runs and sends `{ error: "Internal server error" }` with status `500`.
