import { supabase } from './supabase';
import type { Subject } from './theme';

export function normalizeBaseUrl(value:string|undefined){ const raw=(value??'').trim().replace(/\/+$/,''); if(!raw) throw new Error('EXPO_PUBLIC_API_URL is not configured.'); if(!/^https?:\/\//i.test(raw)) throw new Error('EXPO_PUBLIC_API_URL must be an absolute HTTP(S) URL.'); return raw; }
export class ApiError extends Error { constructor(message:string, public status:number, public code?:string){ super(message); this.name='ApiError'; } }
export async function errorFromResponse(response:Pick<Response,'status'|'json'>){ const body=await response.json().catch(()=>({})) as {error?:string;code?:string}; return new ApiError(body.error||`Request failed (${response.status})`,response.status,body.code); }
export type Json = null|boolean|number|string|Json[]|{[key:string]:Json};
export interface Topic { id:string; name?:string; title?:string; description?:string; progress?:number; accuracy?:number; [key:string]:unknown }
export interface Question { id?:string; qid?:string; prompt?:string; question?:string; marks?:number; options?:unknown[]; solution?:unknown; [key:string]:unknown }
export interface SessionResult { id?:string; sessionId?:string; roundId?:string; questions?:Question[]; [key:string]:unknown }
export interface Progress { xp?:number; streak?:number; grade?:number|string; topics?:Record<string,unknown>; history?:unknown[]; [key:string]:unknown }
export interface ApiOptions { signal?:AbortSignal; timeoutMs?:number }
type Method='GET'|'POST'|'DELETE';
const AUTH_TIMEOUT_MS=15000;
async function authFetch(url:string,init:RequestInit,request:typeof fetch=fetch){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),AUTH_TIMEOUT_MS);try{return await request(url,{...init,signal:controller.signal})}catch(error){if(controller.signal.aborted)throw new Error('The request timed out. Check your connection and try again.');throw error}finally{clearTimeout(timer)}}
async function clearLocalSession(){await supabase?.auth.signOut({scope:'local'}).catch(()=>undefined)}
export class ApiClient {
  constructor(private subject:Subject, private getSession=()=>supabase?.auth.getSession()){}
  private async request<T>(path:string,method:Method='GET',body?:unknown,options:ApiOptions={},retried=false):Promise<T>{ const base=normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL); const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),options.timeoutMs??15000); const abort=()=>controller.abort(); options.signal?.addEventListener('abort',abort,{once:true}); try { const session=(await this.getSession())?.data.session; const response=await fetch(`${base}/api/${this.subject}${path}`,{method,signal:controller.signal,headers:{Accept:'application/json','Content-Type':'application/json',...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}); if(response.status===401&&supabase){ if(!retried){const refreshed=await supabase.auth.refreshSession().catch(()=>null);if(refreshed?.data.session)return this.request(path,method,body,options,true)}await clearLocalSession()} if(!response.ok) throw await errorFromResponse(response); return await response.json() as T; } finally { clearTimeout(timer); options.signal?.removeEventListener('abort',abort); } }
  health=()=>this.request<Json>('/health'); topics=()=>this.request<Topic[]>('/topics'); topic=(id:string)=>this.request<Topic>(`/topics/${encodeURIComponent(id)}`); papers=()=>this.request<Json>('/papers'); newTest=(type:string,paper=1)=>this.request<SessionResult>('/test/new','POST',{type,paper}); testStatus=(id:string)=>this.request<SessionResult>(`/test/${encodeURIComponent(id)}/status`); discardTest=(id:string)=>this.request<Json>(`/test/${encodeURIComponent(id)}`,'DELETE'); submitTest=(id:string,answers:unknown,durationSec:number)=>this.request<Json>(`/test/${encodeURIComponent(id)}/submit`,'POST',{answers,durationSec}); practice=(topicId:string,count=this.subject==='english'?3:8)=>this.request<SessionResult>('/practice','POST',{topicId,count}); check=(qid:string,value:unknown,sessionId?:string)=>this.request<Json>('/check','POST',this.subject==='english'?{sessionId,qid,value}:{qid,value}); practiceSubmit=(sessionId:string,answers:unknown,extra?:unknown)=>this.request<Json>('/practice/submit','POST',this.subject==='english'?{sessionId,answers,aiResults:extra}:{sessionId,topicId:extra,answers}); adhoc=(count:number,kinds:string[])=>this.request<SessionResult>('/adhoc','POST',this.subject==='english'?{count,kinds}:{count,papers:kinds}); adhocSubmit=(sessionId:string,answers:unknown,aiResults?:unknown)=>this.request<Json>('/adhoc/submit','POST',this.subject==='english'?{sessionId,answers,aiResults}:{roundId:sessionId,answers}); progress=()=>this.request<Progress>('/progress'); chat=(messages:unknown[])=>this.request<Json>('/chat','POST',{messages}); clearChat=()=>this.request<Json>('/chat','DELETE'); chatHistory=()=>this.request<Json>('/chat/history'); texts=()=>this.request<Json>('/texts'); text=(id:string)=>this.request<Json>(`/texts/${encodeURIComponent(id)}`); mark=(sessionId:string,qid:string,answer:string)=>this.request<Json>('/mark','POST',{sessionId,qid,answer});
}
export const authRequest=async<T>(path:string,body?:unknown,token?:string)=>{ const response=await authFetch(`${normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL)}/api/auth${path}`,{method:body?'POST':'GET',headers:{Accept:'application/json','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}); if(!response.ok) throw await errorFromResponse(response); return response.json() as Promise<T>; };

export interface DeleteAccountResponse { success?:boolean }
export async function deleteAccount(token:string, confirmation='DELETE', request:typeof fetch=fetch){
  if(!token) throw new Error('Your session has expired. Sign in again before deleting your account.');
  const response=await authFetch(`${normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL)}/api/auth/account`,{
    method:'DELETE',
    headers:{Accept:'application/json','Content-Type':'application/json',Authorization:`Bearer ${token}`},
    body:JSON.stringify({confirmation}),
  },request);
  if(!response.ok) throw await errorFromResponse(response);
  return response.json() as Promise<DeleteAccountResponse>;
}
