# Monolith: Vite web + Express API. Build from repo root 

# --- Stage 1: build the SPA (Vite) ---
# Produces static HTML/JS/CSS under dist/ — copied into the final image as ./public.
FROM node:24-bookworm-slim AS web-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY web/ ./web/
# Empty = browser calls /api on the same host as the page (same domain as Express).
ENV VITE_API_URL=
# Public Clerk key (safe to pass as build-arg; it is embedded in client JS anyway)
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
# Public GA measurement ID (embedded in client JS). Empty = analytics disabled.
ARG VITE_GA_MEASUREMENT_ID
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
RUN npm install --no-audit --no-fund \
  && npm run build --workspace=web

# --- Stage 2: compile the API (TypeScript → JavaScript) ---
# Produces dist/ with index.js and the rest of the server bundle.
FROM node:24-bookworm-slim AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY backend/ ./backend/
RUN npm install --no-audit --no-fund \
  && npm run build --workspace=backend

# --- Stage 3: runtime image (only prod deps + built assets) ---
# Express serves API routes and static files from public/ (the Vite build from stage 1).
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=web-build /app/web/dist ./dist/public

EXPOSE 3001
USER node

CMD ["node", "--import", "./dist/instrument.js", "dist/index.js"]