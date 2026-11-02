import { useEffect, useRef } from 'react';
import { ArrowUpRight, BookOpenCheck, ChevronRight, Dna, Fingerprint, Network, Radar, ScanEye, ShieldCheck, Swords, X, type LucideIcon } from 'lucide-react';
import { actorById, clock, eventById } from './model';
import { shareEvents } from './case-analysis';
import { PageActions } from '../page-actions';
export { labRoutes, labTools, type LabRoute } from '../navigation';
import type { LabRoute } from '../navigation';
export function LabChrome({children}:{active:LabRoute;children:React.ReactNode}) {
  return <div className="investigation lf-shell"><main className="lf-main">{children}</main><footer className="lf-footer"><ShieldCheck size={14}/><span>Fictional case study. Every record and assessment remains inspectable.</span></footer></div>;
}
export function ToolHeading({eyebrow,title,accent,description,icon:Icon,children,actions}:{eyebrow:string;title:string;accent:string;description:string;icon:LucideIcon;children?:React.ReactNode;actions?:React.ReactNode}) {
  return <header className="lf-heading"><div><span className="lf-eyebrow"><Icon size={14}/>{eyebrow}</span><h1>{title} <em>{accent}</em></h1><p>{description}</p></div>{children}<PageActions>{actions}</PageActions></header>;
}
export function downloadMarkdown(name:string, content:string) {
  const link=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function EvidenceDrawer({id,close}:{id:string|null;close:()=>void}) {
  const dialog=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!id)return;const previous=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handler=(event:KeyboardEvent)=>{
      if(event.key==='Escape')close();
      if(event.key==='Tab'){
        const focusable=dialog.current?.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea');if(!focusable?.length)return;
        const first=focusable[0],last=focusable[focusable.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }
    };document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);previous?.focus();};
  },[id]);
  if(!id)return null;const post=eventById.get(id),share=shareEvents.find(e=>e.id===id),item=post||share,actor=item?actorById.get(item.actor):null;
  return <div className="lf-drawer-shade" onClick={close}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="lf-evidence-title" className="lf-evidence-drawer" onClick={e=>e.stopPropagation()}><header><span className="lf-eyebrow">SOURCE RECORD</span><button onClick={close} aria-label="Close source record"><X size={21}/></button></header><span className="lf-badge">Fictional {post?'network post':'supplemental URL share'}</span><h2 id="lf-evidence-title">{actor?.name||'Source unavailable'}</h2>{item&&<><p className="lf-muted">{actor?.handle} · Day 1, {clock(item.minute)}</p><blockquote>{item.text}</blockquote><dl><div><dt>Record ID</dt><dd>{id}</dd></div>{post&&<><div><dt>Interaction</dt><dd>{post.kind}</dd></div><div><dt>Parent record</dt><dd>{post.parent?<button className="lf-text-button" onClick={()=>{location.hash=`#/coordination/post/${post.parent}`;close();}}>{post.parent}<ArrowUpRight size={12}/></button>:'None (original post)'}</dd></div></>}{share&&<div><dt>Shared URL</dt><dd className="lf-url">{share.url}</dd></div>}</dl>{post?<a className="lf-button lf-primary" href={`#/coordination/post/${post.id}`} onClick={close}>Trace in interaction network<ArrowUpRight size={15}/></a>:<p className="lf-note">This supplemental share is not part of the network’s 637 post events. Example URLs are never fetched.</p>}</>}<p className="lf-note">Synthetic source ID for review. This is not an account or post from a real platform.</p></div></div>;
}
export function SourceButton({id,onOpen}:{id:string;onOpen:(id:string)=>void}) {return <button className="lf-source-button" onClick={()=>onOpen(id)}>{id}<ArrowUpRight size={12}/></button>;}
