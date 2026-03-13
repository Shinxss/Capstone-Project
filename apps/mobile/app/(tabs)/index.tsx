import React, { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AuthRequiredModal from "../../components/AuthRequiredModal";
import { HomeView } from "../../features/home/components/HomeView";
import { SosConfirmationModal } from "../../features/home/components/SosConfirmationModal";
import { useAuthRequiredPrompt } from "../../features/auth/hooks/useAuthRequiredPrompt";
import { useSession } from "../../features/auth/hooks/useSession";
import { useSosHold } from "../../features/emergency/hooks/useSosHold";
import { useSosReport } from "../../features/emergency/hooks/useSosReport";
import { DispatchOfferModal } from "../../features/dispatch/components/DispatchOfferModal";
import { useActiveDispatch } from "../../features/dispatch/hooks/useActiveDispatch";
import { useDispatchModal } from "../../features/dispatch/hooks/useDispatchModal";
import { usePendingDispatch } from "../../features/dispatch/hooks/usePendingDispatch";
import { useWeatherSummary } from "../../features/weather/hooks/useWeatherSummary";
import type { WeatherSeverity } from "../../features/weather/services/weatherApi";
import { useMyActiveRequest } from "../../features/requests/hooks/useMyActiveRequest";
import { usePullToRefresh } from "../../features/common/hooks/usePullToRefresh";
import {
  formatEtaText,
  formatRelativeTime,
  formatTrackingHeadline,
} from "../../features/requests/utils/formatters";

type AlertIconName = React.ComponentProps<typeof Ionicons>["name"];
type AlertTheme = {
  cardBackgroundColor: string;
  cardBorderColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  headlineColor: string;
  retryColor: string;
};

type WeatherVisual = {
  iconName: AlertIconName;
  theme: AlertTheme;
};

const WEATHER_THEMES = {
  sunny: {
    cardBackgroundColor: "#FFFBEB",
    cardBorderColor: "#FDE68A",
    iconBackgroundColor: "#FEF3C7",
    iconColor: "#B45309",
    headlineColor: "#92400E",
    retryColor: "#B45309",
  },
  partly: {
    cardBackgroundColor: "#FFF7ED",
    cardBorderColor: "#FDBA74",
    iconBackgroundColor: "#FED7AA",
    iconColor: "#C2410C",
    headlineColor: "#9A3412",
    retryColor: "#C2410C",
  },
  cloudy: {
    cardBackgroundColor: "#E0F2FE",
    cardBorderColor: "#7DD3FC",
    iconBackgroundColor: "#BAE6FD",
    iconColor: "#0369A1",
    headlineColor: "#075985",
    retryColor: "#0369A1",
  },
  fog: {
    cardBackgroundColor: "#F1F5F9",
    cardBorderColor: "#CBD5E1",
    iconBackgroundColor: "#E2E8F0",
    iconColor: "#475569",
    headlineColor: "#334155",
    retryColor: "#475569",
  },
  rain: {
    cardBackgroundColor: "#EFF6FF",
    cardBorderColor: "#93C5FD",
    iconBackgroundColor: "#BFDBFE",
    iconColor: "#1D4ED8",
    headlineColor: "#1E40AF",
    retryColor: "#1E40AF",
  },
  heavy: {
    cardBackgroundColor: "#FEF2F2",
    cardBorderColor: "#FCA5A5",
    iconBackgroundColor: "#FECACA",
    iconColor: "#7F1D1D",
    headlineColor: "#B91C1C",
    retryColor: "#B91C1C",
  },
  snow: {
    cardBackgroundColor: "#ECFEFF",
    cardBorderColor: "#A5F3FC",
    iconBackgroundColor: "#CFFAFE",
    iconColor: "#0E7490",
    headlineColor: "#155E75",
    retryColor: "#155E75",
  },
  windy: {
    cardBackgroundColor: "#ECFDF5",
    cardBorderColor: "#86EFAC",
    iconBackgroundColor: "#BBF7D0",
    iconColor: "#166534",
    headlineColor: "#166534",
    retryColor: "#166534",
  },
  info: {
    cardBackgroundColor: "#EFF6FF",
    cardBorderColor: "#93C5FD",
    iconBackgroundColor: "#DBEAFE",
    iconColor: "#1D4ED8",
    headlineColor: "#1E40AF",
    retryColor: "#1E40AF",
  },
  error: {
    cardBackgroundColor: "#FEF2F2",
    cardBorderColor: "#FECACA",
    iconBackgroundColor: "#FEE2E2",
    iconColor: "#B91C1C",
    headlineColor: "#B91C1C",
    retryColor: "#B91C1C",
  },
  loading: {
    cardBackgroundColor: "#F8FAFC",
    cardBorderColor: "#E2E8F0",
    iconBackgroundColor: "#E2E8F0",
    iconColor: "#334155",
    headlineColor: "#334155",
    retryColor: "#334155",
  },
} as const;

function weatherVisualFromSummary(
  weatherCode: number | null,
  severity: WeatherSeverity,
  title: string
): WeatherVisual {
  if (severity === "HEAVY") {
    return {
      iconName: "warning-outline",
      theme: WEATHER_THEMES.heavy,
    };
  }

  if (/windy/i.test(title)) {
    return {
      iconName: "speedometer-outline",
      theme: WEATHER_THEMES.windy,
    };
  }

  if (weatherCode === null) {
    return {
      iconName: "partly-sunny-outline",
      theme: WEATHER_THEMES.partly,
    };
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return {
      iconName: "thunderstorm-outline",
      theme: WEATHER_THEMES.heavy,
    };
  }

  if ([61, 63, 65, 80, 81, 82, 51, 53, 55].includes(weatherCode)) {
    return {
      iconName: "rainy-outline",
      theme: WEATHER_THEMES.rain,
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return {
      iconName: "snow-outline",
      theme: WEATHER_THEMES.snow,
    };
  }

  if (weatherCode === 0) {
    return {
      iconName: "sunny-outline",
      theme: WEATHER_THEMES.sunny,
    };
  }

  if ([1, 2].includes(weatherCode)) {
    return {
      iconName: "partly-sunny-outline",
      theme: WEATHER_THEMES.partly,
    };
  }

  if (weatherCode === 3) {
    return {
      iconName: "cloudy-outline",
      theme: WEATHER_THEMES.cloudy,
    };
  }

  if ([45, 48].includes(weatherCode)) {
    return {
      iconName: "cloud-outline",
      theme: WEATHER_THEMES.fog,
    };
  }

  return {
    iconName: "partly-sunny-outline",
    theme: WEATHER_THEMES.partly,
  };
}

export default function HomeScreen() {
  const { displayName, session, isUser } = useSession();
  const authRequired = useAuthRequiredPrompt();
  const { sendSos, sending: sosSending } = useSosReport();
  const isVolunteer = useMemo(() => session?.mode === "user" && String(session.user.role ?? "").toUpperCase() === "VOLUNTEER", [session]);
  const { activeRequest: myActiveRequest, refresh: refreshMyActiveRequest } = useMyActiveRequest({
    pollMs: 8000,
    enabled: isUser,
  });
  const {
    summary: weatherSummary,
    loading: weatherLoading,
    locationMessage,
    errorMessage: weatherErrorMessage,
    retry: retryWeather,
  } = useWeatherSummary();

  const { refresh: refreshActive } = useActiveDispatch({ pollMs: 8000, enabled: isVolunteer });
  const { pendingDispatch, refresh: refreshPending, clear: clearPending } = usePendingDispatch({
    pollMs: 8000,
    enabled: isVolunteer,
  });
  const refreshHome = useCallback(async () => {
    const refreshJobs: Promise<unknown>[] = [refreshMyActiveRequest(), retryWeather()];

    if (isVolunteer) {
      refreshJobs.push(refreshPending(), refreshActive());
    }

    await Promise.allSettled(refreshJobs);
  }, [isVolunteer, refreshActive, refreshMyActiveRequest, refreshPending, retryWeather]);
  const { refreshing: refreshingHome, triggerRefresh: triggerRefreshHome } = usePullToRefresh(refreshHome);

  const [sosConfirmVisible, setSosConfirmVisible] = useState(false);

  const weatherCard = useMemo(() => {
    if (locationMessage) {
      return {
        title: "Weather alerts",
        message: locationMessage,
        severity: "NONE" as WeatherSeverity,
        iconName: "location-outline" as AlertIconName,
        theme: WEATHER_THEMES.info,
        retryEnabled: true,
      };
    }

    if (weatherErrorMessage) {
      return {
        title: "Weather unavailable",
        message: weatherErrorMessage,
        severity: "NONE" as WeatherSeverity,
        iconName: "alert-circle-outline" as AlertIconName,
        theme: WEATHER_THEMES.error,
        retryEnabled: true,
      };
    }

    if (weatherSummary) {
      const visual = weatherVisualFromSummary(
        weatherSummary.weather_code,
        weatherSummary.severity,
        weatherSummary.title
      );
      return {
        title: weatherSummary.title,
        message: weatherSummary.message,
        severity: weatherSummary.severity,
        iconName: visual.iconName,
        theme: visual.theme,
        retryEnabled: false,
      };
    }

    if (weatherLoading) {
      return {
        title: "Loading weather",
        message: "Fetching local weather alerts...",
        severity: "NONE" as WeatherSeverity,
        iconName: "refresh-outline" as AlertIconName,
        theme: WEATHER_THEMES.loading,
        retryEnabled: false,
      };
    }

    return {
      title: "Weather unavailable",
      message: "Unable to fetch weather right now.",
      severity: "NONE" as WeatherSeverity,
      iconName: "alert-circle-outline" as AlertIconName,
      theme: WEATHER_THEMES.error,
      retryEnabled: true,
    };
  }, [locationMessage, weatherErrorMessage, weatherSummary, weatherLoading]);

  const homeActiveRequest = useMemo(() => {
    if (!myActiveRequest) return undefined;
    return {
      id: myActiveRequest.id,
      trackingLabel: formatTrackingHeadline(myActiveRequest.trackingStatus),
      etaText: formatEtaText(myActiveRequest.etaSeconds ?? null, myActiveRequest.trackingStatus),
      lastUpdatedText: formatRelativeTime(myActiveRequest.lastUpdatedAt ?? null),
    };
  }, [myActiveRequest]);

  const onPressWeatherCard = useCallback(() => {
    void retryWeather();
  }, [retryWeather]);

  const onPressTracking = useCallback(() => {
    if (!homeActiveRequest?.id) return;
    router.push({
      pathname: "/my-request-tracking",
      params: { id: homeActiveRequest.id },
    });
  }, [homeActiveRequest?.id]);

  const onSosTriggered = useCallback(() => {
    if (!authRequired.requireAuth(isUser, { blockedAction: "report_emergency" })) return;
    setSosConfirmVisible(true);
  }, [authRequired, isUser]);

  const onConfirmSos = useCallback(async () => {
    if (!authRequired.requireAuth(isUser, { blockedAction: "report_emergency" })) {
      setSosConfirmVisible(false);
      return;
    }

    try {
      const result = await sendSos();
      setSosConfirmVisible(false);
      router.push({
        pathname: "/report/success",
        params: {
          incidentId: result.incidentId,
          referenceNumber: result.referenceNumber,
          isSos: "1",
        },
      });
    } catch (e: any) {
      Alert.alert("SOS failed", e?.message ?? "Please try again.");
    }
  }, [authRequired, isUser, sendSos]);

  const onCancelSosConfirm = useCallback(() => {
    if (sosSending) return;
    setSosConfirmVisible(false);
  }, [sosSending]);

  const { holding, remainingSeconds, startHold, cancelHold } = useSosHold({
    holdMs: 3000,
    onTriggered: onSosTriggered,
  });

  const onStartSosHold = useCallback(() => {
    if (!authRequired.requireAuth(isUser, { blockedAction: "report_emergency" })) return;
    if (sosSending || sosConfirmVisible) return;
    startHold();
  }, [authRequired, isUser, sosSending, sosConfirmVisible, startHold]);

  const onCancelSosHold = useCallback(() => {
    if (sosSending || sosConfirmVisible) return;
    cancelHold();
  }, [sosSending, sosConfirmVisible, cancelHold]);

  const onPressApplyVolunteer = useCallback(() => {
    if (!authRequired.requireAuth(isUser, { blockedAction: "access_volunteer_tools" })) return;
    router.push("/volunteer-apply-modal");
  }, [authRequired, isUser]);

  const dispatchModal = useDispatchModal({
    pendingDispatch,
    clearPending,
    refreshPending,
    refreshActive,
    onAcceptSuccess: () => {
      router.push("/(tabs)/map");
    },
    onViewDetails: () => {
      router.push("/(tabs)/tasks");
    },
  });

  return (
    <>
      <HomeView
        displayName={displayName}
        avatarUrl={session?.mode === "user" ? session.user.avatarUrl : null}
        avatarAuthToken={session?.mode === "user" ? session.user.accessToken : null}
        onPressProfile={() => router.push("/(tabs)/more")}
        holding={holding}
        remainingSeconds={remainingSeconds}
        alertTitle={weatherCard.title}
        alertMessage={weatherCard.message}
        alertSeverity={weatherCard.severity}
        alertIconName={weatherCard.iconName}
        alertTheme={weatherCard.theme}
        alertRetryEnabled={weatherCard.retryEnabled}
        refreshing={refreshingHome}
        activeRequest={homeActiveRequest}
        onRefresh={triggerRefreshHome}
        onPressAlert={weatherCard.retryEnabled ? onPressWeatherCard : undefined}
        onPressTracking={homeActiveRequest ? onPressTracking : undefined}
        onStartHold={onStartSosHold}
        onCancelHold={onCancelSosHold}
        onPressNotifications={() => {}}
        onPressViewAll={() => {}}
        showVolunteerCta={!isVolunteer}
        onPressApplyVolunteer={onPressApplyVolunteer}
      />

      <SosConfirmationModal
        visible={sosConfirmVisible}
        busy={sosSending}
        onConfirm={onConfirmSos}
        onCancel={onCancelSosConfirm}
      />

      <AuthRequiredModal
        {...authRequired.modalProps}
      />

      {isVolunteer ? (
        <DispatchOfferModal
          visible={dispatchModal.visible}
          data={dispatchModal.data}
          assignedByText={dispatchModal.assignedByText}
          severityLabel={dispatchModal.severityLabel}
          statusLabel={dispatchModal.statusLabel}
          distanceEtaText={dispatchModal.distanceEtaText}
          reportedTimeText={dispatchModal.reportedTimeText}
          accepting={dispatchModal.accepting}
          declining={dispatchModal.declining}
          onAccept={dispatchModal.acceptDispatch}
          onDecline={dispatchModal.declineDispatch}
          onViewDetails={dispatchModal.viewDetails}
          onClose={dispatchModal.dismiss}
        />
      ) : null}

    </>
  );
}
