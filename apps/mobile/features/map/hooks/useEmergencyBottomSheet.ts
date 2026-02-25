import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { Emergency, RiskAssessment, RouteSummary, TravelMode } from "../models/map.types";
import {
  getRouteAlternatives,
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
  travelMode: TravelMode;
  route: RouteSummary | null;
  routeAlternatives: RouteSummary[];
  selectedRouteIndex: number;
  risk: RiskAssessment | null;
  loadingRoute: boolean;
  openEmergency: (emergency: Emergency) => void;
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
  const [travelMode, setTravelModeState] = useState<TravelMode>("drive");
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [routeAlternatives, setRouteAlternatives] = useState<RouteSummary[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const closeSheet = useCallback(() => {
    setSelectedEmergency(null);
    setSheetMode("overview");
    setTravelModeState("drive");
    setRoute(null);
    setRouteAlternatives([]);
    setSelectedRouteIndex(0);
    setRisk(null);
    setLoadingRoute(false);
  }, []);

  const goToOverview = useCallback(() => {
    setSheetMode("overview");
    setRoute(null);
    setRouteAlternatives([]);
    setSelectedRouteIndex(0);
    setRisk(null);
  }, []);

  const openEmergency = useCallback((emergency: Emergency) => {
    setSelectedEmergency(emergency);
    setSheetMode("overview");
    setTravelModeState("drive");
    setRoute(null);
    setRouteAlternatives([]);
    setSelectedRouteIndex(0);
    setRisk(null);
  }, []);

  const fetchRouteByMode = useCallback(
    async (mode: TravelMode) => {
      if (!selectedEmergency) return;

      const origin = await resolveOrigin();
      if (!origin) return;

      setLoadingRoute(true);
      try {
        const nextRoutes = await getRouteAlternatives({
          from: origin,
          to: {
            lat: selectedEmergency.location.lat,
            lng: selectedEmergency.location.lng,
          },
          mode,
        });
        setRouteAlternatives(nextRoutes);
        setSelectedRouteIndex(0);
        setRoute(nextRoutes[0] ?? null);
        setRisk(null);
      } catch {
        Alert.alert("Directions unavailable", "Unable to fetch route. Try again.");
      } finally {
        setLoadingRoute(false);
      }
    },
    [resolveOrigin, selectedEmergency]
  );

  const fetchRouteAction = useCallback(async () => {
    await fetchRouteByMode(travelMode);
  }, [fetchRouteByMode, travelMode]);

  const goToDirections = useCallback(async () => {
    if (!selectedEmergency) return;
    setSheetMode("directions");
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
    setRisk(null);
  }, [routeAlternatives]);

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

      setRoute(optimized.route);
      setRouteAlternatives([optimized.route]);
      setSelectedRouteIndex(0);
      setRisk(optimized.risk);
    } catch (error) {
      const parsed = parseApiError(error);
      const prefix = parsed.status ? `AI route failed (${parsed.status})` : "AI route failed";
      Alert.alert(prefix, `${parsed.message}\n\nUsing standard route fallback.`);

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
        setSelectedRouteIndex(0);
        setRoute(fallbackRoutes[0] ?? null);
        setRisk(null);
      } catch {
        Alert.alert("Directions unavailable", "Unable to fetch route. Try again.");
      }
    } finally {
      setLoadingRoute(false);
    }
  }, [getWeatherContext, resolveOrigin, selectedEmergency, travelMode]);

  return {
    selectedEmergency,
    sheetMode,
    travelMode,
    route,
    routeAlternatives,
    selectedRouteIndex,
    risk,
    loadingRoute,
    openEmergency,
    closeSheet,
    goToOverview,
    goToDirections,
    setTravelMode,
    selectRoute,
    fetchRoute: fetchRouteAction,
    optimizeRoute: optimizeRouteAction,
  };
}
