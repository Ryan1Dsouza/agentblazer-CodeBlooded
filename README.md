# ⚡ AgentBlazer — Official Web Portal & Interactive 3D Experience

> **Pioneering Autonomous & Agentic AI Systems**  
> Built by **Team CodeBlooded** for **Build Blazer — Phase 2**  
> *AgentBlazer Club • Department of Computer Science & Engineering • St Joseph Engineering College (SJEC), Mangaluru*

---

## 🌟 Overview

**AgentBlazer** is the official interactive web portal and student engagement platform for the **AgentBlazer Collective** at St Joseph Engineering College (SJEC). Built from the ground up to redefine collegiate club websites, the portal bridges futuristic aesthetics with hands-on gamification, featuring **fully interactive 3D WebGL environments**, a **real-time responsive community hub**, an **AI-driven floating companion**, and a **dynamic three-state theme engine**.

---

## 🚀 Key Features

### 🎮 1. Gamified 3D Events & Workshops Exploration
Powered by **Three.js** and **React Three Fiber (@react-three/fiber)**, users do not just read about club workshops—they physically drive and navigate through them in real time across three bespoke 3D environments:

*   **🟣 Violet Mode — Cyberpunk Drone Simulation**:
    *   Pilot an autonomous cyber-drone through a neon-lit cyberpunk cityscape.
    *   Navigate through checkpoints, neon rings, and orbital energy fields to unlock event archives.
*   **🔥 Inferno Mode — Volcanic Monorail Expedition**:
    *   Command an industrial high-speed monorail along magma spline tracks.
    *   Features automated depot docking stations, dynamic camera lerping, and throttle mechanics.
*   **❄️ Frost Mode — Glacial Arctic Cruiser**:
    *   Traverse a frozen cyber tundra in an agile low-drag ice vehicle.
    *   Inspect interactive 3D Photo Billboards and holographic event beacons showcasing past hackathons and workshops.

### 🕹️ 2. Adaptive Dual-Mode Controls
*   **Desktop**: Seamless keyboard navigation (`W`, `A`, `S`, `D` or `Arrow Keys`), `Shift` to engage turbo boost, and smooth mouse wheel acceleration.
*   **Mobile & Tablets**: Automatically mounts an intuitive on-screen **virtual touch joystick** with haptic-ready spring physics, hiding unnecessary desktop keys for an uncluttered mobile experience.

### 🎨 3. Dynamic Multi-Theme Engine
Switch between three distinct visual identities on the fly with synchronized 3D scene lighting, UI palettes, and glowing neon accents:
*   **Violet**: Cyberpunk synthwave, deep obsidian surfaces, and neon purple glows.
*   **Inferno**: Magma orange accents, industrial carbon fibers, and volcanic ember effects.
*   **Frost**: Ice-blue aurora tones, frosted translucent glassmorphism, and clean light-mode surfaces.

### 🌐 4. Nexus Hub Community Platform (Discord-Style)
*   **Real-Time Firebase Chat**: A live, multi-user chat room synchronized instantly across all connected users via Google Cloud Firestore.
*   **Discord-Style UI & Presence**: Features an "Online Members" sidebar with verified `@sjec.ac.in` college email badges and active presence heartbeat.
*   **Domain-Restricted Google Auth**: Secure login via Firebase Authentication, strictly limited to approved college email addresses.
*   **Integrated AI Moderation & Bot**: Tag `@agentblazer` in the real-time chat to get instant AI-generated responses visible to the entire community.

### 🤖 5. Nexus Floating AI Assistant
*   An on-screen interactive floating assistant widget.
*   Instant prompt recommendations, club FAQ responses, dynamic mode awareness, and smooth overlay expansion.

### 👥 6. Interactive Leadership & Advisor Showcase
*   Futuristic HUD-styled advisor and executive council cards.
*   Dynamic photo popups, custom badge tags, and randomized inspiring tech quotes.

### 📱 7. Responsive Mobile One-Page Architecture
*   **Desktop vs. Mobile Rendering**: React Router powers the desktop SPA, while mobile users get a continuous vertical scroll layout.
*   **IntersectionObserver Navigation**: The sticky mobile navbar tracks active sections dynamically as the user scrolls.

## 🛠️ Tech Stack & Architecture

| Technology | Purpose |
| :--- | :--- |
| **React 18** | Modern component-based declarative user interface |
| **TypeScript** | Type-safe enterprise-grade codebase |
| **Vite** | Blazing fast build tooling, HMR, and asset bundling |
| **Firebase** | Cloud Firestore for real-time DB & Google Authentication |
| **Three.js** | Core 3D WebGL rendering engine |
| **@react-three/fiber** | Declarative React Three.js scene graph |
| **@react-three/drei** | Three.js shader, lighting, camera, and mesh utilities |
| **Tailwind CSS v4** | Next-generation utility-first styling and animations |
| **Lucide React** | Consistent, modern vector iconography |
| **React Router v6** | Client-side SPA routing with smooth page transitions |
| **GSAP** | High-performance animation timelines |

---

## 📁 Project Directory Structure

```text
agentblazer-CodeBlooded/
├── assets/                       # Static public assets (logos, photos, media)
│   ├── logos/                    # Theme-specific icons, clean badges, chat avatars
│   └── Photos/                   # Executive council & mentor portraits
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── events3D/             # 3D interactive gamified canvas & scenes
│   │   │   ├── modes/            # Mode scenes (Violet, Inferno, Frost)
│   │   │   └── shared/           # Virtual joystick, HUD overlays, docking logic
│   │   ├── community/            # Nexus Hub forum components & channel views
│   │   ├── Header.tsx            # Clean Linear-style header with mode selector
│   │   ├── Footer.tsx            # Portal footer with social links & branding
│   │   ├── NexusFloatingChat.tsx # Floating AI companion widget
│   │   ├── OrbitingSocials.tsx   # Interactive social ring widget
│   │   ├── ParticleLogo.tsx      # Interactive particle mesh animation
│   │   └── LoadingScreen.tsx     # Futuristic portal boot sequence
│   ├── context/                  # Global React contexts (ThemeContext, etc.)
│   ├── data/                     # Data stores (events, team, advisors, config)
│   ├── hooks/                    # Custom React hooks (useTheme, useGamepad, etc.)
│   ├── pages/                    # Route pages (Home, About, Events, Join, Community)
│   ├── styles/                   # Global CSS, theme definitions, animations
│   ├── types/                    # TypeScript interfaces and data models
│   ├── App.tsx                   # Main route tree & layout root
│   └── main.tsx                  # Application bootstrap entrypoint
├── package.json                  # Project dependencies & build scripts
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build and plugin configurations
└── README.md                     # Project documentation
```

---

## 🏁 Getting Started

### Prerequisites
Make sure you have **Node.js** (v18.0.0 or higher recommended) and **npm** installed on your system:
```bash
node -v
npm -v
```

### 1. Clone the Repository
```bash
git clone https://github.com/Ryan1Dsouza/agentblazer-CodeBlooded.git
cd agentblazer-CodeBlooded
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
The application will launch locally at `http://localhost:5173`.

### 4. Build for Production
To generate an optimized production bundle:
```bash
npm run build
```

### 5. Preview Production Build
To preview the generated production files locally:
```bash
npm run preview
```

---

## 🎮 Controls & Navigation Guide

### 3D Events & Workshops Page

| Control | Action | Device |
| :--- | :--- | :--- |
| `W` / `↑` | Move Forward / Throttle Up | Desktop |
| `S` / `↓` | Move Backward / Reverse | Desktop |
| `A` / `←` | Steer Left | Desktop |
| `D` / `→` | Steer Right | Desktop |
| `Shift` (Hold) | Engage Turbo Boost | Desktop |
| `Mouse Wheel` | Smooth Speed Glide | Desktop |
| `Virtual Joystick` | 360° Omnidirectional Steering & Acceleration | Mobile / Tablet |
| `E` / `Dock Button` | Dock to Nearest Event Station / Open HUD | All Devices |

---

## 🏆 Team CodeBlooded

Developed with passion for **Build Blazer — Phase 2** by:

*   **Team Lead**: Shaun / Ryan D'Souza
*   **Team CodeBlooded**: St Joseph Engineering College, Mangaluru
*   **Event**: Build Blazer Phase 2 (Organized by **AgentBlazer Club** in collaboration with **CIPHER - CSE Association**)

---

## 📄 License

This project is developed for educational and collegiate initiative purposes under the **AgentBlazer Collective** at **St Joseph Engineering College (SJEC)**. All rights reserved.
