/** Explicit build-time switch. A backend failure never silently falls back to sample data. */
export const LOCAL_API = (import.meta as ImportMeta & {env:Record<string,string>}).env?.VITE_USE_LOCAL_API === 'true';
export async function requestApi<T>(path:string,method='GET',body?:unknown):Promise<T> {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35000);
  try {
    const response=await fetch(`/api/${path}`,{method,signal:controller.signal,headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
    if(!response.ok){const problem=await response.json().catch(()=>({}));throw new Error(typeof problem.detail==='string'?problem.detail:`Backend returned ${response.status}.`);}
    return await response.json() as T;
  } catch(error) {
    if(error instanceof DOMException&&error.name==='AbortError')throw new Error('Local API timed out. Check the backend and retry.');
    if(error instanceof TypeError)throw new Error('Local API is unavailable. Start the backend on port 8000. Sample data has not been substituted.');
    throw error;
  } finally {clearTimeout(timer);}
}
