import React from "react";
import ReactDOM from "react-dom/client";
import mapboxgl from "mapbox-gl";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "sweetalert2/dist/sweetalert2.min.css";
import { initTheme } from "./features/theme/services/themeService";
import { fetchCsrfToken } from "./lib/api";

const MOVE_TO_SESSION_KEYS = [
  "lifeline_lgu_token",
  "lifeline_lgu_user",
  "lifeline_lgu_announcements_v1",
] as const;

const REMOVE_BROWSER_STORAGE_KEYS = ["lifeline_lgu_activity_log_v1"] as const;

function hardenBrowserStorage() {
  try {
    (mapboxgl as { setTelemetryEnabled?: (enabled: boolean) => void }).setTelemetryEnabled?.(false);
  } catch {
    // ignore if unavailable
  }

  try {
    const localStore = window.localStorage;
    const sessionStore = window.sessionStorage;
    const toDelete: string[] = [];

    for (const key of MOVE_TO_SESSION_KEYS) {
      const existing = localStore.getItem(key);
      if (existing === null) continue;

      if (!sessionStore.getItem(key)) {
        sessionStore.setItem(key, existing);
      }
      localStore.removeItem(key);
    }

    for (const key of REMOVE_BROWSER_STORAGE_KEYS) {
      localStore.removeItem(key);
      sessionStore.removeItem(key);
    }

    for (let i = 0; i < localStore.length; i += 1) {
      const key = localStore.key(i);
      if (key && key.startsWith("mapbox.eventData")) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      localStore.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}

initTheme();
hardenBrowserStorage();

// Fetch CSRF token on app load (non-blocking)
fetchCsrfToken();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
