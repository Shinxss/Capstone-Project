import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  Emergency,
  RiskAssessment,
  RouteSummary,
  TravelMode,
} from "../models/map.types";

type EmergencyDirectionsSheetProps = {
  emergency: Emergency;
  travelMode: TravelMode;
  route: RouteSummary | null;
  routeAlternatives: RouteSummary[];
  selectedRouteIndex: number;
  risk: RiskAssessment | null;
  loadingRoute: boolean;
  onTravelModeChange: (mode: TravelMode) => void;
  onSelectRoute: (index: number) => void;
  onOptimizeRoute: () => void;
  onBack: () => void;
  onClose: () => void;
};

function riskColor(level: RiskAssessment["riskLevel"]): string {
  if (level === "LOW") return "#16A34A";
  if (level === "MEDIUM") return "#CA8A04";
  return "#DC2626";
}

function riskLabel(level: RiskAssessment["riskLevel"]): string {
  if (level === "LOW") return "Low";
  if (level === "MEDIUM") return "Medium";
  return "High";
}

function passableColor(value: boolean | null | undefined): string {
  if (value === true) return "#16A34A";
  if (value === false) return "#DC2626";
  return "#475569";
}

function passableText(value: boolean | null | undefined): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "n/a";
}

export function EmergencyDirectionsSheet({
  emergency,
  travelMode,
  route,
  routeAlternatives,
  selectedRouteIndex,
  risk,
  loadingRoute,
  onTravelModeChange,
  onSelectRoute,
  onOptimizeRoute,
  onBack,
  onClose,
}: EmergencyDirectionsSheetProps) {
  const comparedAgainst = risk?.comparedAgainst ?? 0;
  const rank = risk?.rank;
  const routeLabel = comparedAgainst === 1 ? "route" : "routes";
  const rankScoreText =
    comparedAgainst >= 2 && risk ? risk.finalScore.toFixed(3) : "\u2014";
  const comparisonText =
    typeof rank === "number" && rank > 0 && comparedAgainst >= 2
      ? `Compared against ${comparedAgainst} ${routeLabel} | Rank ${rank}/${comparedAgainst}`
      : `Compared against ${comparedAgainst} ${routeLabel}`;

  return (
    <View className="px-4 pt-3 pb-4">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          <Feather name="chevron-left" size={18} color="#0F172A" />
        </Pressable>
        <Text className="text-[17px] font-bold text-slate-900">Directions</Text>
        <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          <Feather name="x" size={16} color="#0F172A" />
        </Pressable>
      </View>

      <Text className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {emergency.title}
      </Text>

      <View className="mt-3 flex-row rounded-xl bg-slate-100 p-1">
        <Pressable
          onPress={() => onTravelModeChange("drive")}
          className={`h-9 flex-1 flex-row items-center justify-center gap-2 ${
            travelMode === "drive" ? "bg-white" : "bg-transparent"
          }`}
        >
          <MaterialCommunityIcons
            name="car"
            size={15}
            color={travelMode === "drive" ? "#0F172A" : "#475569"}
          />
          <Text className={`text-xs font-bold ${travelMode === "drive" ? "text-slate-900" : "text-slate-600"}`}>
            Drive
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onTravelModeChange("walk")}
          className={`h-9 flex-1 flex-row items-center justify-center gap-2 ${
            travelMode === "walk" ? "bg-white" : "bg-transparent"
          }`}
        >
          <MaterialCommunityIcons
            name="walk"
            size={15}
            color={travelMode === "walk" ? "#0F172A" : "#475569"}
          />
          <Text className={`text-xs font-bold ${travelMode === "walk" ? "text-slate-900" : "text-slate-600"}`}>
            Walk
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onOptimizeRoute}
        disabled={loadingRoute}
        className={`mt-3 h-11 flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 ${
          loadingRoute ? "bg-slate-100" : "bg-white"
        }`}
      >
        {loadingRoute ? (
          <ActivityIndicator size="small" color="#0F172A" />
        ) : (
          <MaterialCommunityIcons name="robot" size={16} color="#0F172A" />
        )}
        <Text className="text-sm font-bold text-slate-900">
          {loadingRoute ? "Optimizing..." : "Optimize Route"}
        </Text>
      </Pressable>

      {routeAlternatives.length > 1 ? (
        <View className="mt-3 flex-row gap-2">
          {routeAlternatives.slice(0, 2).map((candidate, index) => {
            const isSelected = selectedRouteIndex === index;
            return (
              <Pressable
                key={`route-option-${index}`}
                onPress={() => onSelectRoute(index)}
                className={`flex-1 rounded-xl border px-3 py-2 ${
                  isSelected ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
                }`}
              >
                <Text className={`text-xs font-bold ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                  Route {index + 1}
                </Text>
                <Text className="mt-1 text-[11px] font-semibold text-slate-600">
                  {candidate.distanceKm.toFixed(1)} km | {candidate.durationMin} min
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {route ? (
        <View className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <Text className="text-xs font-bold text-slate-700">
            {route.profile === "walking" ? "Walking" : "Driving"} | {route.distanceKm.toFixed(1)} km |{" "}
            {route.durationMin} min
          </Text>

          {risk ? (
            <>
              <Text className="mt-2 text-xs font-bold text-slate-900">
                {route.source === "ai" ? "AI optimized route" : "Route evaluation"}
              </Text>
              <Text className="mt-1 text-xs font-bold text-slate-900">
                Rank score: {rankScoreText} | Routing cost: {risk.routingCost.toFixed(3)}
              </Text>
              <Text className="mt-1 text-[11px] font-semibold text-slate-600">{comparisonText}</Text>
              <Text className="mt-1 text-xs font-bold text-slate-900">
                Current risk:{" "}
                <Text style={{ color: riskColor(risk.riskLevel) }}>{riskLabel(risk.riskLevel)}</Text>
              </Text>
              <Text className="mt-1 text-xs font-bold text-slate-900">
                Route passable:{" "}
                <Text style={{ color: passableColor(risk.routePassable) }}>
                  {passableText(risk.routePassable)}
                </Text>
              </Text>
              <Text className="mt-1 text-[11px] font-semibold text-slate-600">{risk.justification}</Text>
            </>
          ) : (
            <Text className="mt-2 text-xs font-semibold text-slate-600">Standard route</Text>
          )}
        </View>
      ) : (
        <View className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Text className="text-xs font-semibold text-slate-600">
            {loadingRoute ? "Fetching route..." : "Tap a travel mode to load directions."}
          </Text>
        </View>
      )}
    </View>
  );
}
