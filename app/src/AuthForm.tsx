import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { authRequest } from "./api";
import { ApiAuthResponse, applyApiAuthResponse } from "./auth";
import { Button, DeskHeader, Field, Notice, ScrollScreen } from "./components";
import { supabase } from "./supabase";
import { useTheme } from "./theme";

type Mode = "signin" | "signup" | "forgot" | "recover" | "claim";
export type RecoveryParams = {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  errorDescription?: string;
};

const first = (value: unknown) =>
  typeof value === "string"
    ? value
    : Array.isArray(value) && typeof value[0] === "string"
      ? value[0]
      : undefined;
export function recoveryParams(
  params: Record<string, unknown>,
): RecoveryParams {
  return {
    accessToken: first(params.access_token),
    refreshToken: first(params.refresh_token),
    code: first(params.code),
    errorDescription: first(params.error_description) ?? first(params.error),
  };
}

export function AuthForm({
  mode,
  recovery,
}: {
  mode: Mode;
  recovery?: RecoveryParams;
}) {
  const { colors } = useTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(mode !== "recover");
  const titles = {
    signin: "Sign in",
    signup: "Create account",
    forgot: "Reset password",
    recover: "Choose a password",
    claim: "Move an account",
  };

  useEffect(() => {
    if (mode !== "recover") return;
    let active = true;
    async function establishRecovery() {
      setRecoveryReady(false);
      setError("");
      try {
        if (recovery?.errorDescription)
          throw new Error(recovery.errorDescription);
        if (!supabase)
          throw new Error("Supabase environment variables are not configured.");
        if (recovery?.code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(recovery.code);
          if (exchangeError) throw exchangeError;
        } else if (recovery?.accessToken && recovery.refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: recovery.accessToken,
            refresh_token: recovery.refreshToken,
          });
          if (sessionError) throw sessionError;
        } else {
          throw new Error(
            "This recovery link is incomplete or has expired. Request a new one.",
          );
        }
        if (active) setRecoveryReady(true);
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not verify this recovery link.",
          );
      }
    }
    void establishRecovery();
    return () => {
      active = false;
    };
  }, [
    mode,
    recovery?.accessToken,
    recovery?.refreshToken,
    recovery?.code,
    recovery?.errorDescription,
  ]);

  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!supabase)
        throw new Error("Supabase environment variables are not configured.");
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        router.replace("/");
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: "gcsestudydesk://auth/recover" },
        );
        if (resetError) throw resetError;
        setMessage("Check your email for a secure recovery link.");
      } else if (mode === "recover") {
        if (!recoveryReady)
          throw new Error("Wait for the recovery link to be verified.");
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) throw updateError;
        router.replace("/");
      } else {
        const result = await authRequest<ApiAuthResponse>(
          mode === "signup" ? "/signup" : "/claim",
          mode === "signup"
            ? { username, email, password }
            : {
                username,
                email,
                currentPassword: oldPassword,
                newPassword: password,
              },
        );
        const state = await applyApiAuthResponse(supabase, result);
        router.replace(state === "confirmation-required" ? "/auth/confirm" : "/");
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Authentication failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollScreen>
      <DeskHeader title={titles[mode]} eyebrow="SECURE STUDY ACCOUNT" />
      <Text style={{ color: colors.quiet, lineHeight: 21 }}>
        {mode === "claim"
          ? "Verify your old account, then move its compact progress to a secure email account."
          : mode === "signup"
            ? "One account keeps progress separate across all three subjects."
            : "Your secure session is stored in the device keychain, not ordinary app storage."}
      </Text>
      {mode === "recover" && !recoveryReady && !error && (
        <Notice kind="loading" title="VERIFYING RECOVERY LINK">
          Establishing a secure password recovery session.
        </Notice>
      )}
      {(mode === "signin" || mode === "signup" || mode === "forgot") && (
        <Field
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      )}
      {(mode === "signup" || mode === "claim") && (
        <Field
          label="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      )}
      {mode === "claim" && (
        <Field
          label="Current password"
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
        />
      )}
      {(mode === "signin" ||
        mode === "signup" ||
        mode === "recover" ||
        mode === "claim") && (
        <Field
          label={mode === "recover" ? "New password" : "Password"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      )}
      {error && (
        <Notice kind="error" title="NOT COMPLETED">
          {error}
        </Notice>
      )}
      {message && (
        <Notice kind="success" title="CHECK YOUR EMAIL">
          {message}
        </Notice>
      )}
      <Button
        disabled={busy || (mode === "recover" && !recoveryReady)}
        onPress={submit}
      >
        {busy ? "Working..." : titles[mode]}
      </Button>
      {mode !== "signin" && (
        <Link
          href="/auth/sign-in"
          style={{ color: colors.info, fontWeight: "700" }}
        >
          Back to sign in
        </Link>
      )}
      {mode === "signin" && (
        <Link
          href="/auth/signup"
          style={{ color: colors.info, fontWeight: "700" }}
        >
          Create an account
        </Link>
      )}
      {mode === "signin" && (
        <Link
          href="/auth/forgot"
          style={{ color: colors.info, fontWeight: "700" }}
        >
          Forgot password?
        </Link>
      )}
    </ScrollScreen>
  );
}
