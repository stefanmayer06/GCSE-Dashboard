/* global __dirname, expect, test */
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

test("does not render raw whitespace children in the scroll screen", () => {
  const source = readFileSync(join(__dirname, "AuthForm.tsx"), "utf8");

  expect(source).not.toContain('{" "}');
});

test("sign-in offers account creation before password recovery", () => {
  const source = readFileSync(join(__dirname, "AuthForm.tsx"), "utf8");
  const signup = source.indexOf('href="/auth/signup"');
  const signupText = source.indexOf("Create an account", signup);
  const forgot = source.indexOf('href="/auth/forgot"');
  const forgotText = source.indexOf("Forgot password?", forgot);

  expect(signup).toBeGreaterThan(-1);
  expect(signupText).toBeGreaterThan(signup);
  expect(forgot).toBeGreaterThan(signupText);
  expect(forgotText).toBeGreaterThan(forgot);
});
