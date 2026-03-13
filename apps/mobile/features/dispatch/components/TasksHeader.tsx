import { useRouter } from "expo-router";
import { TASKS_SCREEN_COPY } from "../constants/dispatchUi.constants";
import { ReportEmergencyHeader } from "../../report/components/ReportEmergencyHeader";

export function TasksHeader() {
  const router = useRouter();

  return (
    <ReportEmergencyHeader
      title={TASKS_SCREEN_COPY.title}
      subtitle={TASKS_SCREEN_COPY.subtitle}
      onBack={() => router.back()}
      showProgressBar={false}
      backgroundColor="#FFFFFF"
    />
  );
}
