export type AccountLink = "privacy" | "support" | "accountDeletion";

const paths: Record<AccountLink, string> = {
  privacy: "/privacy.html",
  support: "/support.html",
  accountDeletion: "/delete-account.html",
};

export function settingsBaseUrl(
  websiteUrl: string | undefined,
  apiUrl: string | undefined,
) {
  const value = (websiteUrl?.trim() || apiUrl?.trim() || "").replace(
    /\/+$/,
    "",
  );
  if (!value) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

export function accountLinks(
  websiteUrl: string | undefined,
  apiUrl: string | undefined,
) {
  const base = settingsBaseUrl(websiteUrl, apiUrl);
  return base
    ? (Object.fromEntries(
        Object.entries(paths).map(([key, path]) => [key, `${base}${path}`]),
      ) as Record<AccountLink, string>)
    : null;
}

export function isDisposableAppStorageKey(key: string) {
  return (
    key.startsWith("practice:") ||
    key.startsWith("cache:") ||
    key.startsWith("tutor-notebook:")
  );
}
