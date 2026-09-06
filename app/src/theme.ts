import { studioTokens } from './studio-tokens';
import { useColorScheme } from 'react-native';
import { usePreferences } from './providers';

export type Subject = 'maths' | 'maths-higher' | 'english';
export type Appearance = 'system' | 'light' | 'dark';

const { light, dark } = studioTokens;
export const subjectTokens = { maths:{ accent:'#625187', tint:'#eeebf5', label:'Maths Foundation' }, 'maths-higher':{ accent:'#176557', tint:'#e0eee7', label:'Maths Higher' }, english:{ accent:'#9b4936', tint:'#f6e9e1', label:'English Language' } } as const;
const darkSubjects = { maths:{...subjectTokens.maths,accent:'#cfbfea',tint:'#3b3452'}, 'maths-higher':{...subjectTokens['maths-higher'],accent:'#92d9bb',tint:'#254c40'},english:{...subjectTokens.english,accent:'#f1b9a4',tint:'#513c34'} };
export const recommendation = (subject: Subject) => subject === 'english' ? 'Read the source before timing your response.' : subject === 'maths-higher' ? 'Begin with an accessible Higher question.' : 'Secure one Foundation method at a time.';
export function useTheme() { const system = useColorScheme(); const { appearance, subject } = usePreferences(); const isDark = appearance === 'dark' || (appearance === 'system' && system === 'dark'); return { colors:isDark ? dark : light, subject:isDark ? darkSubjects[subject] : subjectTokens[subject], isDark }; }
