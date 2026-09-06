import React from "react";
import { jest, test, expect } from "@jest/globals";
import { act, create } from "react-test-renderer";
import { TodayScreen } from "./TodayScreen";
import { stablePlan } from "../planning";

const mockFetch = jest.fn();
const mockSave = jest.fn();
const mockQueryClient = {
  fetchQuery: mockFetch,
  refetchQueries: jest.fn().mockResolvedValue(),
  prefetchQuery: jest.fn(),
};
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
  useQueries: () => [
    { data: {} },
    { data: { topics: [] } },
    { data: { papers: [] } },
  ],
}));
jest.mock("expo-router", () => ({
  Link: "Link",
  router: { push: jest.fn() },
  useFocusEffect: (callback) =>
    require("react").useEffect(callback, [callback]),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
}));
jest.mock("../providers", () => ({
  usePreferences: () => ({
    subject: "maths",
    planning: { passMode: "balanced" },
    setSubject: jest.fn(),
  }),
  useAuth: () => ({ session: { user: { id: "learner" } } }),
  useNetwork: () => ({ online: true }),
}));
jest.mock("../theme", () => ({
  useTheme: () => ({ colors: {}, subject: {} }),
  subjectTokens: {
    maths: { label: "Foundation" },
    "maths-higher": { label: "Higher" },
    english: { label: "English" },
  },
}));
jest.mock("../components", () =>
  Object.fromEntries(
    [
      "Button",
      "DeskHeader",
      "Notice",
      "PaperPattern",
      "SectionHeader",
      "Skeleton",
    ].map((name) => [name, name]),
  ),
);
jest.mock("../api", () => ({
  ApiClient: jest
    .fn()
    .mockImplementation(() => ({ savePlan: mockSave, trackEvent: jest.fn() })),
  ApiError: class extends Error {},
}));
jest.mock("../query-cache", () => ({
  queryKeys: {
    personal: (...args) => ["personal", ...args],
    progress: (s) => ["progress", s],
    topics: (s) => ["topics", s],
    papers: (s) => ["papers", s],
  },
  warmSubjectCache: jest.fn(),
}));
jest.mock("../planning", () => ({
  ...jest.requireActual("../planning"),
  stablePlan: jest.fn(),
}));

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("a failed personal load never seeds or saves a replacement; retry reloads the account plan", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockFetch
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ plan: null, mistakes: [] });
  stablePlan.mockReturnValue({ plan: null, changed: false });
  let screen;
  await act(async () => {
    screen = create(<TodayScreen />);
    await flush();
  });
  expect(stablePlan).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
  const retry = screen.root
    .findAllByType("Button")
    .find((button) => button.props.children === "Retry loading plan");
  expect(retry).toBeDefined();
  await act(async () => {
    retry.props.onPress();
    await flush();
  });
  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(stablePlan).toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
  await act(async () => screen.unmount());
});
