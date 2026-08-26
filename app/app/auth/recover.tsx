import { useLocalSearchParams } from "expo-router";
import { AuthForm, recoveryParams } from "@/AuthForm";

export default function Page() {
  return (
    <AuthForm
      mode="recover"
      recovery={recoveryParams(useLocalSearchParams())}
    />
  );
}
