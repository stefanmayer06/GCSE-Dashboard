import { useColorScheme } from 'react-native';
import { usePreferences } from './providers';

export type Subject = 'maths' | 'maths-higher' | 'english';
export type Appearance = 'system' | 'light' | 'dark';

const light = { paper:'#f5f3ed', raised:'#fffefa', muted:'#ebe8df', ink:'#171813', quiet:'#66685f', line:'#d8d4c9', strong:'#aaa69b', positive:'#237b55', positiveWash:'#e0f0e7', warning:'#98670f', warningWash:'#f6eac8', negative:'#a33d3d', negativeWash:'#f5e1df', info:'#38678c', infoWash:'#e2edf5' };
const dark = { paper:'#15140f', raised:'#211f18', muted:'#2a271f', ink:'#f1ece4', quiet:'#aaa293', line:'#37332a', strong:'#686055', positive:'#55c193', positiveWash:'#203c31', warning:'#e0ac4c', warningWash:'#3c321f', negative:'#e8756c', negativeWash:'#402321', info:'#78adde', infoWash:'#213343' };
export const subjectTokens = { maths:{ accent:'#6c50d9', tint:'#ebe6ff', label:'Maths Foundation' }, 'maths-higher':{ accent:'#21805a', tint:'#dff3e9', label:'Maths Higher' }, english:{ accent:'#b86612', tint:'#fae8cf', label:'English Language' } } as const;
export const recommendation = (subject: Subject) => subject === 'english' ? 'Read the source before timing your response.' : subject === 'maths-higher' ? 'Begin with an accessible Higher question.' : 'Secure one Foundation method at a time.';
export function useTheme() { const system = useColorScheme(); const { appearance, subject } = usePreferences(); const isDark = appearance === 'dark' || (appearance === 'system' && system === 'dark'); return { colors:isDark ? dark : light, subject:subjectTokens[subject], isDark }; }
