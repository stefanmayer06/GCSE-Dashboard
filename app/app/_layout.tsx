import { Redirect, router, Stack, useSegments } from "expo-router";
import type { Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { AppProviders, useAuth, usePreferences } from "@/providers";
import { Button, Notice, Screen } from "@/components";
import { useTheme } from "@/theme";

export function authRedirect(session: Session | null, segments: string[]): Href | null {
  const inAuth = segments[0] === "auth";
  const recovering = inAuth && segments[1] === "recover";
  if (!session && !inAuth) return "/auth/sign-in" as Href;
  if (session && inAuth && !recovering) return "/" as Href;
  return null;
}

function Navigation() {
  const { session, loading } = useAuth();
  const { hydrated: preferencesHydrated } = usePreferences();
  const segments = useSegments() as string[];
  const { isDark } = useTheme();
  if (loading || !preferencesHydrated)
    return (
      <Screen style={{ justifyContent: "center", padding: 20 }}>
        <Notice kind="loading" title="OPENING YOUR DESK">
          Restoring your session and preferences.
        </Notice>
      </Screen>
    );
  const redirect = authRedirect(session, segments);
  if (redirect) return <Redirect href={redirect} />;
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
        <Button variant="secondary" onPress={() => router.replace("/" as Href)}>RETURN TO DESK</Button>
      </Screen>
    </AppProviders>
  );
}
