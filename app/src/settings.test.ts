import {
  accountLinks,
  isDisposableAppStorageKey,
  settingsBaseUrl,
} from "./settings";

test("prefers the hosted website and derives account links from its origin", () => {
  expect(
    settingsBaseUrl(
      " https://study.example.com/app/ ",
      "https://api.example.com",
    ),
  ).toBe("https://study.example.com");
  expect(
    accountLinks("https://study.example.com/", "https://api.example.com"),
  ).toEqual({
    privacy: "https://study.example.com/privacy.html",
    support: "https://study.example.com/support.html",
    accountDeletion: "https://study.example.com/delete-account.html",
  });
});

test("falls back to the API origin and rejects unsafe URLs", () => {
  expect(accountLinks(undefined, "https://api.example.com/v1")?.privacy).toBe(
    "https://api.example.com/privacy.html",
  );
  expect(settingsBaseUrl("javascript:alert(1)", undefined)).toBeNull();
});

test("marks account work, including tutor notebooks, as disposable", () => {
  expect(isDisposableAppStorageKey("practice:draft:user:maths:1")).toBe(true);
  expect(isDisposableAppStorageKey("tutor-notebook:english:v1")).toBe(true);
  expect(isDisposableAppStorageKey("subject")).toBe(false);
  expect(isDisposableAppStorageKey("appearance")).toBe(false);
  expect(isDisposableAppStorageKey("reading-preferences")).toBe(false);
});
