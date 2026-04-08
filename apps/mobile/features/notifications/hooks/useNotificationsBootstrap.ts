import { useEffect, useRef } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "../../auth/AuthProvider";
import { getDeviceLocation } from "../../emergency/services/locationService";
import { getWeatherSummary, type WeatherSummary } from "../../weather/services/weatherApi";
import { showInAppNotification } from "../components/InAppNotificationHost";
import { addMobileNotifications, addMobileNotification, getMobileNotificationsMeta, updateMobileNotificationsMeta } from "../services/mobileNotificationsStore";

type HazardZoneRecord = {
  _id?: string;
  name?: string;
  hazardType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  geometry?: {
    type?: "Polygon" | "MultiPolygon";
    coordinates?: unknown;
  };
};

type AnnouncementRecord = {
  _id?: string;
  title?: string;
  body?: string;
  audience?: "LGU" | "VOLUNTEER" | "PUBLIC" | "ALL";
  publishedAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

const POLL_INTERVAL_MS = 30 * 1000;
const THUNDERSTORM_CODES = new Set([95, 96, 99]);
const HAZARD_NEARBY_RADIUS_METERS = 350;
const HAZARD_RECENT_WINDOW_MS = 2 * 60 * 1000;

function normalizeRole(raw: unknown) {
  return String(raw ?? "").trim().toUpperCase();
}

function weatherAlertSignature(summary: WeatherSummary) {
  return [
    String(summary.severity ?? ""),
    String(summary.weather_code ?? ""),
    String(summary.is_raining ?? ""),
    String(summary.title ?? ""),
    String(summary.message ?? ""),
  ].join("|");
}

function isAlarmingWeather(summary: WeatherSummary) {
  const code = Number(summary.weather_code);
  const hasThunderstormCode = Number.isFinite(code) && THUNDERSTORM_CODES.has(code);
  if (hasThunderstormCode) return true;
  if (summary.severity === "HEAVY" || summary.severity === "MODERATE") return true;
  return Number(summary.is_raining ?? 0) === 1;
}

function toIsoOrNow(input?: string | null) {
  const value = String(input ?? "").trim();
  if (value) {
    const time = new Date(value).getTime();
    if (Number.isFinite(time)) return new Date(time).toISOString();
  }
  return new Date().toISOString();
}

function createdWithinMs(input: unknown, windowMs: number) {
  const value = String(input ?? "").trim();
  if (!value) return false;
  const createdAtMs = new Date(value).getTime();
  if (!Number.isFinite(createdAtMs)) return false;
  const nowMs = Date.now();
  const delta = nowMs - createdAtMs;
  return delta >= -15_000 && delta <= windowMs;
}

function isAudienceVisible(
  audienceRaw: unknown,
  mode: "authed" | "guest" | "anonymous",
  roleRaw: unknown
) {
  const audience = String(audienceRaw ?? "").trim().toUpperCase();
  const role = normalizeRole(roleRaw);

  if (audience === "ALL" || audience === "PUBLIC") return true;
  if (audience === "VOLUNTEER") return mode === "authed" && role === "VOLUNTEER";
  if (audience === "LGU") return mode === "authed" && (role === "LGU" || role === "ADMIN");
  return false;
}

function hazardTypeText(raw?: string) {
  const normalized = String(raw ?? "").trim().toUpperCase();
  if (normalized === "ROAD_CLOSED") return "road-closed";
  if (normalized === "FIRE_RISK") return "fire-risk";
  if (normalized === "LANDSLIDE") return "landslide";
  if (normalized === "UNSAFE") return "unsafe";
  if (normalized === "FLOODED") return "flood";
  return "hazard";
}

function toHazardNotification(zone: HazardZoneRecord) {
  const zoneId = String(zone._id ?? "").trim();
  const zoneName = String(zone.name ?? "your area").trim();
  const zoneType = hazardTypeText(zone.hazardType);
  return {
    id: `hazard:${zoneId}`,
    type: "HAZARD_ZONE_WARNING" as const,
    title: "Hazard-zone warning",
    body: `A new ${zoneType} zone was added near ${zoneName}. Stay alert and avoid the area.`,
    createdAt: toIsoOrNow(zone.createdAt ?? zone.updatedAt ?? null),
    routeName: "/(tabs)/map",
    relatedEntityType: "HAZARD_ZONE" as const,
    relatedEntityId: zoneId,
    metadata: {
      hazardId: zoneId,
      hazardType: String(zone.hazardType ?? ""),
    },
  };
}

function isPointInRing(point: [number, number], ring: Array<[number, number]>) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function normalizeRing(raw: unknown): Array<[number, number]> {
  if (!Array.isArray(raw)) return [];
  const points: Array<[number, number]> = [];

  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const lng = Number(entry[0]);
    const lat = Number(entry[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    points.push([lng, lat]);
  }

  return points;
}

function isPointInPolygon(point: [number, number], polygonRingsRaw: unknown) {
  if (!Array.isArray(polygonRingsRaw) || polygonRingsRaw.length === 0) return false;

  const outerRing = normalizeRing(polygonRingsRaw[0]);
  if (outerRing.length < 3) return false;
  if (!isPointInRing(point, outerRing)) return false;

  for (let i = 1; i < polygonRingsRaw.length; i += 1) {
    const holeRing = normalizeRing(polygonRingsRaw[i]);
    if (holeRing.length >= 3 && isPointInRing(point, holeRing)) {
      return false;
    }
  }

  return true;
}

function isPointInGeometry(point: [number, number], geometry: HazardZoneRecord["geometry"]) {
  const type = String(geometry?.type ?? "").trim();
  const coordinates = geometry?.coordinates;

  if (type === "Polygon") {
    return isPointInPolygon(point, coordinates);
  }

  if (type === "MultiPolygon" && Array.isArray(coordinates)) {
    return coordinates.some((polygon) => isPointInPolygon(point, polygon));
  }

  return false;
}

function toLocalMeters(point: [number, number], originLat: number): [number, number] {
  const [lng, lat] = point;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.max(Math.cos((originLat * Math.PI) / 180), 0.2);
  return [lng * metersPerDegreeLng, lat * metersPerDegreeLat];
}

function distancePointToSegmentMeters(
  point: [number, number],
  segmentStart: [number, number],
  segmentEnd: [number, number]
) {
  const originLat = point[1];
  const [px, py] = toLocalMeters(point, originLat);
  const [ax, ay] = toLocalMeters(segmentStart, originLat);
  const [bx, by] = toLocalMeters(segmentEnd, originLat);
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const denom = abx * abx + aby * aby;
  const t = denom <= 1e-9 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / denom));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return Math.hypot(px - cx, py - cy);
}

function nearestDistanceToRingMeters(point: [number, number], ring: Array<[number, number]>) {
  if (ring.length < 2) return Number.POSITIVE_INFINITY;
  let nearest = Number.POSITIVE_INFINITY;

  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    const distance = distancePointToSegmentMeters(point, current, next);
    if (distance < nearest) nearest = distance;
  }

  return nearest;
}

function isPointNearPolygon(point: [number, number], polygonRingsRaw: unknown, radiusMeters: number) {
  if (!Array.isArray(polygonRingsRaw) || polygonRingsRaw.length === 0) return false;

  for (let i = 0; i < polygonRingsRaw.length; i += 1) {
    const ring = normalizeRing(polygonRingsRaw[i]);
    if (ring.length < 2) continue;
    const nearest = nearestDistanceToRingMeters(point, ring);
    if (nearest <= radiusMeters) return true;
  }

  return false;
}

function isPointInOrNearGeometry(
  point: [number, number],
  geometry: HazardZoneRecord["geometry"],
  radiusMeters: number
) {
  if (isPointInGeometry(point, geometry)) return true;

  const type = String(geometry?.type ?? "").trim();
  const coordinates = geometry?.coordinates;

  if (type === "Polygon") {
    return isPointNearPolygon(point, coordinates, radiusMeters);
  }

  if (type === "MultiPolygon" && Array.isArray(coordinates)) {
    return coordinates.some((polygon) => isPointNearPolygon(point, polygon, radiusMeters));
  }

  return false;
}

export function useNotificationsBootstrap() {
  const { hydrated, mode, user } = useAuth();
  const pollingInFlightRef = useRef(false);

  useEffect(() => {
    if (!hydrated || mode === "anonymous") return;

    let cancelled = false;

    const runPoll = async () => {
      if (cancelled || pollingInFlightRef.current) return;
      pollingInFlightRef.current = true;

      try {
        const currentMeta = await getMobileNotificationsMeta();
        let nextMeta = { ...currentMeta };
        let metaChanged = false;

        const location = await getDeviceLocation().catch(() => null);

        if (location) {
          const weatherSummary = await getWeatherSummary(location.lat, location.lng).catch(() => null);
          if (weatherSummary) {
            if (isAlarmingWeather(weatherSummary)) {
              const signature = weatherAlertSignature(weatherSummary);
              if (signature !== currentMeta.lastWeatherSignature) {
                const code = Number(weatherSummary.weather_code);
                const thunderstorm = Number.isFinite(code) && THUNDERSTORM_CODES.has(code);
                const title = thunderstorm ? "Thunderstorm advisory" : "Weather advisory";
                const body = thunderstorm
                  ? "Thunderstorm conditions are possible. Stay alert and avoid exposed areas."
                  : weatherSummary.message || "Rain or hazardous weather is expected in your area.";
                const dayKey = new Date().toISOString().slice(0, 10);

                await addMobileNotification({
                  id: `weather:${dayKey}:${weatherSummary.severity}:${weatherSummary.weather_code ?? "na"}`,
                  type: "WEATHER_ADVISORY",
                  title,
                  body,
                  routeName: "/(tabs)/map",
                  relatedEntityType: "WEATHER",
                  createdAt: new Date().toISOString(),
                  metadata: {
                    severity: weatherSummary.severity,
                    code: String(weatherSummary.weather_code ?? ""),
                  },
                });

                showInAppNotification({
                  title,
                  body,
                  tone: "warning",
                  target: {
                    pathname: "/notifications",
                  },
                });
              }
              nextMeta.lastWeatherSignature = signature;
              metaChanged = true;
            } else if (currentMeta.lastWeatherSignature) {
              nextMeta.lastWeatherSignature = null;
              metaChanged = true;
            }
          }

          if (mode === "authed") {
            const hazardResponse = await api
              .get<{ data?: HazardZoneRecord[] }>("/api/hazard-zones", { params: { limit: 500 } })
              .catch(() => null);

            if (hazardResponse?.data?.data) {
              const activeZones = hazardResponse.data.data.filter(
                (zone) =>
                  String(zone?._id ?? "").trim() &&
                  zone?.isActive !== false &&
                  (zone?.geometry?.type === "Polygon" || zone?.geometry?.type === "MultiPolygon")
              );

              const activeIds = Array.from(
                new Set(activeZones.map((zone) => String(zone._id ?? "").trim()).filter(Boolean))
              );

              const point: [number, number] = [location.lng, location.lat];

              if (currentMeta.hazardsPrimed) {
                const knownSet = new Set(currentMeta.knownHazardZoneIds);
                const createdNearby = activeZones.filter((zone) => {
                  const zoneId = String(zone._id ?? "").trim();
                  if (!zoneId || knownSet.has(zoneId)) return false;
                  return isPointInOrNearGeometry(point, zone.geometry, HAZARD_NEARBY_RADIUS_METERS);
                });

                if (createdNearby.length > 0) {
                  await addMobileNotifications(createdNearby.map((zone) => toHazardNotification(zone)));

                  showInAppNotification({
                    title: "Hazard-zone warning",
                    body: "A new hazard zone was added near your location. Open Map for details.",
                    tone: "warning",
                    target: {
                      pathname: "/(tabs)/map",
                    },
                  });
                }
              } else {
                const recentNearby = activeZones.filter((zone) => {
                  if (!isPointInOrNearGeometry(point, zone.geometry, HAZARD_NEARBY_RADIUS_METERS)) return false;
                  return createdWithinMs(zone.createdAt ?? zone.updatedAt, HAZARD_RECENT_WINDOW_MS);
                });

                if (recentNearby.length > 0) {
                  await addMobileNotifications(recentNearby.map((zone) => toHazardNotification(zone)));

                  showInAppNotification({
                    title: "Hazard-zone warning",
                    body: "A new hazard zone was added near your location. Open Map for details.",
                    tone: "warning",
                    target: {
                      pathname: "/(tabs)/map",
                    },
                  });
                }
              }

              nextMeta.knownHazardZoneIds = activeIds;
              nextMeta.hazardsPrimed = true;
              metaChanged = true;
            }
          }
        }

        const announcementsResponse = await api
          .get<{ items?: AnnouncementRecord[] }>("/api/announcements/feed")
          .catch(() => null);

        if (announcementsResponse?.data?.items) {
          const visibleAnnouncements = announcementsResponse.data.items
            .filter((item) => isAudienceVisible(item?.audience, mode, user?.role))
            .filter((item) => String(item?._id ?? "").trim());

          const seenSet = new Set(currentMeta.seenAnnouncementIds);
          const unseen = visibleAnnouncements.filter((item) => !seenSet.has(String(item._id ?? "").trim()));

          if (unseen.length > 0) {
            await addMobileNotifications(
              unseen.slice(0, 20).map((item) => ({
                id: `announcement:${String(item._id ?? "").trim()}`,
                type: "LGU_ANNOUNCEMENT",
                title: String(item.title ?? "LGU announcement").trim() || "LGU announcement",
                body: String(item.body ?? "").trim() || "A new LGU announcement is available.",
                createdAt: toIsoOrNow(item.publishedAt ?? item.updatedAt ?? item.createdAt ?? null),
                relatedEntityType: "ANNOUNCEMENT",
                relatedEntityId: String(item._id ?? "").trim(),
                metadata: {
                  audience: String(item.audience ?? ""),
                },
              }))
            );
          }

          nextMeta.seenAnnouncementIds = Array.from(
            new Set([...currentMeta.seenAnnouncementIds, ...visibleAnnouncements.map((item) => String(item._id ?? "").trim())])
          ).slice(-500);
          nextMeta.announcementsPrimed = true;
          metaChanged = true;
        }

        if (metaChanged) {
          await updateMobileNotificationsMeta((prev) => ({
            ...prev,
            knownHazardZoneIds: nextMeta.knownHazardZoneIds,
            seenAnnouncementIds: nextMeta.seenAnnouncementIds,
            lastWeatherSignature: nextMeta.lastWeatherSignature,
            hazardsPrimed: nextMeta.hazardsPrimed,
            announcementsPrimed: nextMeta.announcementsPrimed,
          }));
        }
      } finally {
        pollingInFlightRef.current = false;
      }
    };

    void runPoll();
    const timer = setInterval(() => {
      void runPoll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [hydrated, mode, user?.id, user?.role, user?.volunteerStatus]);

  useEffect(() => {
    if (!hydrated || mode !== "authed") return;

    const userId = String(user?.id ?? "").trim();
    if (!userId) return;

    const currentStatus = normalizeRole(user?.volunteerStatus);
    if (!currentStatus) return;

    let cancelled = false;
    void (async () => {
      const currentMeta = await getMobileNotificationsMeta();
      if (cancelled) return;

      const previousStatus = normalizeRole(currentMeta.volunteerStatusByUserId[userId]);
      if (currentStatus === "APPROVED" && previousStatus && previousStatus !== "APPROVED") {
        await addMobileNotification({
          id: `volunteer-verified:${userId}`,
          type: "VOLUNTEER_ACCOUNT_VERIFIED",
          title: "Account verified as volunteer",
          body: "Your volunteer account has been verified. You can now receive LGU dispatch assignments.",
          createdAt: new Date().toISOString(),
          routeName: "/(tabs)/tasks",
          relatedEntityType: "USER_ACCOUNT",
          relatedEntityId: userId,
        });
      }

      await updateMobileNotificationsMeta((prev) => ({
        ...prev,
        volunteerStatusByUserId: {
          ...prev.volunteerStatusByUserId,
          [userId]: currentStatus,
        },
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, mode, user?.id, user?.volunteerStatus]);
}
