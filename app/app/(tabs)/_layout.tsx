import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useTheme } from '@/theme';
const icon=(label:string)=>{function TabIcon(p:{color:ColorValue}){return <Text style={{color:p.color,fontFamily:'monospace',fontSize:10,fontWeight:'800'}}>{label}</Text>}return TabIcon};
export default function TabLayout(){const {colors,subject}=useTheme();return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:subject.accent,tabBarInactiveTintColor:colors.quiet,tabBarStyle:{backgroundColor:colors.raised,borderTopColor:colors.ink,height:66},tabBarLabelStyle:{fontSize:12,fontWeight:'700'}}}><Tabs.Screen name="index" options={{title:'Today',tabBarIcon:icon('01')}}/><Tabs.Screen name="practice" options={{title:'Practice',tabBarIcon:icon('02')}}/><Tabs.Screen name="learn" options={{title:'Learn',tabBarIcon:icon('03')}}/><Tabs.Screen name="tutor" options={{title:'Tutor',tabBarIcon:icon('04')}}/></Tabs>}
