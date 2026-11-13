# Base images are pinned by tag + digest so a rebuild is reproducible.
# Dependabot bumps both (see .github/dependabot.yml).

# Build stage: Node + Rust/wasm-pack for the static site
FROM node:24.22.2-bookworm@sha256:e7add2a490bb17d97b485b8641bd88455fff7839ade0f5eba493c3508124d413 AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates build-essential \
  && rm -rf /var/lib/apt/lists/*

ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH

WORKDIR /app

# The Rust version and wasm target come from wasm/rust-toolchain.toml.
COPY wasm/rust-toolchain.toml wasm/
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --profile minimal --default-toolchain none \
  && cd wasm \
  && rustup toolchain install \
  && rustup default "$(rustup show active-toolchain | cut -d' ' -f1)" \
  && cargo install wasm-pack --version 0.15.0 --locked

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage: serve static assets with nginx (stable branch)
FROM nginx:1.30.6-alpine@sha256:583b7f2fce1cdb8da5ad5c39ebd3c33b98b87d493190e548bdee1fa8c619c311 AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
