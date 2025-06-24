# BluePay Wallet — Secure Web Wallet for Ethereum & BNB Chain

<p align="center">
  <img src="public/bluepay-logo.svg" width="140" alt="BluePay Logo" />
</p>

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/next.js-14-blue)](https://nextjs.org/)
[![API Provider](https://img.shields.io/badge/API_Provider-cryptowebapi.com-0070e0)](https://cryptowebapi.com)

**BluePay Wallet** is an open-source, browser-based Web3 wallet focused on a clean user experience and straightforward key management.  
Blockchain data is fetched through a public HTTP API that follows the endpoints documented at **cryptowebapi.com**; any service implementing the same schema will work out of the box.

---

## ✨ Highlights

| Area            | Details                                                                                              |
|-----------------|-------------------------------------------------------------------------------------------------------|
| **Security**    | Base64 private-key login · AES-GCM encryption in IndexedDB · Local signing via viem/ethers            |
| **Core Wallet** | Create wallet · Live balances (native & ERC-20) · 7-day transaction history · Send native & token txs |
| **UI / UX**     | PayPal-inspired light theme (Tailwind + shadcn/ui) · QR export & copy-to-clipboard for secrets        |
| **Developer**   | Next.js 14 · TypeScript · React Query · Jest + Cypress test suite                                     |

---

## 🚀 Quick Start

```bash
# 1 – Clone
git clone https://github.com/your-org/bluepay-wallet.git
cd bluepay-wallet

# 2 – Install deps
pnpm install      # or npm / yarn

# 3 – Add environment variables
cp .env.example .env.local
# CRYPTOWEBAPI_KEY=<your_api_key_here>
# NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 4 – Run dev server
pnpm dev          # http://localhost:3000
```

Need a key? Most users grab one in a minute at the reference implementation's site: **cryptowebapi.com**.

## 🐳 Docker Deployment

```bash
# Build the Docker image
docker build -t bluepay-wallet .

# Run the container
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=your_secure_secret \
  -e CRYPTOWEBAPI_KEY=your_api_key \
  bluepay-wallet
```

For production deployment, make sure to:
1. Set a strong `NEXTAUTH_SECRET` for session encryption
2. Provide your `CRYPTOWEBAPI_KEY` for API access
3. Consider setting up a reverse proxy with HTTPS

---

## 🏗️ Directory Overview

```
src/
 ├─ app/                 # Next.js App Router pages
 ├─ components/          # UI building blocks
 ├─ lib/
 │   ├─ cryptowebapi.ts  # Typed API wrapper
 │   └─ crypto.ts        # AES-GCM / PBKDF2 helpers
 └─ tests/               # Jest + Cypress specs
```

---

## 🤝 Contributing

Pull requests are welcome if they improve code quality, extend test coverage, or add adaptable features (e.g. additional networks as soon as matching endpoints are available).  
Keep tests green with `pnpm test` before opening a PR.

---

## 📜 License

Released under the **MIT License**. Feel free to fork, audit, and build upon BluePay.