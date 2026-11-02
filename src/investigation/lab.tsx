import { useState } from 'react';
import NarrativeDNA from './narrative-dna';
import CoordinationFingerprint from './coordination-fingerprint';
import EvidenceReview from './evidence-review';
import ImpactReview from './impact-review';
import { EvidenceDrawer, LabChrome, type LabRoute } from './lab-ui';
export default function FeatureLab({view}:{view:LabRoute}) {
  const [evidence,setEvidence]=useState<string|null>(null);
  return <LabChrome active={view}>
    {view==='dna'&&<NarrativeDNA open={setEvidence}/>}
    {view==='fingerprint'&&<CoordinationFingerprint open={setEvidence}/>}
    {['review','hypotheses','ground-truth','blind-spots'].includes(view)&&<EvidenceReview initial={view==='review'?'ground-truth':view} open={setEvidence}/>}
    {view==='impact'&&<ImpactReview open={setEvidence}/>}
    <EvidenceDrawer id={evidence} close={()=>setEvidence(null)}/>
  </LabChrome>;
}
