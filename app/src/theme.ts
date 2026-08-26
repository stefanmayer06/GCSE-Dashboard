import { useColorScheme } from 'react-native';
import { usePreferences } from './providers';

export type Subject = 'maths' | 'maths-higher' | 'english';
export type Appearance = 'system' | 'light' | 'dark';

const light = { paper:'#f3f0e8', raised:'#fbfaf6', muted:'#e9e6dc', ink:'#161713', quiet:'#65675f', line:'#cbc8bd', strong:'#8d8e85', positive:'#237b55', positiveWash:'#dcebe3', warning:'#98670f', warningWash:'#f0e5c5', negative:'#a33d3d', negativeWash:'#f1dddd', info:'#38678c', infoWash:'#dfe9f1' };
const dark = { paper:'#16140f', raised:'#1d1a14', muted:'#262119', ink:'#ece6df', quiet:'#a79e8e', line:'#2e2921', strong:'#5f574c', positive:'#55c193', positiveWash:'#203c31', warning:'#d9a441', warningWash:'#3c321f', negative:'#e2685f', negativeWash:'#402321', info:'#6fa8d8', infoWash:'#213343' };
export const subjectTokens = { maths:{ accent:'#6d55a5', tint:'#e6dff2', label:'Maths Foundation' }, 'maths-higher':{ accent:'#287451', tint:'#dcebe3', label:'Maths Higher' }, english:{ accent:'#a66c16', tint:'#f0e5c5', label:'English Language' } } as const;
export const recommendation = (subject: Subject) => subject === 'english' ? 'Read the source before timing your response.' : subject === 'maths-higher' ? 'Begin with an accessible Higher question.' : 'Secure one Foundation method at a time.';
export function useTheme() { const system = useColorScheme(); const { appearance, subject } = usePreferences(); const isDark = appearance === 'dark' || (appearance === 'system' && system === 'dark'); return { colors:isDark ? dark : light, subject:subjectTokens[subject], isDark }; }
