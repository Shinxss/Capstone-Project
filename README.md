# Lifeline — Blockchain-Based Emergency Volunteer Coordination System

Lifeline is a dual-platform (Web + Mobile) emergency response system designed to improve **disaster volunteer coordination** in the Philippines. It centralizes emergency reporting, volunteer management, and task tracking—then adds **AI-assisted dispatch & routing** and **blockchain-based immutable logging** for transparency, accountability, and data integrity.

> Capstone Project (January 2026)

---

## Table of Contents
- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Security](#security)
- [Limitations](#limitations)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)
- [Contributors](#contributors)
- [License](#license)

---

## Project Overview

During disasters (typhoons, floods, fires), volunteer coordination often relies on fragmented tools like calls, SMS, and social media—leading to **delayed response**, duplicated efforts, and weak accountability. Lifeline addresses this by providing:

- A **Web dashboard** for LGU/Barangay officials and admins to monitor emergencies and manage tasks
- A **Mobile app** for community members and volunteers to send SOS, receive assignments, and submit after-action reports
- A **Blockchain integrity layer** for tamper-proof logs of verified volunteer activities
- A **Rule-based AI module** for faster task assignment and route optimization (with Mapbox routing support)

Aligned with **SDG 11 (Sustainable Cities and Communities)** and **SDG 13 (Climate Action)**.

---

## Core Features

### Emergency Reporting & Monitoring
- Community emergency reporting (SOS / incident submission)
- Real-time dashboards and maps for monitoring incidents and deployments
- Task creation by LGU/Barangay officials (required skills + location)

### Volunteer Management
- Volunteer registration + profile skills tagging (e.g., medical, rescue)
- Task notifications, accept/reject flow, and status tracking
- After-Action Reports (AAR) submission (photo/text proof)

### AI-Assisted Dispatch & Routing
- Rule-based task assignment using:
  - verified skills
  - availability
  - proximity
- Route optimization for faster/safest response paths
- Optional integration with **Mapbox** for navigation/optimization when needed

### Blockchain for Transparency & Accountability
- Immutable logging of verified/approved records such as:
  - task completion logs
  - volunteer activity logs
  - after-action reports (stored as cryptographic hashes)
- Hybrid approach:
  - **Off-chain (MongoDB)** for frequently updated data
  - **On-chain** for finalized/verified audit records

### Offline Support
- Offline SOS via **SMS redirection** (requires active SMS capability; syncing final records needs internet)

---

## User Roles

- **Super Admin / CDRRMO Admin**
  - Manage accounts, system-wide analytics, monitoring
- **LGU / Barangay Officials**
  - Create tasks, endorse/verify completion, monitor deployments
- **Volunteers**
  - Verify identity, receive assignments, navigate routes, submit AAR
- **Community Users**
  - Submit emergency reports and SOS requests

---

## Tech Stack

### Web
- React + TypeScript (Vite)
- Tailwind CSS

### Mobile
- React Native + TypeScript (Expo)
- NativeWind
- Mapbox (maps/routing)

### Backend
- Node.js + Express.js
- TypeScript
- JWT Auth + RBAC

### Database
- MongoDB / MongoDB Atlas

### Blockchain
- Solidity Smart Contracts
- Ganache / Local testnet (prototype)
- Ethers.js or Web3.js (backend ↔ chain)

### AI / Automation
- Rule-based task assignment (deterministic/explainable)
- Route optimization logic (with Mapbox fallback if needed)

---

## How It Works

1. **Community user sends SOS / emergency report** (online or via SMS offline)
2. **Backend API validates & stores** operational data in MongoDB
3. **LGU creates tasks** and the system **endorses/assigns volunteers** using AI rules (skills + proximity + availability)
4. **Volunteer receives task + optimized route** in the mobile app
5. Volunteer completes task → submits **After-Action Report**
6. LGU verifies completion → **finalized record is hashed and logged on-chain**
7. Admin dashboards show status, deployments, and audit trails

---

## Security

Lifeline is built for high-stakes scenarios. Key controls include:
- **Role-Based Access Control (RBAC)** for all protected actions
- **Input validation & sanitization** (client + server) to reduce injection risks
- **TLS/HTTPS** for data in transit
- Sensitive data stored off-chain; **blockchain stores immutable hashes** for integrity
- Smart contract access control so only authorized officials can trigger critical on-chain writes
- Monitoring/logging for authentication, role changes, and task updates

---

## Limitations

This is a prototype with practical boundaries:
- Blockchain runs on **local/testnet** (Ganache/private network), not mainnet
- AI routing cannot automatically detect unreported hazards unless entered by officials
- No direct integration with national databases (e.g., NDRRMC) in current scope
- Final AI/blockchain sync requires internet connectivity (offline SOS is limited to SMS initiation)

---

## Getting Started (Local Development)

> Adjust paths/commands to your repository structure.

### Prerequisites
- Node.js (LTS recommended)
- npm / pnpm
- MongoDB (local) or MongoDB Atlas
- Expo Go (mobile testing)
- Ganache (for local blockchain testing)
- Mapbox API token (for maps/routing)

### 1) Clone
```bash
git clone <your-repo-url>
cd lifeline
