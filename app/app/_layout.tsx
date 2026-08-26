import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppProviders, useAuth, usePreferences } from "@/providers";
import { Button, Notice, Screen } from "@/components";
import { useTheme } from "@/theme";

function Navigation() {
  const { session, loading } = useAuth();
  const { hydrated: preferencesHydrated } = usePreferences();
  const segments = useSegments() as string[];
  const { isDark } = useTheme();
  const inAuth = segments[0] === "auth";
  const recovering = inAuth && segments[1] === "recover";
  useEffect(() => {
    if (!loading && !session && !inAuth) router.replace("/auth/sign-in");
    if (!loading && session && inAuth && !recovering) router.replace("/");
  }, [loading, session, inAuth, recovering]);
  if (loading || !preferencesHydrated)
    return (
      <Screen style={{ justifyContent: "center", padding: 20 }}>
        <Notice kind="loading" title="OPENING YOUR DESK">
          Restoring your session and preferences.
        </Notice>
      </Screen>
    );
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </>
  );
}
export default function RootLayout() {
  return (
    <AppProviders>
      <Navigation />
    </AppProviders>
  );
}
export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <AppProviders>
      <Screen style={{ justifyContent: "center", padding: 20, gap: 16 }}>
        <Notice kind="error" title="THE DESK HIT A PROBLEM">
          {error.message}
        </Notice>
        <Button onPress={retry}>TRY AGAIN</Button>
        <Button variant="secondary" onPress={() => router.replace("/")}>RETURN TO DESK</Button>
      </Screen>
    </AppProviders>
  );
}
