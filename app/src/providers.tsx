import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { ApiClient } from './api';
import { supabase } from './supabase';
import type { Appearance, Subject } from './theme';
import { defaultPlanningPreferences, type PlanningPreferences } from './planning';
import { hydratePersonal } from './personal';
import { queryKeys } from './query-cache';

type Prefs={subject:Subject;appearance:Appearance;planning:PlanningPreferences;hydrated:boolean;setSubject:(v:Subject)=>void;setAppearance:(v:Appearance)=>void;setPlanning:(v:PlanningPreferences)=>void};
const PreferencesContext=createContext<Prefs|null>(null);
const NetworkContext=createContext({online:false,hydrated:false});
const AuthContext=createContext<{session:Session|null;loading:boolean}>({session:null,loading:true});
const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:60_000,gcTime:24*60*60*1000,retry:1,networkMode:'offlineFirst'}}});
let queryIdentity: string | null | undefined;
export const usePreferences=()=>{const value=useContext(PreferencesContext);if(!value)throw new Error('Missing PreferencesProvider');return value};
export const useNetwork=()=>useContext(NetworkContext);
export const useAuth=()=>useContext(AuthContext);

function PreferencesProvider({children}:PropsWithChildren){const auth=useContext(AuthContext);const userId=auth.session?.user.id;const [subject,setSubjectState]=useState<Subject>('maths');const [appearance,setAppearanceState]=useState<Appearance>('system');const [planning,setPlanningState]=useState(defaultPlanningPreferences);const [hydrated,setHydrated]=useState(false);useEffect(()=>{AsyncStorage.multiGet(['subject','appearance']).then(v=>{const s=v[0][1] as Subject|null;const a=v[1][1] as Appearance|null;if(s&&['maths','maths-higher','english'].includes(s))setSubjectState(s);if(a&&['system','light','dark'].includes(a))setAppearanceState(a)}).catch(()=>undefined).finally(()=>setHydrated(true))},[]);useEffect(()=>{let active=true;if(!userId){
// Resetting preferences mirrors external account hydration when signed out.
// eslint-disable-next-line react-hooks/set-state-in-effect
if(active)setPlanningState(defaultPlanningPreferences);return};const client=new ApiClient(subject);queryClient.fetchQuery({queryKey:queryKeys.personal(subject,userId),queryFn:()=>hydratePersonal(client,userId,subject)}).then(value=>{if(active)setPlanningState(value.preferences??defaultPlanningPreferences)}).catch(()=>{if(active)setPlanningState(defaultPlanningPreferences)});return()=>{active=false}},[subject,userId]);const setSubject=(v:Subject)=>{setSubjectState(v);void AsyncStorage.setItem('subject',v)};const setAppearance=(v:Appearance)=>{setAppearanceState(v);void AsyncStorage.setItem('appearance',v)};const setPlanning=(v:PlanningPreferences)=>{setPlanningState(v);if(userId)new ApiClient(subject).savePreferences(v).catch(()=>undefined)};return <PreferencesContext.Provider value={{subject,appearance,planning,hydrated,setSubject,setAppearance,setPlanning}}>{children}</PreferencesContext.Provider>}
export function networkIsOnline(state:{isConnected?:boolean|null;isInternetReachable?:boolean|null}){return state.isConnected===true&&state.isInternetReachable!==false}
function NetworkProvider({children}:PropsWithChildren){const [status,setStatus]=useState({online:false,hydrated:false});useEffect(()=>{let active=true;let listenerSeen=false;const update=(state:Network.NetworkState)=>{const online=networkIsOnline(state);onlineManager.setOnline(online);if(active)setStatus({online,hydrated:true})};onlineManager.setOnline(false);const sub=Network.addNetworkStateListener(state=>{listenerSeen=true;update(state)});void Network.getNetworkStateAsync().then(state=>{if(!listenerSeen)update(state)}).catch(()=>{if(!listenerSeen){onlineManager.setOnline(false);if(active)setStatus({online:false,hydrated:true})}});return()=>{active=false;sub.remove()}},[]);return <NetworkContext.Provider value={status}>{children}</NetworkContext.Provider>}

type AuthPublisher = (session: Session | null, event: AuthChangeEvent | 'BOOTSTRAP') => void;

export function updateAuthIdentity(
  previous: string | null | undefined,
  session: Session | null,
  event: AuthChangeEvent | 'BOOTSTRAP',
  clearCache: () => void,
) {
  const next = session?.user.id ?? null;
  if (event === 'SIGNED_OUT' || (previous !== undefined && previous !== next)) clearCache();
  return next;
}

function isConfirmedAuthRejection(error: unknown) {
  if (!error || typeof error !== 'object' || !('status' in error)) return false;
  const status = (error as { status?: unknown }).status;
  return status === 400 || status === 401 || status === 403;
}

function withTimeout<T>(operation: PromiseLike<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Auth startup timed out')), timeoutMs);
    Promise.resolve(operation).then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export function startAuthSession(client: SupabaseClient, publish: AuthPublisher, timeoutMs = 10_000) {
  let active = true;
  let revision = 0;
  let suppressLocalSignOut = false;
  const { data } = client.auth.onAuthStateChange((event, next) => {
    if (!active || event === 'INITIAL_SESSION') return;
    revision += 1;
    if (event === 'SIGNED_OUT' && suppressLocalSignOut) {
      suppressLocalSignOut = false;
      return;
    }
    publish(next, event);
  });

  const bootstrap = async () => {
    const startedAt = revision;
    const deadline = Date.now() + timeoutMs;
    try {
      const { data: sessionData, error: sessionError } = await withTimeout(client.auth.getSession(), timeoutMs);
      if (sessionError) throw sessionError;
      if (!active || revision !== startedAt) return;
      if (!sessionData.session) {
        publish(null, 'BOOTSTRAP');
        return;
      }

      const remaining = Math.max(0, deadline - Date.now());
      const { data: userData, error: userError } = await withTimeout(
        client.auth.getUser(sessionData.session.access_token),
        remaining,
      );
      if (!active || revision !== startedAt) return;
      if (!userData.user && (!userError || isConfirmedAuthRejection(userError))) {
        publish(null, 'SIGNED_OUT');
        suppressLocalSignOut = true;
        try {
          await client.auth.signOut({ scope: 'local' });
        } catch {
          // The revoked session is already unpublished; local sign-out is best effort.
        } finally {
          suppressLocalSignOut = false;
        }
        return;
      }
      if (userError) throw userError;
      publish(sessionData.session, 'BOOTSTRAP');
    } catch {
      if (active && revision === startedAt) publish(null, 'BOOTSTRAP');
    }
  };

  void bootstrap();
  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}

function AuthProvider({children}:PropsWithChildren){
  const [session,setSession]=useState<Session|null>(null);
  const [loading,setLoading]=useState(Boolean(supabase));
  useEffect(()=>{
    const client=supabase;
    if(!client)return;
    const stopAuth=startAuthSession(client,(next,event)=>{
      queryIdentity=updateAuthIdentity(queryIdentity,next,event,()=>queryClient.clear());
      setSession(next);
      setLoading(false);
    });
    const app=AppState.addEventListener('change',state=>{if(state==='active')client.auth.startAutoRefresh();else client.auth.stopAutoRefresh()});
    return()=>{stopAuth();app.remove()}
  },[]);
  return <AuthContext.Provider value={{session,loading}}>{children}</AuthContext.Provider>
}
export function AppProviders({children}:PropsWithChildren){return <QueryClientProvider client={queryClient}><AuthProvider><PreferencesProvider><NetworkProvider>{children}</NetworkProvider></PreferencesProvider></AuthProvider></QueryClientProvider>}
