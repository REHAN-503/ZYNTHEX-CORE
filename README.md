<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/C++-17-00599C?style=for-the-badge&logo=cplusplus&logoColor=white" alt="C++">
  <img src="https://img.shields.io/badge/Languages-20-FF6B35?style=for-the-badge" alt="Languages">
  <img src="https://img.shields.io/badge/Questions-1864-7C3AED?style=for-the-badge" alt="Questions">
  <img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge" alt="License">
</p>

# ◈ ZYNTHEX CORE — Code Intelligence Engine

> A full-stack quiz platform for mastering programming languages — powered by a hybrid **C++ / Node.js** engine with real-time XP progression, analytics, and an in-browser code playground.

---

## ✨ Features

- 🧠 **1,864 MCQ questions** across **20 programming languages**
- 🎯 **5 difficulty tiers** — Beginner → Easy → Intermediate → Advanced → Expert
- ⚡ **C++ scoring engine** (N-API addon) with automatic JS fallback
- 📊 **Real-time analytics** — radar chart, per-topic breakdown, weak-area detection
- 🎮 **XP & Level system** — earn XP, level up, track progress
- 🔐 **Email + password authentication** with session persistence
- 💻 **In-browser code playground** — live JavaScript execution
- 🔀 **Shuffled answer options** — randomized every time for fair testing
- 📱 **Responsive design** — works on desktop, tablet, and mobile
- 🌙 **Cyberpunk dark theme** — sleek UI with glow effects and animations

---

## 🚀 Quick Start

### Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/ZYNTHEX-CORE.git
cd ZYNTHEX-CORE

# Install dependencies
npm install

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

### Optional: Enable C++ Engine

```bash
npm run build    # Compile C++ addon (requires node-gyp + build tools)
npm start        # Server auto-detects and uses the native engine
```

> The C++ engine provides faster XP/scoring calculations. Without it, the server uses an identical pure-JS fallback — no features are lost.

---

## ☁️ Deploy on Railway

1. Push this repo to **GitHub**
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select your repo — Railway auto-detects Node.js
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Deploy** — your app goes live at `https://your-app.up.railway.app`

> Railway sets `PORT` automatically. No environment variables needed.

---

## 🗂️ Project Structure

```
ZYNTHEX-CORE/
├── server.js                 ← Node.js HTTP server (all API routes)
├── package.json              ← Scripts & dependencies
├── frontend/
│   └── index.html            ← Single-page app (HTML + CSS + JS)
├── data/
│   ├── questions/
│   │   └── questions.json    ← 1,864 MCQs across 20 languages
│   └── users/
│       └── users.json        ← User accounts & progress (auto-created)
├── backend/addon/
│   └── engine.cpp            ← Optional C++ N-API scoring engine
├── binding.gyp               ← C++ build configuration
├── .gitignore
├── .dockerignore
└── README.md
```

---

## 🌐 Supported Languages

| # | Language | Questions | # | Language | Questions |
|---|----------|-----------|---|----------|-----------|
| 1 | Python | 263 | 11 | CSS | 60 |
| 2 | C++ | 265 | 12 | Shell | 60 |
| 3 | Java | 226 | 13 | Perl | 55 |
| 4 | JavaScript | 225 | 14 | Scala | 53 |
| 5 | TypeScript | 80 | 15 | Dart | 40 |
| 6 | C# | 80 | 16 | HTML | 40 |
| 7 | Go | 80 | 17 | Kotlin | 40 |
| 8 | SQL | 80 | 18 | Lua | 40 |
| 9 | Rust | 77 | 19 | PHP | 40 |
| 10 | Swift | 40 | 20 | R | 20 |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/register` | Create a new account (name, email, password) |
| `POST` | `/api/login` | Sign in with email + password |
| `POST` | `/api/init` | Initialize or resume a session |
| `GET` | `/api/questions` | Fetch questions (query: `language`, `difficulty`) |
| `GET` | `/api/languages` | List all languages with question counts |
| `POST` | `/api/submit` | Submit an answer → returns XP, correctness |
| `GET` | `/api/analytics` | Get user analytics (query: `userId`) |
| `POST` | `/api/runCode` | Execute code in the playground |

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js (zero external dependencies) |
| **Frontend** | Vanilla HTML / CSS / JavaScript (SPA) |
| **Engine** | C++ 17 via N-API (optional, with JS fallback) |
| **Database** | JSON file storage (`users.json`) |
| **Auth** | SHA-256 hashed passwords + `sessionStorage` |
| **Icons** | CDN-hosted official language logos |

---

## 🏗️ Architecture

```
┌──────────────┐     HTTP      ┌──────────────┐
│   Browser    │◄─────────────►│   server.js  │
│  (SPA)       │               │   (Node.js)  │
│              │               │              │
│  index.html  │               │  ┌─────────┐ │
│  + CSS + JS  │               │  │ C++ Eng. │ │  ← Optional
│              │               │  └────┬────┘ │
└──────────────┘               │       │ JS   │
                               │    fallback  │
                               │       │      │
                               │  ┌────▼────┐ │
                               │  │  JSON   │ │
                               │  │  files  │ │
                               │  └─────────┘ │
                               └──────────────┘
```

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port (Railway sets this automatically) |

---

## 📜 License

MIT © ZYNTHEX CORE

---

<p align="center">
  <b>Built with ❤️ and C++</b><br>
  <sub>A hybrid engine for the modern developer</sub>
</p>
