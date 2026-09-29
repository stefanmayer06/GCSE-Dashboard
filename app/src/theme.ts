import { useColorScheme } from 'react-native';
import { usePreferences } from './providers';

export type Subject = 'maths' | 'maths-higher' | 'english';
export type Appearance = 'system' | 'light' | 'dark';

// Trailhead — exact tokens from DESIGN.md + website/clients/shared/v3.css.
// Light paper #f7f4ec / dark #131511. One hue per surface: Foundation Trail
// Indigo #4338CA, Higher Pine #0F766E, English Ember #B45309. Dark variants
// brighten for late-night revision. Wash + word on every state.
const light = {
  paper: '#f7f4ec',
  raised: '#ffffff',
  muted: '#efead9',
  ink: '#191c17',
  quiet: '#5b6055',
  line: '#d9d3c0',
  strong: '#8a8471',
  positive: '#15803d',
  positiveWash: '#dcf0e3',
  warning: '#92400e',
  warningWash: '#f6e7c8',
  negative: '#b91c1c',
  negativeWash: '#f6dcdc',
  info: '#1d4ed8',
  infoWash: '#dfe8fb',
  onAccent: '#ffffff',
  input: '#fffdf7',
};
const dark = {
  paper: '#131511',
  raised: '#1c1f1a',
  muted: '#262a22',
  ink: '#f1ede1',
  quiet: '#b3ac99',
  line: '#363b31',
  strong: '#6b6555',
  positive: '#4ade80',
  positiveWash: 'rgba(74, 222, 128, 0.16)',
  warning: '#fbbf24',
  warningWash: 'rgba(251, 191, 36, 0.16)',
  negative: '#f87171',
  negativeWash: 'rgba(248, 113, 113, 0.16)',
  info: '#93c5fd',
  infoWash: 'rgba(147, 197, 253, 0.16)',
  onAccent: '#131511',
  input: '#211f18',
};

export const subjectTokens = {
  maths: {
    accent: '#4338ca',
    accentDark: '#a5b4fc',
    tint: '#e4e1ff',
    tintDark: 'rgba(99, 102, 241, 0.2)',
    ink: '#232058',
    inkDark: '#e0e7ff',
    label: 'Maths Foundation',
    short: 'Foundation',
    spec: 'AQA 8300 · Foundation, grades 1–5',
    code: 'AQA 8300',
  },
  'maths-higher': {
    accent: '#0f766e',
    accentDark: '#5eead4',
    tint: '#d3eee7',
    tintDark: 'rgba(20, 120, 110, 0.24)',
    ink: '#123b36',
    inkDark: '#ccfbf1',
    label: 'Maths Higher',
    short: 'Higher',
    spec: 'AQA 8300H · Higher, grades 4–9',
    code: 'AQA 8300H',
  },
  english: {
    accent: '#b45309',
    accentDark: '#fbbf24',
    tint: '#f7e5c6',
    tintDark: 'rgba(180, 83, 9, 0.28)',
    ink: '#452a0b',
    inkDark: '#fef3c7',
    label: 'English Language',
    short: 'English',
    spec: 'AQA 8700 · no tiers',
    code: 'AQA 8700',
  },
} as const;

export const radii = { tile: 10, control: 14, pebble: 18, pill: 999, seal: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, xxxxl: 48 } as const;

// Fraunces (display serif) / Inter (body) / IBM Plex Mono (trail markers).
// Native uses system equivalents with the same roles so the app never blocks
// on a webfont: serif headlines, sans body, mono labels.
export const fonts = {
  display: 'Fraunces, Georgia, "Times New Roman", serif',
  body: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  displayNative: 'Georgia',
  bodyNative: 'System',
  monoNative: 'Menlo',
} as const;

export type StageId = 'new' | 'learning' | 'developing' | 'secure' | 'mastered' | 'needs-revision';
export function stageFor(percent: number | null, answered: number): { id: StageId; text: string } {
  if (answered === 0 || percent == null) return { id: 'new', text: 'New' };
  if (percent >= 85 && answered >= 10) return { id: 'mastered', text: 'Mastered' };
  if (percent >= 70) return { id: 'secure', text: 'Secure' };
  if (percent >= 50) return { id: 'developing', text: 'Developing' };
  if (percent >= 30) return { id: 'learning', text: 'Learning' };
  return { id: 'needs-revision', text: 'Needs revision' };
}

export const recommendation = (subject: Subject) =>
  subject === 'english'
    ? 'Read the source before timing your response.'
    : subject === 'maths-higher'
      ? 'Begin with an accessible Higher question.'
      : 'Secure one Foundation method at a time.';

export function useTheme() {
  const system = useColorScheme();
  const { appearance, subject } = usePreferences();
  const isDark = appearance === 'dark' || (appearance === 'system' && system === 'dark');
  const colors = isDark ? dark : light;
  const base = subjectTokens[subject];
  const accent = isDark ? base.accentDark : base.accent;
  const tint = isDark ? base.tintDark : base.tint;
  const ink = isDark ? base.inkDark : base.ink;
  return { colors, subject: { ...base, accent, tint, ink }, isDark };
}

export function subjectTheme(subject: Subject, isDark: boolean) {
  const base = subjectTokens[subject];
  return { ...base, accent: isDark ? base.accentDark : base.accent, tint: isDark ? base.tintDark : base.tint, ink: isDark ? base.inkDark : base.ink };
}
