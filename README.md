# Numatix Trading Platform: Full Technical Analysis & Architecture

A high-performance, real-time cryptocurrency trading platform built with a microservices-based event-driven architecture. This project demonstrates the implementation of distributed systems, real-time data broadcasting, and high-fidelity UI/UX design.

---

## 🏗️ 1. Architecture Overview

The system is designed as a **decoupled microservices architecture** orchestrated via **Redis Pub/Sub**. This ensures high availability, horizontal scalability, and non-blocking order execution. Built with **Production-Grade Features** including Rate Limiting and Input Validation.

### **Service Breakdown**
1.  **Frontend (Next.js 16.1):** A high-fidelity, responsive React application. It uses a custom-built design system with dynamic font scaling and resizable panels to provide a premium "trading desk" experience.
2.  **API Gateway (Express.js):** Acts as the entry point for all client requests. It handles authentication (JWT), request validation (Zod), and command publishing.
3.  **Execution Service:** A dedicated worker service that listens for order commands. It manages interaction with external exchange APIs (Binance Testnet), implements signing logic, and calculates execution metrics like Volume-Weighted Average Price (VWAP).
4.  **Event Service:** A real-time WebSocket broadcasting hub. It listens to execution events and pushes live updates to connected clients based on their session identity.
5.  **Persistence Layer (Prisma + SQLite/PostgreSQL):** A shared database package used by all services for audit trails, user account management, and position tracking.

---

## 🔄 2. Order Lifecycle & How It Works

One of the most critical parts of the system is the asynchronous order flow, which prevents the user experience from hanging during slow API calls to an exchange.

1.  **Submission:** The client submits an order via the **Order Form**.
2.  **Ingestion:** The **Backend API** validates the token and the order schema. It does NOT call Binance. Instead, it generates a unique `orderId`, records a `PENDING` command in the DB, and publishes a message to the `commands:order:submit` Redis channel.
3.  **Execution:** The **Execution Service** picks up the command from Redis. It retrieves the user's encrypted API keys from the database, signs the request using HMAC-SHA256, and executes the trade on the **Binance Testnet**.
4.  **Processing:** Upon execution, the service receives a series of "fills" from the exchange. It calculates the **VWAP (Volume-Weighted Average Price)** to ensure the user sees an accurate entry price.
5.  **Broadcasting:** The Execution Service updates the DB status to `FILLED` and publishes an event to `events:order:status`.
6.  **Real-time Update:** The **Event Service** (listening on that channel) identifies the targeted user and pushes the final execution details to their browser via **WebSocket**.

---

## 🎨 3. UI/UX Analysis: The "Premium Trading Desk"

The frontend was designed with a "Binance-Inspired" aesthetic, focusing on information density without clutter.

### **Key Technical Features:**
-   **Resizable Panelling:** Custom-implemented draggable borders for the Order Form and Orders Table using `mousemove` and `useMemo` hooks.
-   **Dynamic Font Scaling:** A state-driven scaling engine (`--panel-scale`) that automatically adjusts font sizes and element spacing as the user resizes panels, maintaining visual hierarchy at any width.
-   **Floating Card Aesthetic:** Implementation of a strict viewport layout (`h-screen`) with `pl-10` and `p-6` padding to create a "suspended" workspace feel, separated by deep shadows and rounded-2xl corners.
-   **Interactive Price Sync:** The Order Form includes a manual-override detection system. It defaults to the live market price but stops auto-syncing if the user starts typing a specific limit, with an instant "Reset to Market" utility.
-   **Keyboard Hotkeys:** Rapid trading via shortcuts (`B` for Buy, `S` for Sell, `L` for Limit, `M` for Market).

---

## 🛠️ 4. Bonus Features Implemented

| Feature | Status | Implementation Detail |
| :--- | :--- | :--- |
| **Input Validation** | ✅ | Schema validation using Zod on all critical endpoints. |
| **API Rate Limiting** | ✅ | Brute-force protection on the API Gateway (100 req/15min). |
| **Order Cancellation** | ✅ | End-to-end cancellation flow from UI to Binance API. |
| **URL-based Routing** | ✅ | Dynamic routing (/trade/[symbol]) for bookmarkable pairs. |
| **Graceful Reconnect** | ✅ | Automated WebSocket reconnection with backoff logic. |
| **Theme Toggle** | ✅ | Sophisticated Light/Dark mode with state persistence. |
| **Docker Support** | ✅ | Multi-container orchestration for the entire stack. |
| **Keyboard Shortcuts**| ✅ | Hotkeys for trade direction and order types. |

---

## 🛠️ 5. Technical Analysis: Design Decisions

| Decision | Rationale |
| :--- | :--- |
| **Redis Pub/Sub** | Simplifies service communication. If the Execution Service is busy or down, orders wait in the stream/bus, preventing loss. |
| **Separation of Services** | Allows us to scale the "Event Service" (WebSocket connections) independently of the "Execution Service" (computationally heavy signing/API calls). |
| **VWAP Calculation** | For Market orders, exchange prices fluctuate across different "fills." Calculating the weighted average provides the most honest "Entry Price" for the user's position. |
| **Thin-Scrollbars & Internal Scrolling** | By using custom CSS to hide scrollbars and fixing the "Account Summary" to the bottom, we ensure that critical data (Balance, Margin) is **never** scrolled out of view. |

---

## 🚀 5. Setup & Environment

### **Prerequisites**
- Docker & Docker Compose
- Binance Testnet API Keys (https://testnet.binance.vision/)

### **Installation**
1.  **Clone & Install:**
    ```bash
    npm install
    npx prisma generate --schema=packages/database/prisma/schema.prisma
    ```
2.  **Docker Deployment (Recommended):**
    ```bash
    docker-compose up --build
    ```
3.  **Access:**
    - Frontend: `http://localhost:3000`
    - Backend: `http://localhost:3001`

---

## 📈 6. Future Roadmap & Improvements
- **Execution Persistence:** Implementing Redis Streams instead of simple Pub/Sub for persistent message storage in case of service failure.
- **Advanced Charting:** Adding drawing tools and technical indicators (RSI, MACD) directly into the `lightweight-charts` wrapper.
- **Account Logic:** Real-time margin calculation and automated liquidation logic based on live mark prices.
- **Multi-Pair Support:** Currently optimized for BTC/USDT; expanding to full exchange symbol support.

---

Built for **Numatix Assessment** | Dedicated to High-Performance Trading Systems.
