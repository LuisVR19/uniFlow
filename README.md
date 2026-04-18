# UniFlow

A weekly schedule manager built as a mobile-first app with Ionic and Angular. UniFlow lets you organize your week visually — create events, drag them across days and time slots, switch between light and dark mode, and export your schedule as an image or PDF.

---

## Screenshots

### Light Mode

<!-- Add screenshot here -->
![Light Mode]()

### Dark Mode

<!-- Add screenshot here -->
![Dark Mode]()

### Add Event

<!-- Add screenshot here -->
![Add Event]()

### Export

<!-- Add screenshot here -->
![Export]()

---

## Features

- **Weekly grid** — 7-day view from 7:00 to 23:30 in 30-minute slots
- **Drag & drop** — move events across days and time slots with conflict detection
- **Event management** — create events with title, day, start/end time, location, and color
- **Light / Dark mode** — manual toggle persisted in `localStorage`, anti-flash on load
- **Internationalization** — English and Spanish, switchable at runtime, persisted in `localStorage`
- **Export** — download the schedule as a PNG image or a landscape A4 PDF, matching the active theme
- **Responsive** — adapts layout for tablet and desktop widths

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Ionic 8](https://ionicframework.com/) + [Angular 20](https://angular.dev/) |
| Mobile runtime | [Capacitor 8](https://capacitorjs.com/) |
| Drag & drop | [Angular CDK — DragDrop](https://material.angular.io/cdk/drag-drop/overview) |
| Internationalization | [@ngx-translate/core 17](https://github.com/ngx-translate/core) |
| Image export | [html2canvas 1](https://html2canvas.hertzen.com/) |
| PDF export | [jsPDF 4](https://github.com/parallax/jsPDF) |
| Styling | SCSS + Ionic CSS custom properties (design token system) |
| Icons | [Ionicons 7](https://ionic.io/ionicons) |
| Language | TypeScript 5.9 |

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── schedule-grid/     # Weekly grid with drag-and-drop slots
│   │   └── event-card/        # Individual event card rendered inside a slot
│   ├── models/
│   │   └── event.model.ts     # Interfaces, WEEK_DAYS, SCHEDULE_CONFIG
│   ├── pages/
│   │   ├── home/              # Dashboard with today's events and quick actions
│   │   ├── schedule/          # Full weekly grid + export controls
│   │   └── add-event/         # Form to create a new event
│   └── services/
│       ├── schedule.service.ts  # Event CRUD, conflict detection, move logic
│       ├── storage.service.ts   # localStorage persistence for events
│       ├── theme.service.ts     # Light/dark mode toggle
│       ├── language.service.ts  # i18n language switching
│       └── export.service.ts    # PNG and PDF export via html2canvas + jsPDF
├── assets/
│   └── i18n/
│       ├── en.json            # English strings
│       └── es.json            # Spanish strings
└── theme/
    └── variables.scss         # Design tokens (colors, shadows, radii, transitions)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Ionic CLI: `npm install -g @ionic/cli`

### Install dependencies

```bash
npm install
```

### Run in browser

```bash
ionic serve
```

### Build para web (GitHub Pages)

```bash
npm run deploy
```

Genera el build en `docs/` con `base href="/uniFlow/"`.

### Build para Android (móvil)

```bash
npm run build:mobile
npx cap open android
```

`build:mobile` compila con `base href="/"` y sincroniza los assets en el proyecto Android.  
Desde Android Studio: selecciona el dispositivo y presiona **Run**.

> Cada vez que cambies código, repite `npm run build:mobile` antes de correr desde Android Studio.
