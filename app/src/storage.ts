import * as SecureStore from 'expo-secure-store';

export type KeyValueStore = { getItemAsync(key:string):Promise<string|null>; setItemAsync(key:string,value:string):Promise<void>; deleteItemAsync(key:string):Promise<void> };
const CHUNK = 1800;
const manifest = (count:number) => `chunks:${count}`;
export function createChunkedStorage(store: KeyValueStore = SecureStore) {
  return {
    async getItem(key:string) { const head=await store.getItemAsync(key); if (!head?.startsWith('chunks:')) return head; const count=Number(head.slice(7)); if (!Number.isSafeInteger(count)||count<0) return null; const parts=await Promise.all(Array.from({length:count},(_,i)=>store.getItemAsync(`${key}.${i}`))); return parts.some(p=>p===null) ? null : parts.join(''); },
    async setItem(key:string,value:string) { await this.removeItem(key); const parts=value.match(new RegExp(`.{1,${CHUNK}}`,'gs')) ?? ['']; await Promise.all(parts.map((part,i)=>store.setItemAsync(`${key}.${i}`,part))); await store.setItemAsync(key,manifest(parts.length)); },
    async removeItem(key:string) { const head=await store.getItemAsync(key); if (head?.startsWith('chunks:')) { const count=Number(head.slice(7)); if(Number.isSafeInteger(count)) await Promise.all(Array.from({length:count},(_,i)=>store.deleteItemAsync(`${key}.${i}`))); } await store.deleteItemAsync(key); }
  };
}
export const secureStorage = createChunkedStorage();
