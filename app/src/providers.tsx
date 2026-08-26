import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { supabase } from './supabase';
import type { Appearance, Subject } from './theme';

type Prefs={subject:Subject;appearance:Appearance;hydrated:boolean;setSubject:(v:Subject)=>void;setAppearance:(v:Appearance)=>void};
const PreferencesContext=createContext<Prefs|null>(null);
const NetworkContext=createContext({online:false,hydrated:false});
const AuthContext=createContext<{session:Session|null;loading:boolean}>({session:null,loading:true});
const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:60_000,gcTime:24*60*60*1000,retry:1,networkMode:'offlineFirst'}}});
export const usePreferences=()=>{const value=useContext(PreferencesContext);if(!value)throw new Error('Missing PreferencesProvider');return value};
export const useNetwork=()=>useContext(NetworkContext);
export const useAuth=()=>useContext(AuthContext);

function PreferencesProvider({children}:PropsWithChildren){const [subject,setSubjectState]=useState<Subject>('maths');const [appearance,setAppearanceState]=useState<Appearance>('system');const [hydrated,setHydrated]=useState(false);useEffect(()=>{AsyncStorage.multiGet(['subject','appearance']).then(v=>{const s=v[0][1] as Subject|null;const a=v[1][1] as Appearance|null;if(s&&['maths','maths-higher','english'].includes(s))setSubjectState(s);if(a&&['system','light','dark'].includes(a))setAppearanceState(a)}).catch(()=>undefined).finally(()=>setHydrated(true))},[]);const setSubject=(v:Subject)=>{setSubjectState(v);void AsyncStorage.setItem('subject',v)};const setAppearance=(v:Appearance)=>{setAppearanceState(v);void AsyncStorage.setItem('appearance',v)};return <PreferencesContext.Provider value={{subject,appearance,hydrated,setSubject,setAppearance}}>{children}</PreferencesContext.Provider>}
export function networkIsOnline(state:{isConnected?:boolean|null;isInternetReachable?:boolean|null}){return state.isConnected===true&&state.isInternetReachable!==false}
function NetworkProvider({children}:PropsWithChildren){const [status,setStatus]=useState({online:false,hydrated:false});useEffect(()=>{let active=true;let listenerSeen=false;const update=(state:Network.NetworkState)=>{const online=networkIsOnline(state);onlineManager.setOnline(online);if(active)setStatus({online,hydrated:true})};onlineManager.setOnline(false);const sub=Network.addNetworkStateListener(state=>{listenerSeen=true;update(state)});void Network.getNetworkStateAsync().then(state=>{if(!listenerSeen)update(state)}).catch(()=>{if(!listenerSeen){onlineManager.setOnline(false);if(active)setStatus({online:false,hydrated:true})}});return()=>{active=false;sub.remove()}},[]);return <NetworkContext.Provider value={status}>{children}</NetworkContext.Provider>}
function AuthProvider({children}:PropsWithChildren){const [session,setSession]=useState<Session|null>(null);const [loading,setLoading]=useState(Boolean(supabase));useEffect(()=>{const client=supabase;if(!client)return;void client.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const {data}=client.auth.onAuthStateChange((_event,next)=>{setSession(next);setLoading(false)});const app=AppState.addEventListener('change',state=>{if(state==='active')client.auth.startAutoRefresh();else client.auth.stopAutoRefresh()});return()=>{data.subscription.unsubscribe();app.remove()}},[]);return <AuthContext.Provider value={{session,loading}}>{children}</AuthContext.Provider>}
export function AppProviders({children}:PropsWithChildren){return <PreferencesProvider><NetworkProvider><QueryClientProvider client={queryClient}><AuthProvider>{children}</AuthProvider></QueryClientProvider></NetworkProvider></PreferencesProvider>}
