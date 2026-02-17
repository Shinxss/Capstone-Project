import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type AuthRequiredModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onLogin: () => void;
};

export default function AuthRequiredModal({
  visible,
  title,
  message,
  onClose,
  onLogin,
}: AuthRequiredModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-md rounded-2xl bg-white p-5">
          <Text className="text-xl font-extrabold text-gray-900">{title}</Text>
          <Text className="mt-2 text-sm text-gray-600">{message}</Text>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onLogin}
              className="flex-1 items-center justify-center rounded-xl bg-red-500 py-3"
            >
              <Text className="font-extrabold text-white">Login</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
