import { recoveryRedirect } from "../app/+native-intent";

test("carries only recovery credentials from a hash link", () => {
  const redirect = recoveryRedirect(
    "gcsestudydesk://auth/recover#type=recovery&access_token=access&refresh_token=refresh&next=%2Fadmin",
  );
  expect(redirect).toBe(
    "/auth/recover?access_token=access&refresh_token=refresh",
  );
});

test("carries PKCE codes and provider errors but rejects unrelated links", () => {
  expect(
    recoveryRedirect(
      "https://example.test/auth/recover?code=abc&error_description=Expired+link",
    ),
  ).toBe("/auth/recover?code=abc&error_description=Expired+link");
  expect(
    recoveryRedirect("gcsestudydesk://practice/one?access_token=secret"),
  ).toBeNull();
});
