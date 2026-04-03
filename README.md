<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/C++-17-00599C?style=for-the-badge&logo=cplusplus&logoColor=white" alt="C++">
  <img src="https://img.shields.io/badge/Languages-20-FF6B35?style=for-the-badge" alt="Languages">
  <img src="https://img.shields.io/badge/Questions-1864-7C3AED?style=for-the-badge" alt="Questions">
  <img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge" alt="License">
</p>

# ◈ ZYNTHEX CORE — Code Intelligence Engine

## 🌐 Live Demo
👉 https://zynthex-core.onrender.com/

> A high-performance quiz platform designed to help developers master programming languages through structured difficulty progression, real-time analytics, and a hybrid C++/Node.js execution engine.

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
- 📱 **Responsive design**
- 🌙 **Cyberpunk dark theme**

---

## ⚡ Why C++ Engine?

The C++ engine is used to:
- Improve performance for scoring and XP calculations  
- Demonstrate integration of low-level computation with high-level APIs  
- Simulate real-world systems where performance-critical logic is offloaded  

If unavailable, a JavaScript fallback ensures full functionality.

---

## 🚀 Quick Start (Local Development)

```bash
git clone https://github.com/REHAN-503/ZYNTHEX-CORE.git
cd ZYNTHEX-CORE
npm install
npm start
```

Open **http://localhost:3000**

---

## ☁️ Deployment (Render)

This project is deployed on Render:

👉 https://zynthex-core.onrender.com/

Render handles:
- Port configuration  
- Build process  
- Deployment pipeline  

---

## 🗂️ Project Structure

```
ZYNTHEX-CORE/
├── server.js
├── package.json
├── frontend/
│   └── index.html
├── data/
│   ├── questions/
│   │   └── questions.json
│   └── users/
│       └── users.json
├── backend/addon/
│   └── engine.cpp
├── binding.gyp
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Create account |
| POST | /api/login | Login |
| GET | /api/questions | Fetch questions |
| POST | /api/submit | Submit answers |
| GET | /api/analytics | User analytics |

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js |
| Frontend | HTML / CSS / JS |
| Engine | C++ (N-API) |
| Storage | JSON |

---

## 🏗️ Architecture

```
┌────────────────────┐
│     Client (SPA)   │
│  HTML / CSS / JS   │
└─────────┬──────────┘
          │ HTTP Requests
          ▼
┌────────────────────┐
│   Node.js Server   │
│   (API Layer)      │
│                    │
│ • Auth Handling    │
│ • Question Engine  │
│ • Session Mgmt     │
└─────────┬──────────┘
          │
   ┌──────▼──────┐
   │  C++ Engine │   ← High-performance layer (optional)
   │ (N-API Addon)│
   │              │
   │ • XP Logic   │
   │ • Scoring    │
   └──────┬──────┘
          │
     JS Fallback
          │
          ▼
┌────────────────────┐
│   Data Layer       │
│   (JSON Storage)   │
│                    │
│ • Questions DB     │
│ • User Data        │
└────────────────────┘
```

---

## 🔄 Request Flow

1. Client sends request (login / quiz / submit)
2. Node.js processes API logic
3. Scoring handled by:
   - C++ engine (if available) ⚡  
   - JS fallback (if not)  
4. Data read/write from JSON storage
5. Response returned to client

---

## ⚡ Design Highlights

- Hybrid architecture (Node.js + C++)
- Performance-critical logic offloaded to native layer
- Fault-tolerant design with automatic fallback
- Lightweight storage using JSON (no external DB)
- Fully stateless API design
---

## 📜 License

MIT © ZYNTHEX CORE

---

<p align="center">
  <b>Developed by Mahammad Rehan Khatri</b> 🚀<br>
  <sub>Building high-performance hybrid systems with Node.js & C++</sub>
</p>
