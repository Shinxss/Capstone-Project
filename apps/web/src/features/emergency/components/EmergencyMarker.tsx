import { useEffect } from "react";
import { colorForEmergency, iconForEmergency, type EmergencyType } from "../constants/emergency.constants";

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ensureMarkerStylesOnce() {
  const id = "ll-dashboard-marker-styles";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @keyframes llPulse {
      0%   { transform: translate(-50%, -50%) scale(0.45); opacity: 0.75; }
      70%  { opacity: 0.18; }
      100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0; }
    }
    @keyframes llInnerWave {
      0%   { transform: scale(0.92); opacity: 0.65; }
      50%  { transform: scale(1.05); opacity: 0.35; }
      100% { transform: scale(0.92); opacity: 0.65; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Marker UI: pulse zone + small icon.
 * Notes:
 * - Mapbox marker uses `anchor: "center"` in the map component.
 */
export default function EmergencyMarker({ type }: { type: EmergencyType }) {
  useEffect(() => {
    ensureMarkerStylesOnce();
  }, []);

  const Icon = iconForEmergency(type);
  const color = colorForEmergency(type);

  const PULSE_SIZE = 68;
  const CENTER_SIZE = 32;
  const ICON_SIZE = 14;

  return (
    <div className="relative" style={{ width: PULSE_SIZE, height: PULSE_SIZE }} aria-hidden>
      {/* pulse rings */}
      <span
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: PULSE_SIZE,
          height: PULSE_SIZE,
          transform: "translate(-50%, -50%)",
          background: hexToRgba(color, 0.18),
          border: `2px solid ${hexToRgba(color, 0.35)}`,
          animation: "llPulse 1.7s ease-out infinite",
        }}
      />
      <span
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: PULSE_SIZE,
          height: PULSE_SIZE,
          transform: "translate(-50%, -50%)",
          background: hexToRgba(color, 0.1),
          border: `2px solid ${hexToRgba(color, 0.22)}`,
          animation: "llPulse 1.7s ease-out infinite",
          animationDelay: "0.85s",
        }}
      />

      {/* center pin */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full shadow-xl"
        style={{
          width: CENTER_SIZE,
          height: CENTER_SIZE,
          transform: "translate(-50%, -50%)",
          border: `3px solid ${hexToRgba(color, 0.95)}`,
          background: "rgba(255,255,255,0.98)",
          zIndex: 10,
        }}
      >
        <div
          className="absolute inset-1.5 rounded-full"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(color, 0.25)} 0%, rgba(255,255,255,0) 65%)`,
            animation: "llInnerWave 1.4s ease-in-out infinite",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
          <Icon size={ICON_SIZE} style={{ color }} />
        </div>
      </div>
    </div>
  );
}
