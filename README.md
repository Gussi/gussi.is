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
