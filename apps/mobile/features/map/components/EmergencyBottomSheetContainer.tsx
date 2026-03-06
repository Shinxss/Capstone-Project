import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  directionsSnapPoints,
  overviewSnapPoints,
} from "../../../constants/mapRouting";
import { EmergencyDirectionsSheet } from "./EmergencyDirectionsSheet";
import { EmergencyOverviewSheet } from "./EmergencyOverviewSheet";
import type { EmergencyBottomSheetController } from "../hooks/useEmergencyBottomSheet";

type EmergencyBottomSheetContainerProps = {
  controller: EmergencyBottomSheetController;
  authToken?: string | null;
};

const minimizedSnapPoint = "15%";

export function EmergencyBottomSheetContainer({
  controller,
  authToken,
}: EmergencyBottomSheetContainerProps) {
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(
    () => [
      minimizedSnapPoint,
      ...(controller.sheetMode === "directions"
        ? [...directionsSnapPoints]
        : [...overviewSnapPoints]),
    ],
    [controller.sheetMode]
  );

  useEffect(() => {
    if (!controller.selectedEmergency) {
      sheetRef.current?.close();
      return;
    }

    requestAnimationFrame(() => {
      if (controller.isMinimized) {
        sheetRef.current?.snapToIndex(0);
        return;
      }

      if (controller.sheetMode === "directions") {
        sheetRef.current?.snapToIndex(2);
      } else {
        sheetRef.current?.snapToIndex(1);
      }
    });
  }, [controller.selectedEmergency, controller.sheetMode, controller.isMinimized, snapPoints]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      onChange={(index) => {
        if (!controller.selectedEmergency) return;
        if (index <= 0) {
          controller.minimizeSheet();
          return;
        }

        if (controller.isMinimized) {
          controller.expandSheet();
        }
      }}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      {controller.selectedEmergency ? (
        controller.sheetMode === "overview" ? (
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <EmergencyOverviewSheet
              emergency={controller.selectedEmergency}
              emergencyDetail={controller.emergencyDetail}
              loadingDetail={controller.loadingDetail}
              etaSummary={controller.etaSummary}
              loadingEta={controller.loadingEta}
              authToken={authToken}
              onDirectionPress={() => {
                void controller.goToDirections();
              }}
              onClose={controller.closeSheet}
            />
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView>
            <EmergencyDirectionsSheet
              emergency={controller.selectedEmergency}
              travelMode={controller.travelMode}
              route={controller.route}
              risk={controller.risk}
              loadingRoute={controller.loadingRoute}
              onTravelModeChange={controller.setTravelMode}
              onOptimizeRoute={() => {
                void controller.optimizeRoute();
              }}
              onBack={controller.goToOverview}
              onClose={controller.closeSheet}
            />
          </BottomSheetView>
        )
      ) : (
        <BottomSheetView>
          <View />
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: "rgba(255,255,255,0.97)",
  },
  handle: {
    backgroundColor: "rgba(0,0,0,0.22)",
    width: 42,
  },
  scrollContent: {
    paddingBottom: 8,
  },
});
