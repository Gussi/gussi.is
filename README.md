# gussi.is

Personal site with a generative aurora background — calm, minimal, art-first.

## Tech stack

- **Vite + TypeScript** — app bundling and dev server
- **WebGL2** — layered noise shaders for the aurora
- **Rust / WASM** — input smoothing and per-visit random seed (phase, hue, layer offsets)
- **HTML + CSS** — semantic content overlay (name, bio, links)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) — `cargo install wasm-pack`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output goes to `dist/`. Preview the production build:

```bash
npm run preview
```

Deploy by uploading `dist/` to any static host.

## Docker

### Local

Build and run on [http://localhost:8080](http://localhost:8080):

```bash
docker compose up -d --build
```

Override the port with `HTTP_PORT=3000 docker compose up -d --build`.

### Production (Portainer / Traefik)

Pulls the pre-built image from GHCR. Requires an external `traefik` Docker network (`docker network create traefik` if needed).

If the GHCR package is private, add `ghcr.io` as a registry in Portainer with a GitHub PAT (`read:packages` scope).

```bash
docker compose -f docker-compose.production.yml up -d
```

The stack sets minimal Traefik labels (`traefik.enable` and a host rule). TLS, entrypoints, and service port are expected to be configured in your Traefik environment (e.g. file provider or shared middleware).

Default host rule covers: `gussi.is`, `www.gussi.is`, `gussi.dev`, `www.gussi.dev`.

Override via `.env` (see `.env.example`):
- `IMAGE_TAG` — image tag to deploy (default `latest`)
- `HOST_RULE` — Traefik host matcher rule

## Container registry

Pushes to `main` build and publish an image to GitHub Container Registry:

`ghcr.io/gussi/gussi.is:latest`

Pull and run:

```bash
docker pull ghcr.io/gussi/gussi.is:latest
docker run -p 8080:80 ghcr.io/gussi/gussi.is:latest
```

The package is private by default. To make it public: GitHub repo → Packages → Package settings → Change visibility.
