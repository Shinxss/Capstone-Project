import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";

type ProfileAvatarActionSheetProps = {
  visible: boolean;
  hasAvatar: boolean;
  uploading?: boolean;
  onClose: () => void;
  onViewPhoto: () => void;
  onTakePhoto: () => void;
  onChooseFromLibrary: () => void;
  onRemovePhoto: () => void;
};

export default function ProfileAvatarActionSheet({
  visible,
  hasAvatar,
  uploading = false,
  onClose,
  onViewPhoto,
  onTakePhoto,
  onChooseFromLibrary,
  onRemovePhoto,
}: ProfileAvatarActionSheetProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const rowColor = isDark ? "#E2E8F0" : "#0F172A";
  const cardColor = isDark ? "#0E1626" : "#FFFFFF";
  const dividerColor = isDark ? "#1E293B" : "#E2E8F0";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          onPress={onClose}
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(2, 6, 23, 0.4)",
          }}
        />

        <View
          style={{
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 14),
            backgroundColor: cardColor,
            borderTopWidth: 1,
            borderColor: dividerColor,
            maxHeight: "80%",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 999,
                backgroundColor: isDark ? "#334155" : "#CBD5E1",
              }}
            />
          </View>

          <Text
            style={{
              color: textColor,
              fontSize: 16,
              fontWeight: "800",
              paddingHorizontal: 18,
              paddingBottom: 6,
            }}
          >
            Choose an action
          </Text>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            {hasAvatar ? (
              <>
                <Pressable
                  disabled={uploading}
                  onPress={onViewPhoto}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    opacity: uploading ? 0.55 : pressed ? 0.75 : 1,
                  })}
                >
                  <Ionicons name="eye-outline" size={20} color={rowColor} style={{ marginRight: 12 }} />
                  <Text style={{ color: rowColor, fontSize: 15, fontWeight: "600" }}>See Profile Picture</Text>
                </Pressable>
                <View style={{ height: 1, backgroundColor: dividerColor }} />
              </>
            ) : null}

            <Pressable
              disabled={uploading}
              onPress={onTakePhoto}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 14,
                opacity: uploading ? 0.55 : pressed ? 0.75 : 1,
              })}
            >
              <Ionicons name="camera-outline" size={20} color={rowColor} style={{ marginRight: 12 }} />
              <Text style={{ color: rowColor, fontSize: 15, fontWeight: "600" }}>Take Photo</Text>
            </Pressable>

            <View style={{ height: 1, backgroundColor: dividerColor }} />

            <Pressable
              disabled={uploading}
              onPress={onChooseFromLibrary}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 14,
                opacity: uploading ? 0.55 : pressed ? 0.75 : 1,
              })}
            >
              <Ionicons name="images-outline" size={20} color={rowColor} style={{ marginRight: 12 }} />
              <Text style={{ color: rowColor, fontSize: 15, fontWeight: "600" }}>Choose from Library</Text>
            </Pressable>

            {hasAvatar ? (
              <>
                <View style={{ height: 1, backgroundColor: dividerColor }} />
                <Pressable
                  disabled={uploading}
                  onPress={onRemovePhoto}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    opacity: uploading ? 0.55 : pressed ? 0.75 : 1,
                  })}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" style={{ marginRight: 12 }} />
                  <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "600" }}>Remove Photo</Text>
                </Pressable>
              </>
            ) : null}

            <View style={{ height: 1, backgroundColor: dividerColor }} />
            <Pressable
              disabled={uploading}
              onPress={onClose}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 14,
                opacity: uploading ? 0.55 : pressed ? 0.75 : 1,
              })}
            >
              <Ionicons name="close-outline" size={20} color={rowColor} style={{ marginRight: 12 }} />
              <Text style={{ color: rowColor, fontSize: 15, fontWeight: "600" }}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const StyleSheet = {
  absoluteFillObject: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
};
