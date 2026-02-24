<div align="center">
  <img src="banner_finscope.png" alt="FinScope" width="100%" />
</div>

<p align="right">
  <a href="https://buymeacoffee.com/sgnetz">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee" />
  </a>
</p>

# FinScope

A monitoring and analytics dashboard for Jellyfin. Keep an eye on active streams, user activity, library stats, and server health -- all in one place, with a glass-morphism UI inspired by Apple's Spatial Design.

## Features

- **Live Stream Radar** -- Real-time view of active sessions with playback progress, codec details, and transcoding status
- **User Overview** -- Online status, play history, and per-user activity tracking
- **Library Analytics** -- Media counts, genre distribution, storage breakdown, top played content, and recently added items
- **Watch Analytics** -- Heatmaps, prime-time analysis, and client ecosystem breakdown
- **System Pulse** -- Server info, network traffic, hardware acceleration, and database status
- **Bilingual** -- Full English and German interface

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| i18n | i18next (EN / DE) |
| Proxy | Node.js |
| Deployment | Docker (multi-stage build) |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- A running Jellyfin server
- A Jellyfin API key

### Setup

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/finscope.git
cd finscope
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Start with Docker:

```bash
cd docker
docker compose up -d
```

4. Open `http://localhost:8080` and enter your Jellyfin server URL and API key.

### Local Development

```bash
npm install
npm run dev
```

## Architecture

FinScope uses a Node.js proxy between the frontend and your Jellyfin server. This handles CORS and keeps your API key server-side -- no credentials are ever exposed to the browser.

```
Browser  →  Nginx (static frontend)  →  Node.js Proxy  →  Jellyfin Server
```

## Feature Requests

Have an idea or wish? Submit it here:
**[finscope.featurebase.app](https://finscope.featurebase.app/)**

## Bugs & Issues

Found a bug? Please open an issue on [GitHub Issues](../../issues).

## License

MIT
