import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const ActionVisibility = createContext(true);
export function PageActionScope({active,children}:{active:boolean;children:ReactNode}) {
  const parent=useContext(ActionVisibility);
  return <ActionVisibility.Provider value={parent&&active}>{children}</ActionVisibility.Provider>;
}

/** Route actions share the same sidebar slot; contextual controls stay with their content. */
export function PageActions({children}:{children:ReactNode}) {
  const visible=useContext(ActionVisibility);
  const [slot,setSlot]=useState<HTMLElement|null>(null);
  useEffect(()=>{setSlot(document.getElementById('telisik-page-actions'));},[]);
  return slot&&visible?createPortal(children,slot):null;
}
