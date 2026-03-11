import { Text, View } from "react-native";
import type { DispatchOffer } from "../models/dispatch";
import { getDispatchProgressSteps } from "../utils/dispatchProgress";

type DispatchProgressStepperProps = {
  dispatch: DispatchOffer;
};

export function DispatchProgressStepper({ dispatch }: DispatchProgressStepperProps) {
  const steps = getDispatchProgressSteps(dispatch);

  return (
    <View className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3">
      <Text className="text-xs font-extrabold text-red-700">Progress</Text>
      <View className="mt-2">
        {steps.map((step, index) => {
          const emphasized = step.done || step.active;
          const showConnector = index < steps.length - 1;
          const nextStep = steps[index + 1];
          const nextReady = nextStep ? nextStep.done || nextStep.active : false;

          return (
            <View key={step.key} className="flex-row items-start">
              <View className="mr-3 items-center">
                <View
                  className={`h-2.5 w-2.5 rounded-full ${
                    emphasized ? "bg-red-600" : "bg-red-200"
                  }`}
                />
                {showConnector ? (
                  <View
                    className={`mt-1 h-5 w-0.5 rounded-full ${
                      nextReady ? "bg-red-300" : "bg-red-200"
                    }`}
                  />
                ) : null}
              </View>
              <Text
                className={`pb-3 text-xs font-semibold ${
                  emphasized ? "text-slate-800" : "text-slate-500"
                }`}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
