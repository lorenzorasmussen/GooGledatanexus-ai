
# Company Intranet Platform - Dashboard & Wiki (React Edition with Pinecone & Backend Gemini)

Welcome to the Company Intranet Platform, a modern, feature-rich internal platform. This version features a dynamic dashboard built with React and a Node.js/Express backend leveraging Pinecone for its Wiki search and storage, and Google Gemini for AI-powered crypto explanations via the backend.

## Core Concept

The platform aims to provide a centralized place for company information, tools, and communication, with a powerful semantic search for its knowledge base (Wiki) and intelligent data insights.

## Current State & Features

*   **Frontend (React):**
    *   A single-page application built with React and TypeScript.
    *   **Views:** Dashboard and Wiki.
    *   **Dashboard Widgets (Dynamic Data):**
        *   Calendar & Notifications (mock data from backend).
        *   Weather (live from OpenWeatherMap via backend if API key is set, otherwise mock).
        *   Cryptocurrency Prices (live from CoinGecko via backend).
        *   AI Explanations for Crypto (requested from backend, which uses Gemini API).
    *   **Wiki Section:**
        *   Search wiki pages (powered by Pinecone on the backend).
        *   View wiki page content.
        *   Add and Edit wiki pages (content stored and indexed in Pinecone).
    *   Responsive design for mobile and web.

*   **Backend (Node.js Express with Pinecone, CoinGecko & Gemini):**
    *   Express application (`server.js`) serving as the backend.
    *   **Pinecone Integration for Wiki:**
        *   Uses the `@pinecone-database/pinecone` SDK.
        *   Connects to a Pinecone index (default: `company-wiki`).
        *   **Simulated Embeddings:** For demonstration, text embeddings for upserting and querying are simulated with random vectors. In a production environment, you would integrate a real sentence embedding model.
    *   **CoinGecko Integration for Crypto Prices:**
        *   Uses `node-fetch` to call the CoinGecko API for live BTC and ETH prices.
    *   **Google Gemini Integration for AI Explanations (Secure):**
        *   Uses the `@google/genai` SDK.
        *   The `GEMINI_API_KEY` is stored securely on the backend and never exposed to the client.
        *   Provides an endpoint for the frontend to request AI-generated explanations for cryptocurrency trends.
    *   **OpenWeatherMap Integration for Weather (Optional):**
        *   If `OPENWEATHERMAP_API_KEY` is set in the backend `.env`, it fetches live weather. Otherwise, provides mock data.
    *   **API Endpoints:**
        *   `/api/dashboard`: Calendar and Notifications.
        *   `/api/weather`: Weather data.
        *   `/api/crypto/:pair`: Live BTC/ETH data from CoinGecko.
        *   `/api/ai/explain-crypto` (POST): Generates AI explanation for crypto data.
        *   `/api/wiki/search` (POST): Searches wiki pages in Pinecone.
        *   `/api/wiki` (POST): Upserts (creates/updates) a wiki page to Pinecone.
        *   `/api/wiki/:page_id` (GET): Fetches a specific page by ID from Pinecone.
        *   `/api/wiki` (GET): Fetches a sample list of pages from Pinecone.

## Technology Stack

*   **Frontend:** React, TypeScript, HTML, CSS
*   **Backend:** Node.js, Express.js, Pinecone (via `@pinecone-database/pinecone`), Google Gemini API (via `@google/genai`), CoinGecko API (via `node-fetch`), OpenWeatherMap API (optional, via `node-fetch`)
*   **Styling:** Custom CSS in `index.html`.
*   **AI (Backend for Crypto Explanations & Wiki):** Google Gemini, Pinecone for vector search. Real text embeddings for Wiki would require a separate model.

## Prerequisites

*   **Node.js:** Version 16.x or newer (includes npm).
*   A modern web browser.
*   **A React build environment:** (e.g., Vite or Create React App).
*   **Pinecone Account:**
    *   API Key.
    *   Environment Name.
    *   An existing Pinecone index (e.g., `company-wiki`) with a dimension matching your (simulated or real) embeddings (current simulation uses dimension 10).
*   **Google Gemini API Key:** For AI-powered crypto explanations.
*   **(Optional) OpenWeatherMap API Key:** For live weather data.
*   **(Note on CoinGecko)** The free CoinGecko API has rate limits. For heavy usage, consider their paid plans.

## Setup and Running

1.  **Clone or Download the Project.**

2.  **Backend Setup (Node.js Express & Pinecone):**
    *   Navigate to the project directory (where `server.js` is).
    *   **Create a `.env` file** in this directory (you can copy `.env.example`) with your credentials:
        ```env
        PINECONE_API_KEY=YOUR_PINECONE_API_KEY
        PINECONE_ENVIRONMENT=YOUR_PINECONE_ENVIRONMENT
        GEMINI_API_KEY=YOUR_GEMINI_API_KEY
        OPENWEATHERMAP_API_KEY=YOUR_OPENWEATHERMAP_API_KEY_IF_ANY 
        ```
        Replace with your actual values. `OPENWEATHERMAP_API_KEY` is optional.
    *   **Install dependencies:**
        ```bash
        npm install
        ```
        (This will install `express`, `cors`, `@pinecone-database/pinecone`, `node-fetch`, `@google/genai`, `dotenv`).
    *   **Run the Backend Server:**
        ```bash
        npm start
        ```
        The server will start (typically `http://localhost:5001`) and attempt to connect to services. Check console logs.

3.  **Frontend Setup (React):**
    *   Ensure you have a React development environment set up (e.g., using Vite: `npm create vite@latest my-react-app -- --template react-ts`).
    *   Copy the provided React source files (`index.tsx`, `App.tsx`, `src/` directory, `index.html`) into your Vite project structure, replacing existing files where necessary.
    *   **Frontend Environment Variables (if any):**
        The `VITE_GEMINI_API_KEY` previously used on the frontend for direct Gemini calls is no longer needed for that purpose as AI explanations are now proxied through the backend. If you have other Vite-specific frontend env vars, manage them in your frontend project's `.env` file.
    *   **Install frontend dependencies** (if you created a new Vite project):
        Navigate to your React project directory (e.g., `my-react-app`)
        ```bash
        npm install
        ```
    *   **Run the Frontend Development Server:**
        From your React project directory:
        ```bash
        npm run dev
        ```
        Open the URL provided (e.g., `http://localhost:5173`).

## API Endpoints (Provided by `server.js`)

*   `GET /api/dashboard`
*   `GET /api/weather`
*   `GET /api/crypto/:pair` (e.g., `/api/crypto/BTCUSD`)
*   `POST /api/ai/explain-crypto` (Body: `{ "pairSymbol": "Bitcoin (BTC)", "price": "50000", "changePercent": "2.5" }`)
*   `POST /api/wiki/search` (Body: `{ "query": "your search term" }`)
*   `POST /api/wiki` (Body: `{ "title": "Page Title", "content_md": "# Markdown content", "id": "optional-page-id-for-update" }`)
*   `GET /api/wiki/:page_id`
*   `GET /api/wiki` (lists a sample of pages)

## Project Structure (Focus on changes)

```
/ (Original Project Root)
├── index.html              # Main HTML host (updated CSS for responsiveness)
├── index.tsx               # React entry point
├── App.tsx                 # Root React component (Gemini SDK init removed)
├── src/
│   ├── components/
│   │   ├── CryptoWidget.tsx (calls backend for AI explanations)
│   │   ├── ... (other components)
│   ├── ... (other React source files)           
├── server.js               # Node.js backend (added Gemini API proxy, dotenv)
├── package.json            # Backend dependencies (added @google/genai, dotenv)
├── .env.example            # Example for backend environment variables (added GEMINI_API_KEY)
└── README.md               # This file (updated for backend Gemini and setup)
```

This setup provides a more secure and robust foundation for your company intranet. Remember to replace simulated embeddings with a real embedding solution for meaningful Wiki search results in a production system.
