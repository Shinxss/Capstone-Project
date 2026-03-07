import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import type { Emergency, RiskAssessment, RouteSummary, TravelMode } from "../models/map.types";
import {
  getRouteAlternatives,
  getRouteAlternativesWithEvaluation,
  optimizeRoute,
  type DirectionPoint,
  type RoutingContextWeather,
} from "../services/routingApi";
import type { EmergencyReportDetail } from "../../emergency/models/emergency.types";
import { fetchEmergencyReportDetail } from "../../emergency/services/emergencyApi";

type ApiErrorShape = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
};

type UseEmergencyBottomSheetOptions = {
  resolveOrigin: () => Promise<DirectionPoint | null>;
  resolveEtaOrigin?: () => Promise<DirectionPoint | null>;
  getWeatherContext?: () => RoutingContextWeather | null;
};

type EtaSummary = {
  durationMin: number;
  distanceKm: number;
};

export type EmergencyBottomSheetController = {
  selectedEmergency: Emergency | null;
  emergencyDetail: EmergencyReportDetail | null;
  loadingDetail: boolean;
  detailError: string | null;
  etaSummary: EtaSummary | null;
  loadingEta: boolean;
  sheetMode: "overview" | "directions";
  isMinimized: boolean;
  travelMode: TravelMode;
  route: RouteSummary | null;
  routeAlternatives: RouteSummary[];
  selectedRouteIndex: number;
  risk: RiskAssessment | null;
  loadingRoute: boolean;
  openEmergency: (emergency: Emergency) => void;
  minimizeSheet: () => void;
  expandSheet: () => void;
  closeSheet: () => void;
  goToOverview: () => void;
  goToDirections: () => Promise<void>;
  setTravelMode: (mode: TravelMode) => void;
  selectRoute: (index: number) => void;
  refreshSelectedEmergency: () => Promise<void>;
  fetchRoute: () => Promise<void>;
  optimizeRoute: () => Promise<void>;
};

function parseApiError(error: unknown): { status?: number; message: string } {
  const err = error as ApiErrorShape | undefined;
  const status = err?.response?.status;
  const apiMessage = err?.response?.data?.message ?? err?.response?.data?.error;
  const message = String(apiMessage ?? err?.message ?? "Unknown error");
  return { status, message };
}

function toFiniteNumber(value: unknown, fallback = Number.POSITIVE_INFINITY) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRainingWeather(context?: RoutingContextWeather | null) {
  const rainfall = Number(context?.rainfall_mm ?? 0);
  const rainingFlag = Number(context?.is_raining ?? 0);
  return rainfall > 0 || rainingFlag === 1;
}

function pickNearestRouteIndex(routes: RouteSummary[]) {
  if (!routes.length) return 0;
  let bestIndex = 0;
  let bestDistance = toFiniteNumber(routes[0]?.distanceKm);
  let bestDuration = toFiniteNumber(routes[0]?.durationMin);

  for (let index = 1; index < routes.length; index += 1) {
    const candidate = routes[index];
    if (!candidate) continue;
    const distance = toFiniteNumber(candidate.distanceKm);
    const duration = toFiniteNumber(candidate.durationMin);

    if (distance < bestDistance || (distance === bestDistance && duration < bestDuration)) {
      bestIndex = index;
      bestDistance = distance;
      bestDuration = duration;
    }
  }

  return bestIndex;
}

function pickPreferredRouteIndex(input: {
  routes: RouteSummary[];
  riskByIndex: Record<number, RiskAssessment>;
  isRaining: boolean;
}) {
  if (!input.routes.length) return 0;

  if (!input.isRaining) {
    return pickNearestRouteIndex(input.routes);
  }

  let bestIndex = 0;
  let bestRoutingCost = toFiniteNumber(input.riskByIndex[0]?.routingCost);
  let bestDuration = toFiniteNumber(input.routes[0]?.durationMin);
  let bestDistance = toFiniteNumber(input.routes[0]?.distanceKm);

  for (let index = 1; index < input.routes.length; index += 1) {
    const route = input.routes[index];
    if (!route) continue;

    const routingCost = toFiniteNumber(input.riskByIndex[index]?.routingCost);
    const duration = toFiniteNumber(route.durationMin);
    const distance = toFiniteNumber(route.distanceKm);
    const isBetter =
      routingCost < bestRoutingCost ||
      (routingCost === bestRoutingCost && duration < bestDuration) ||
      (routingCost === bestRoutingCost && duration === bestDuration && distance < bestDistance);

    if (isBetter) {
      bestIndex = index;
      bestRoutingCost = routingCost;
      bestDuration = duration;
      bestDistance = distance;
    }
  }

  return bestIndex;
}

export function useEmergencyBottomSheet(
  options: UseEmergencyBottomSheetOptions
): EmergencyBottomSheetController {
  const { resolveOrigin, resolveEtaOrigin, getWeatherContext } = options;

  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [emergencyDetail, setEmergencyDetail] = useState<EmergencyReportDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [etaSummary, setEtaSummary] = useState<EtaSummary | null>(null);
  const [loadingEta, setLoadingEta] = useState(false);
  const [sheetMode, setSheetMode] = useState<"overview" | "directions">("overview");
  const [isMinimized, setIsMinimized] = useState(false);
  const [travelMode, setTravelModeState] = useState<TravelMode>("drive");
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [routeAlternatives, setRouteAlternatives] = useState<RouteSummary[]>([]);
  const [routeRiskByIndex, setRouteRiskByIndex] = useState<Record<number, RiskAssessment>>({});
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [overviewReloadKey, setOverviewReloadKey] = useState(0);

  const closeSheet = useCallback(() => {
    setSelectedEmergency(null);
    setSheetMode("overview");
    setIsMinimized(false);
    setTravelModeState("drive");
    setRoute(null);
    setRouteAlternatives([]);
    setRouteRiskByIndex({});
    setSelectedRouteIndex(0);
    setRisk(null);
    setEmergencyDetail(null);
    setLoadingDetail(false);
    setDetailError(null);
    setEtaSummary(null);
    setLoadingEta(false);
    setOverviewReloadKey(0);
    setLoadingRoute(false);
  }, []);

  const goToOverview = useCallback(() => {
    setSheetMode("overview");
    setIsMinimized(false);
    setRoute(null);
    setRouteAlternatives([]);
    setRouteRiskByIndex({});
    setSelectedRouteIndex(0);
    setRisk(null);
    setEmergencyDetail(null);
    setLoadingDetail(false);
    setDetailError(null);
    setEtaSummary(null);
    setLoadingEta(false);
    setOverviewReloadKey((current) => current + 1);
  }, []);

  const openEmergency = useCallback((emergency: Emergency) => {
    setSelectedEmergency(emergency);
    setSheetMode("overview");
    setIsMinimized(false);
    setTravelModeState("drive");
    setRoute(null);
    setRouteAlternatives([]);
    setRouteRiskByIndex({});
    setSelectedRouteIndex(0);
    setRisk(null);
    setEmergencyDetail(null);
    setLoadingDetail(false);
    setDetailError(null);
    setEtaSummary(null);
    setLoadingEta(false);
  }, []);

  const minimizeSheet = useCallback(() => {
    setIsMinimized((current) => (current ? current : true));
  }, []);

  const expandSheet = useCallback(() => {
    setIsMinimized((current) => (current ? false : current));
  }, []);

  const fetchRouteByMode = useCallback(
    async (mode: TravelMode) => {
      if (!selectedEmergency) return;

      const origin = await resolveOrigin();
      if (!origin) return;

      setLoadingRoute(true);
      try {
        const contextWeather = getWeatherContext?.() ?? undefined;
        const raining = isRainingWeather(contextWeather);
        const evaluated = await getRouteAlternativesWithEvaluation({
          from: origin,
          to: {
            lat: selectedEmergency.location.lat,
            lng: selectedEmergency.location.lng,
          },
          mode,
          contextWeather,
        });
        const selectedIndex = pickPreferredRouteIndex({
          routes: evaluated.routes,
          riskByIndex: evaluated.riskByIndex,
          isRaining: raining,
        });
        const primaryRoute = evaluated.routes[selectedIndex] ?? evaluated.routes[0] ?? null;
        setRouteAlternatives(evaluated.routes);
        setRouteRiskByIndex(evaluated.riskByIndex);
        setSelectedRouteIndex(selectedIndex);
        setRoute(primaryRoute);
        setRisk(evaluated.riskByIndex[selectedIndex] ?? null);
      } catch {
        try {
          const nextRoutes = await getRouteAlternatives({
            from: origin,
            to: {
              lat: selectedEmergency.location.lat,
              lng: selectedEmergency.location.lng,
            },
            mode,
          });
          const selectedIndex = pickNearestRouteIndex(nextRoutes);
          const primaryRoute = nextRoutes[selectedIndex] ?? nextRoutes[0] ?? null;
          setRouteAlternatives(nextRoutes);
          setRouteRiskByIndex({});
          setSelectedRouteIndex(selectedIndex);
          setRoute(primaryRoute);
          setRisk(null);
        } catch {
          Alert.alert("Directions unavailable", "Unable to fetch route. Try again.");
        }
      } finally {
        setLoadingRoute(false);
      }
    },
    [getWeatherContext, resolveOrigin, selectedEmergency]
  );

  useEffect(() => {
    if (!selectedEmergency) return;
    let cancelled = false;

    const activeEmergency = selectedEmergency;
    setEmergencyDetail(null);
    setDetailError(null);
    setLoadingDetail(true);
    setEtaSummary(null);
    setLoadingEta(true);

    void (async () => {
      try {
        const detail = await fetchEmergencyReportDetail(activeEmergency.id);
        if (cancelled) return;

        setEmergencyDetail(detail);
        setSelectedEmergency((current) => {
          if (!current || current.id !== activeEmergency.id) return current;
          return {
            ...current,
            referenceNumber:
              current.referenceNumber || String(detail.referenceNumber ?? "").trim() || current.referenceNumber,
            reportedAt:
              current.reportedAt ||
              String(detail.reportedAt ?? detail.createdAt ?? "").trim() ||
              current.reportedAt,
            status: current.status || String(detail.status ?? "").trim() || current.status,
            location: {
              ...current.location,
              label:
                current.location.label ||
                String(detail.location?.label ?? "").trim() ||
                current.location.label,
            },
          };
        });
      } catch (error) {
        if (cancelled) return;
        const parsed = parseApiError(error);
        setDetailError(parsed.message);
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    })();

    void (async () => {
      try {
        const originResolver = resolveEtaOrigin ?? resolveOrigin;
        const origin = await originResolver();
        if (cancelled) return;

        if (!origin) {
          setEtaSummary(null);
          return;
        }

        try {
          const contextWeather = getWeatherContext?.() ?? undefined;
          const raining = isRainingWeather(contextWeather);
          const evaluated = await getRouteAlternativesWithEvaluation({
            from: origin,
            to: {
              lat: activeEmergency.location.lat,
              lng: activeEmergency.location.lng,
            },
            mode: "drive",
            contextWeather,
          });
          if (cancelled) return;
          const selectedIndex = pickPreferredRouteIndex({
            routes: evaluated.routes,
            riskByIndex: evaluated.riskByIndex,
            isRaining: raining,
          });
          const top = evaluated.routes[selectedIndex] ?? evaluated.routes[0] ?? null;
          setEtaSummary(
            top
              ? {
                  durationMin: top.durationMin,
                  distanceKm: top.distanceKm,
                }
              : null
          );
        } catch {
          const fallbackRoutes = await getRouteAlternatives({
            from: origin,
            to: {
              lat: activeEmergency.location.lat,
              lng: activeEmergency.location.lng,
            },
            mode: "drive",
          });
          if (cancelled) return;
          const selectedIndex = pickNearestRouteIndex(fallbackRoutes);
          const top = fallbackRoutes[selectedIndex] ?? fallbackRoutes[0] ?? null;
          setEtaSummary(
            top
              ? {
                  durationMin: top.durationMin,
                  distanceKm: top.distanceKm,
                }
              : null
          );
        }
      } catch {
        if (!cancelled) {
          setEtaSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingEta(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [overviewReloadKey, selectedEmergency?.id]);

  const fetchRouteAction = useCallback(async () => {
    await fetchRouteByMode(travelMode);
  }, [fetchRouteByMode, travelMode]);

  const goToDirections = useCallback(async () => {
    if (!selectedEmergency) return;
    setSheetMode("directions");
    setIsMinimized(false);
    if (!route) {
      await fetchRouteByMode(travelMode);
    }
  }, [fetchRouteByMode, route, selectedEmergency, travelMode]);

  const setTravelMode = useCallback(
    (mode: TravelMode) => {
      setTravelModeState(mode);
      if (sheetMode === "directions" && selectedEmergency) {
        void fetchRouteByMode(mode);
      }
    },
    [fetchRouteByMode, selectedEmergency, sheetMode]
  );

  const selectRoute = useCallback((index: number) => {
    setSelectedRouteIndex((currentIndex) => {
      if (currentIndex === index) return currentIndex;
      return index;
    });
    setRoute((currentRoute) => {
      const nextRoute = routeAlternatives[index];
      if (!nextRoute) return currentRoute;
      return nextRoute;
    });
    setRisk(routeRiskByIndex[index] ?? null);
  }, [routeAlternatives, routeRiskByIndex]);

  const optimizeRouteAction = useCallback(async () => {
    if (!selectedEmergency) return;

    const origin = await resolveOrigin();
    if (!origin) return;

    const contextWeather = getWeatherContext?.() ?? undefined;
    const raining = isRainingWeather(contextWeather);
    if (!raining) {
      await fetchRouteByMode(travelMode);
      return;
    }

    setLoadingRoute(true);
    try {
      const optimized = await optimizeRoute({
        from: origin,
        to: {
          lat: selectedEmergency.location.lat,
          lng: selectedEmergency.location.lng,
        },
        mode: travelMode,
        contextWeather,
      });

      const applyOptimizedResult = (result: typeof optimized) => {
        setRoute(result.route);
        setRouteAlternatives([result.route]);
        setRouteRiskByIndex({ 0: result.risk });
        setSelectedRouteIndex(0);
        setRisk(result.risk);
      };

      applyOptimizedResult(optimized);
    } catch (error) {
      const parsed = parseApiError(error);
      const prefix = parsed.status ? `AI route failed (${parsed.status})` : "AI route failed";
      if (parsed.status === 409) {
        Alert.alert(
          "No passable route",
          `${parsed.message}\n\nRecommend the safest nearby route even if currently not passable?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Recommend anyway",
              onPress: () => {
                void (async () => {
                  setLoadingRoute(true);
                  try {
                    const fallbackOptimized = await optimizeRoute({
                      from: origin,
                      to: {
                        lat: selectedEmergency.location.lat,
                        lng: selectedEmergency.location.lng,
                      },
                      mode: travelMode,
                      allowNonPassableFallback: true,
                      contextWeather,
                    });

                    setRoute(fallbackOptimized.route);
                    setRouteAlternatives([fallbackOptimized.route]);
                    setRouteRiskByIndex({ 0: fallbackOptimized.risk });
                    setSelectedRouteIndex(0);
                    setRisk(fallbackOptimized.risk);
                  } catch (fallbackError) {
                    const fallbackParsed = parseApiError(fallbackError);
                    const fallbackPrefix = fallbackParsed.status
                      ? `AI route failed (${fallbackParsed.status})`
                      : "AI route failed";
                    Alert.alert(fallbackPrefix, fallbackParsed.message);
                  } finally {
                    setLoadingRoute(false);
                  }
                })();
              },
            },
          ]
        );
        return;
      }

      Alert.alert(prefix, `${parsed.message}\n\nUsing standard route fallback.`);

      try {
        const fallbackEvaluated = await getRouteAlternativesWithEvaluation({
          from: origin,
          to: {
            lat: selectedEmergency.location.lat,
            lng: selectedEmergency.location.lng,
          },
          mode: travelMode,
          contextWeather,
        });
        const selectedIndex = pickPreferredRouteIndex({
          routes: fallbackEvaluated.routes,
          riskByIndex: fallbackEvaluated.riskByIndex,
          isRaining: true,
        });
        setRouteAlternatives(fallbackEvaluated.routes);
        setRouteRiskByIndex(fallbackEvaluated.riskByIndex);
        setSelectedRouteIndex(selectedIndex);
        setRoute(fallbackEvaluated.routes[selectedIndex] ?? fallbackEvaluated.routes[0] ?? null);
        setRisk(fallbackEvaluated.riskByIndex[selectedIndex] ?? null);
      } catch {
        try {
          const fallbackRoutes = await getRouteAlternatives({
            from: origin,
            to: {
              lat: selectedEmergency.location.lat,
              lng: selectedEmergency.location.lng,
            },
            mode: travelMode,
          });
          const selectedIndex = pickNearestRouteIndex(fallbackRoutes);
          setRouteAlternatives(fallbackRoutes);
          setRouteRiskByIndex({});
          setSelectedRouteIndex(selectedIndex);
          setRoute(fallbackRoutes[selectedIndex] ?? fallbackRoutes[0] ?? null);
          setRisk(null);
        } catch {
          Alert.alert("Directions unavailable", "Unable to fetch route. Try again.");
        }
      }
    } finally {
      setLoadingRoute(false);
    }
  }, [fetchRouteByMode, getWeatherContext, resolveOrigin, selectedEmergency, travelMode]);
  const refreshSelectedEmergency = useCallback(async () => {
    if (!selectedEmergency) return;

    setOverviewReloadKey((current) => current + 1);
    if (sheetMode === "directions") {
      await fetchRouteByMode(travelMode);
    }
  }, [fetchRouteByMode, selectedEmergency, sheetMode, travelMode]);

  return {
    selectedEmergency,
    emergencyDetail,
    loadingDetail,
    detailError,
    etaSummary,
    loadingEta,
    sheetMode,
    isMinimized,
    travelMode,
    route,
    routeAlternatives,
    selectedRouteIndex,
    risk,
    loadingRoute,
    openEmergency,
    minimizeSheet,
    expandSheet,
    closeSheet,
    goToOverview,
    goToDirections,
    setTravelMode,
    selectRoute,
    refreshSelectedEmergency,
    fetchRoute: fetchRouteAction,
    optimizeRoute: optimizeRouteAction,
  };
}
