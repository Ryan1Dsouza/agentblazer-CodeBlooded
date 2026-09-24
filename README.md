# ⚡ AgentBlazer — Official Web Portal & Interactive 3D Experience

> **Official Web Portal & Interactive 3D Experience**  
> Built by **Team CodeBlooded** for **Build Blazer — Phase 2**  
> *AgentBlazer Club • Department of Computer Science & Engineering • St Joseph Engineering College (SJEC), Mangaluru*

---

## 🌟 Overview

**AgentBlazer** is the official student engagement platform for the **AgentBlazer Club** at St Joseph Engineering College (SJEC). The portal features an interactive 3D WebGL environment for exploring events, a real-time community hub, a floating chat assistant, and a customizable three-theme layout.

---

## 🚀 Key Features

### 🎮 1. Interactive 3D Events & Workshops
Powered by **Three.js** and **React Three Fiber**, users can drive and navigate through virtual environments to explore club workshops across three themes:

*   **Violet Mode**: Pilot a drone through a neon cityscape.
*   **Inferno Mode**: Command a monorail along magma tracks with automated docking stations.
*   **Frost Mode**: Traverse a winter environment to inspect interactive 3D event billboards.

### 🕹️ 2. Adaptive Controls
*   **Desktop**: Keyboard navigation (`W/A/S/D` or Arrows), `Shift` for boost, and mouse wheel for smooth scrolling.
*   **Mobile**: An intuitive on-screen **virtual touch joystick** with haptic feedback.

### 🎨 3. Multi-Theme Engine
Switch between three distinct visual themes with synchronized 3D scene lighting and UI palettes:
*   **Violet**: Synthwave style with deep surfaces and purple accents.
*   **Inferno**: Industrial style with orange accents and ember effects.
*   **Frost**: Light-mode style with ice-blue tones and frosted glassmorphism.

### 🌐 4. Community Hub (Discord-Style)
*   **Real-Time Firebase Chat**: A live, multi-user chat room synchronized via Google Cloud Firestore.
*   **Discord-Style UI & Presence**: Features an "Online Members" sidebar with verified `@sjec.ac.in` email badges.
*   **Domain-Restricted Google Auth**: Secure login strictly limited to approved college email addresses.
*   **Integrated Bot**: Tag `@agentblazer` in the chat to get automated responses.

### 🤖 5. Floating Assistant
*   An on-screen interactive floating chat widget.
*   Provides club FAQ responses, prompt recommendations, and theme awareness.

### 👥 6. Leadership & Advisor Showcase
*   Interactive advisor and executive council cards with dynamic photo popups.

### 📱 7. Responsive Mobile One-Page Architecture
*   **Desktop vs. Mobile Rendering**: React Router powers the desktop SPA, while mobile users get a continuous vertical scroll layout.
*   **IntersectionObserver Navigation**: The sticky mobile navbar tracks active sections dynamically as the user scrolls.

## 🛠️ Tech Stack & Architecture

| Technology | Purpose |
| :--- | :--- |
| **React 18** | UI Library |
| **TypeScript** | Type-safe development |
| **Vite** | Build tooling and bundler |
| **Firebase** | Cloud Firestore & Google Authentication |
| **Three.js** | 3D WebGL rendering engine |
| **@react-three/fiber** | React renderer for Three.js |
| **@react-three/drei** | Three.js utilities and helpers |
| **Vanilla CSS** | Custom styling and animations |
| **Lucide React** | Icons |
| **React Router v6** | Client-side routing |
| **GSAP** | Animation library |

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
| `Mouse Wheel` | Smooth Scroll Autopilot | Desktop |
| `E` | Manual Dock to Nearest Station (within 25m) | Desktop |
| `X` / `ESC` | Abort Mission / Exit 3D Canvas | Desktop |
| `Virtual Joystick` | Omnidirectional Steering & Acceleration | Mobile / Tablet |
| `BOOST` Button | Engage Turbo Boost | Mobile / Tablet |
| *Auto-Dock* | Approach any station to dock automatically | All Devices |

---

## 🏆 Team CodeBlooded

Developed with passion for **Build Blazer — Phase 2** by:

*   **Team Lead**: Ryan David Dsouza
*   **Team Members**: Kevin John Lewis and Shaun
*   **Team CodeBlooded**: St Joseph Engineering College, Mangaluru
*   **Event**: Build Blazer Phase 2 (Organized by **AgentBlazer Club** in collaboration with **CIPHER - CSE Association**)

---

## 📄 License

This project is developed for educational and collegiate initiative purposes under the **AgentBlazer Collective** at **St Joseph Engineering College (SJEC)**. All rights reserved.
