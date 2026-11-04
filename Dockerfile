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
FROM nginx:1.31.8-alpine@sha256:785835ea65db4bba6f021acc0f3be91b0fef76a53fe41f8588c6698d2aed0606 AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
