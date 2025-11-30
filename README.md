# KROWD GUIDE v7.1 — Hybrid Navigation UI

> **Know Before You Go. Get Home Safe.**

The future of nightlife navigation, now with a hybrid UI architecture inspired by Apple Maps, Swarm, and Eventbrite.

![Version](https://img.shields.io/badge/version-7.1.0-blue)
![PWA](https://img.shields.io/badge/PWA-ready-green)
![iOS](https://img.shields.io/badge/iOS_26-compatible-purple)

---

## 🆕 What's New in v7.1

### Hybrid Navigation Architecture

| Component | Inspiration | Implementation |
|-----------|-------------|----------------|
| **Floating Search Bar** | Apple Maps | Glass-morphic search with weather widget |
| **Multi-Stage Sheet** | Apple Maps | GSAP Draggable with snap points (collapsed/half/full) |
| **Smart Pins** | Swarm | Context-rich markers with emoji + color-coded crowd levels |
| **Card Details** | Eventbrite | Modal card overlay preserving map context |
| **Intro Animations** | iOS 26 | Particle system with GSAP timeline orchestration |

### Technical Upgrades

- ✅ **GSAP Draggable + Inertia** — Native-feel sheet physics with flick gestures
- ✅ **Marker Clustering** — Performance optimized for 100+ venues
- ✅ **Three-Tier Caching** — Cache-first, network-first, stale-while-revalidate
- ✅ **WCAG 2.2 Accessibility** — ARIA roles, keyboard navigation, focus states
- ✅ **Retry Logic** — Exponential backoff with 3 attempts
- ✅ **CSP Security** — Content Security Policy headers

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Live Map** | Dark mode tiles with custom markers |
| 📊 **Crowd Levels** | Real-time capacity estimation (time + day algorithms) |
| 🔍 **Search** | Filter venues by name or address |
| 📁 **Categories** | Venues, Transport, Safety zones |
| 🏷️ **Filters** | Bars, Food, Clubs, Coffee, Quiet spots |
| 🛡️ **Walk Me Home** | GPS tracking safety feature |
| 🌤️ **Weather** | Current conditions via Open-Meteo |
| 📍 **Location** | Reverse geocoding for city name |
| 🔔 **Toasts** | User-friendly notifications |
| 📴 **Offline** | Safety tips page with emergency contacts |

---

## 🔌 APIs Used (All Free)

| API | Purpose | Limits |
|-----|---------|--------|
| [CartoDB Dark Tiles](https://carto.com/) | Map tiles | Unlimited |
| [Overpass API](https://overpass-api.de/) | Venue data (OSM) | ~10k queries/day |
| [Open-Meteo](https://open-meteo.com/) | Weather data | 10k requests/day |
| [Nominatim](https://nominatim.org/) | Reverse geocoding | 1 req/sec |
| Geolocation API | User position | Browser native |
| Vibration API | Haptic feedback | Browser native |

---

## 📁 File Structure

```
krowd-guide-v7.1/
├── index.html      # Main app (95KB)
├── sw.js           # Service worker (8KB)
├── manifest.json   # PWA manifest (4KB)
├── offline.html    # Offline page (5KB)
├── vercel.json     # Deploy config
└── README.md       # This file
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd krowd-guide-v7.1
vercel --prod
```

### Netlify

```bash
# Drag & drop the folder to netlify.com/drop
# Or use CLI:
netlify deploy --prod --dir=.
```

### GitHub Pages

```bash
# Push to repo, then enable Pages in Settings
git add .
git commit -m "KROWD GUIDE v7.1"
git push origin main
```

---

## 📊 Lighthouse Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Performance | 90+ | Deferred scripts, caching |
| Accessibility | 95+ | ARIA, keyboard nav |
| Best Practices | 95+ | CSP, HTTPS |
| SEO | 90+ | Meta tags, manifest |
| PWA | ✅ | Installable |

---

## 🎨 Design System

### iOS 26 Colors

```css
--system-blue: #0A84FF
--system-green: #30D158
--system-orange: #FF9F0A
--system-red: #FF453A
--system-indigo: #5E5CE6
--system-purple: #BF5AF2
--system-teal: #64D2FF
```

### Spring Physics

```css
--spring-default: cubic-bezier(0.25, 1, 0.5, 1)
--spring-snappy: cubic-bezier(0.2, 0.8, 0.2, 1)
--spring-bouncy: cubic-bezier(0.4, 1.4, 0.6, 1)
--spring-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## 🔧 Configuration

Edit the `CONFIG` object in `index.html`:

```javascript
const CONFIG = {
    DEFAULT_LAT: 39.5296,      // Default latitude
    DEFAULT_LNG: -119.8138,    // Default longitude
    SEARCH_RADIUS: 1500,       // Venue search radius (meters)
    CACHE_DURATION: 30 * 60 * 1000,  // 30 minutes
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};
```

---

## 📱 Installation

### iOS Safari

1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Android Chrome

1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home screen"

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License — See LICENSE file for details.

---

## 🙏 Credits

- **OpenStreetMap** — Venue data
- **CARTO** — Map tiles
- **Open-Meteo** — Weather API
- **GSAP** — Animation library
- **Leaflet** — Mapping library
- **Apple** — Design inspiration

---

**Built with ❤️ for safer nightlife navigation**
