import React, { useMemo } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resolveAvatarUri } from "../utils/avatarUrl";

type ProfileAvatarViewerModalProps = {
  visible: boolean;
  avatarUrl?: string | null;
  authToken?: string | null;
  onClose: () => void;
};

export default function ProfileAvatarViewerModal({
  visible,
  avatarUrl,
  authToken,
  onClose,
}: ProfileAvatarViewerModalProps) {
  const resolvedAvatarUri = useMemo(() => resolveAvatarUri(avatarUrl), [avatarUrl]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(2,6,23,0.92)",
          paddingHorizontal: 18,
          paddingTop: 52,
          paddingBottom: 28,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#F8FAFC", fontSize: 18, fontWeight: "800" }}>Profile Picture</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(248,250,252,0.14)",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Ionicons name="close" size={20} color="#F8FAFC" />
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {resolvedAvatarUri ? (
            <Image
              source={{
                uri: resolvedAvatarUri,
                ...(authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}),
              }}
              style={{
                width: "100%",
                maxWidth: 380,
                aspectRatio: 1,
                borderRadius: 20,
                backgroundColor: "#111827",
              }}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: "#E2E8F0", fontSize: 14 }}>No profile photo uploaded yet.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
