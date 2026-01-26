import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import LoginBg from "../assets/login_lightbg.svg"; // adjust path

const { width, height } = Dimensions.get("window");

function SirenGlow({
  color,
  x,
  y,
  size,
}: {
  color: "red" | "blue";
  x: number;
  y: number;
  size: number;
}) {
  const id = `${color}-grad-${Math.random().toString(16).slice(2)}`;
  const main = color === "red" ? "#EF4444" : "#3B82F6";

  return (
    <View pointerEvents="none" style={{ position: "absolute", left: x, top: y }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={main} stopOpacity={0.30} />
            <Stop offset="55%" stopColor={main} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={main} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* ✅ Background behind */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      >
        <LoginBg width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      </View>

      {/* ✅ Siren glow behind */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        <SirenGlow color="blue" size={240} x={-90} y={40} />
        <SirenGlow color="red" size={240} x={width - 180} y={30} />
      </View>

      {/* ✅ Content on top */}
      <View style={{ flex: 1, zIndex: 5 }}>{children}</View>
    </View>
  );
}
