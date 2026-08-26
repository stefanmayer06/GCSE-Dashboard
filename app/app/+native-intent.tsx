const recoveryKeys = [
  "access_token",
  "refresh_token",
  "code",
  "error",
  "error_code",
  "error_description",
] as const;

export function recoveryRedirect(path: string) {
  try {
    const url = new URL(path, "gcsestudydesk://");
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const isRecovery =
      url.pathname.includes("recover") ||
      url.searchParams.get("type") === "recovery" ||
      hash.get("type") === "recovery";
    if (!isRecovery) return null;
    const safe = new URLSearchParams();
    for (const key of recoveryKeys) {
      const value = url.searchParams.get(key) ?? hash.get(key);
      if (value) safe.set(key, value);
    }
    const query = safe.toString();
    return `/auth/recover${query ? `?${query}` : ""}`;
  } catch {
    return null;
  }
}

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  return recoveryRedirect(path) ?? path;
}
