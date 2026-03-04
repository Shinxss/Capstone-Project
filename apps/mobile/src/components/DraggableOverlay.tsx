import React, { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";

type DraggableOverlayProps = {
  children: ReactNode;
  initialTop?: number;
  initialRight?: number;
  zIndex?: number;
};

export default function DraggableOverlay({
  children,
  initialTop = 120,
  initialRight = 12,
  zIndex = 50,
}: DraggableOverlayProps) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const latestPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const id = pan.addListener((value) => {
      latestPosition.current = value;
    });

    return () => {
      pan.removeListener(id);
    };
  }, [pan]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
        onPanResponderGrant: () => {
          pan.setOffset({
            x: latestPosition.current.x,
            y: latestPosition.current.y,
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          pan.flattenOffset();
        },
        onPanResponderTerminate: () => {
          pan.flattenOffset();
        },
      }),
    [pan]
  );

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        {
          top: initialTop,
          right: initialRight,
          zIndex,
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View pointerEvents="box-none">{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
  },
});
