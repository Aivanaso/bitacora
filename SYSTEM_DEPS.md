# Dependencias del sistema — Bitácora

Paquetes necesarios para compilar y ejecutar Bitácora en un sistema Linux (Ubuntu/Debian).

## Instalación

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  pkg-config \
  libssl-dev \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  librsvg2-dev \
  libayatana-appindicator3-dev \
  libxdo-dev \
  libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev \
  curl \
  wget \
  file
```

## Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

## Node.js

Se recomienda Node.js 22+ vía nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 22
```

## pnpm

```bash
npm install -g pnpm@latest
```

## Script rápido para setup completo

```bash
#!/bin/bash
set -e

# Dependencias del sistema
sudo apt-get update
sudo apt-get install -y \
  build-essential pkg-config libssl-dev \
  libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev \
  libayatana-appindicator3-dev libxdo-dev \
  libsoup-3.0-dev libjavascriptcoregtk-4.1-dev \
  curl wget file

# Rust
if ! command -v cargo &> /dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
fi

# Node.js (si no está)
if ! command -v node &> /dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 22
fi

# pnpm
npm install -g pnpm@latest

# Instalar dependencias del proyecto
pnpm install

echo "Setup completo. Ejecuta 'pnpm tauri dev' para arrancar."
```
