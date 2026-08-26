import { recommendation, subjectTokens } from '../theme';
test('keeps course recommendations and accents distinct',()=>{expect(new Set(Object.values(subjectTokens).map(v=>v.accent)).size).toBe(3);expect(recommendation('maths-higher')).toContain('Higher')});
