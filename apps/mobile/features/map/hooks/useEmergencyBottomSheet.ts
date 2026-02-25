import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { Emergency, RiskAssessment, RouteSummary, TravelMode } from "../models/map.types";
import {
  getRouteAlternatives,
  getRouteAlternativesWithEvaluation,
  optimizeRoute,
  type DirectionPoint,
  type RoutingContextWeather,
} from "../services/routingApi";

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
  getWeatherContext?: () => RoutingContextWeather | null;
};

export type EmergencyBottomSheetController = {
  selectedEmergency: Emergency | null;
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

export function useEmergencyBottomSheet(
  options: UseEmergencyBottomSheetOptions
): EmergencyBottomSheetController {
  const { resolveOrigin, getWeatherContext } = options;

  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [sheetMode, setSheetMode] = useState<"overview" | "directions">("overview");
  const [isMinimized, setIsMinimized] = useState(false);
  const [travelMode, setTravelModeState] = useState<TravelMode>("drive");
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [routeAlternatives, setRouteAlternatives] = useState<RouteSummary[]>([]);
  const [routeRiskByIndex, setRouteRiskByIndex] = useState<Record<number, RiskAssessment>>({});
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

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
        const evaluated = await getRouteAlternativesWithEvaluation({
          from: origin,
          to: {
            lat: selectedEmergency.location.lat,
            lng: selectedEmergency.location.lng,
          },
          mode,
          contextWeather: getWeatherContext?.() ?? undefined,
        });
        const primaryRoute = evaluated.routes[0] ?? null;
        const primaryRisk = evaluated.riskByIndex[0] ?? null;
        setRouteAlternatives(primaryRoute ? [primaryRoute] : []);
        setRouteRiskByIndex(primaryRisk ? { 0: primaryRisk } : {});
        setSelectedRouteIndex(0);
        setRoute(primaryRoute);
        setRisk(primaryRisk);
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
          const primaryRoute = nextRoutes[0] ?? null;
          setRouteAlternatives(primaryRoute ? [primaryRoute] : []);
          setRouteRiskByIndex({});
          setSelectedRouteIndex(0);
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

    setLoadingRoute(true);
    try {
      const optimized = await optimizeRoute({
        from: origin,
        to: {
          lat: selectedEmergency.location.lat,
          lng: selectedEmergency.location.lng,
        },
        mode: travelMode,
        contextWeather: getWeatherContext?.() ?? undefined,
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
                      contextWeather: getWeatherContext?.() ?? undefined,
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
          contextWeather: getWeatherContext?.() ?? undefined,
        });
        setRouteAlternatives(fallbackEvaluated.routes);
        setRouteRiskByIndex(fallbackEvaluated.riskByIndex);
        setSelectedRouteIndex(0);
        setRoute(fallbackEvaluated.routes[0] ?? null);
        setRisk(fallbackEvaluated.riskByIndex[0] ?? null);
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
          setRouteAlternatives(fallbackRoutes);
          setRouteRiskByIndex({});
          setSelectedRouteIndex(0);
          setRoute(fallbackRoutes[0] ?? null);
          setRisk(null);
        } catch {
          Alert.alert("Directions unavailable", "Unable to fetch route. Try again.");
        }
      }
    } finally {
      setLoadingRoute(false);
    }
  }, [getWeatherContext, resolveOrigin, selectedEmergency, travelMode]);

  return {
    selectedEmergency,
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
    fetchRoute: fetchRouteAction,
    optimizeRoute: optimizeRouteAction,
  };
}
