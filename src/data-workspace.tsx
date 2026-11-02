import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { ToolHeading } from './investigation/lab-ui';
import { FocusPanel, FocusPanels } from './investigation/focus-panels';
import Workspace from './workspace';
import { ActiveProjectBanner, TopicProjectsPage } from './topic-projects';

export default function DataWorkspace({view}:{view:string}) {
  const initialTab = view==='posts'||view==='briefs'?view:'overview';
  const [active,setActive]=useState(initialTab);
  useEffect(()=>{
    if(view!=='projects'){
      setActive(view==='posts'||view==='briefs'?view:'overview');
    }
  },[view]);

  if(view==='projects'){
    return <TopicProjectsPage/>;
  }

  return <div className="investigation lf-shell"><main className="lf-main">
    <ToolHeading
      eyebrow="DATA & SOURCES · PROJECT EVIDENCE WORKBENCH"
      title="Data & Sumber Bukti."
      accent="Tersaring sesuai project topik aktif."
      description="Telusuri distribusi topik, cari post asli, atau susun laporan AI Brief berbasis sitasi untuk project yang sedang dibuka."
      icon={Database}
    />
    <ActiveProjectBanner/>
    <div className="data-workbench"><FocusPanels label="Data workspace" active={active} onChange={setActive}>
      <FocusPanel id="overview" label="1. Ringkasan & Tren"><Workspace view="overview" active={active==='overview'} embedded/></FocusPanel>
      <FocusPanel id="posts" label="2. Daftar Post Bukti"><Workspace view="posts" active={active==='posts'} embedded/></FocusPanel>
      <FocusPanel id="briefs" label="3. Laporan AI Brief"><Workspace view="briefs" active={active==='briefs'} embedded/></FocusPanel>
    </FocusPanels></div>
  </main></div>;
}
