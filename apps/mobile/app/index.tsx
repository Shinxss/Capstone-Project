import { Redirect } from "expo-router";

export default function Index() {
  // Later you can check token here then redirect to /(tabs)
  return <Redirect href="/login" />;
}
