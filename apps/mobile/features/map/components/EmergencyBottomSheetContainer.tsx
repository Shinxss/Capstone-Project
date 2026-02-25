import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  directionsSnapPoints,
  overviewSnapPoints,
} from "../../../constants/mapRouting";
import { EmergencyDirectionsSheet } from "./EmergencyDirectionsSheet";
import { EmergencyOverviewSheet } from "./EmergencyOverviewSheet";
import type { EmergencyBottomSheetController } from "../hooks/useEmergencyBottomSheet";

type EmergencyBottomSheetContainerProps = {
  controller: EmergencyBottomSheetController;
};

export function EmergencyBottomSheetContainer({
  controller,
}: EmergencyBottomSheetContainerProps) {
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(
    () =>
      controller.sheetMode === "directions"
        ? [...directionsSnapPoints]
        : [...overviewSnapPoints],
    [controller.sheetMode]
  );

  useEffect(() => {
    if (!controller.selectedEmergency) {
      sheetRef.current?.close();
      return;
    }

    requestAnimationFrame(() => {
      if (controller.sheetMode === "directions") {
        sheetRef.current?.snapToIndex(1);
      } else {
        sheetRef.current?.snapToIndex(0);
      }
    });
  }, [controller.selectedEmergency, controller.sheetMode, snapPoints]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={(index) => {
        if (index === -1) {
          controller.closeSheet();
        }
      }}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView>
        {controller.selectedEmergency ? (
          controller.sheetMode === "overview" ? (
            <EmergencyOverviewSheet
              emergency={controller.selectedEmergency}
              onDirectionPress={() => {
                void controller.goToDirections();
              }}
              onClose={controller.closeSheet}
            />
          ) : (
            <EmergencyDirectionsSheet
              emergency={controller.selectedEmergency}
              travelMode={controller.travelMode}
              route={controller.route}
              routeAlternatives={controller.routeAlternatives}
              selectedRouteIndex={controller.selectedRouteIndex}
              risk={controller.risk}
              loadingRoute={controller.loadingRoute}
              onTravelModeChange={controller.setTravelMode}
              onSelectRoute={controller.selectRoute}
              onOptimizeRoute={() => {
                void controller.optimizeRoute();
              }}
              onBack={controller.goToOverview}
              onClose={controller.closeSheet}
            />
          )
        ) : (
          <View />
        )}
      </BottomSheetView>
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
});
