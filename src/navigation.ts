import { Activity, Database, BookOpenCheck, Dna, Fingerprint, FolderKanban, Network, ScanEye, Swords, type LucideIcon } from 'lucide-react';
export const labRoutes = ['review','dna','fingerprint','hypotheses','ground-truth','blind-spots','impact'] as const;
export type LabRoute = typeof labRoutes[number];
export const labTools: {id:LabRoute|'coordination';label:string;short:string;icon:LucideIcon}[] = [
  {id:'coordination',label:'Interaction network',short:'Network',icon:Network},
  {id:'dna',label:'Narrative DNA',short:'Narrative',icon:Dna},
  {id:'fingerprint',label:'Coordination Fingerprint',short:'Coordination',icon:Fingerprint},
  {id:'hypotheses',label:'Hypothesis Arena',short:'Hypotheses',icon:Swords},
  {id:'ground-truth',label:'Ground Truth Lens',short:'Source review',icon:BookOpenCheck},
  {id:'blind-spots',label:'Blind Spot Explorer',short:'Blind Spots',icon:ScanEye},
  {id:'impact',label:'Impact Review',short:'Impact Review',icon:Activity},
];

export const sidebarGroups = [
  {label:'Projects & Data',items:[
    {id:'projects',label:'Topic Projects',icon:FolderKanban,routes:['projects']},
    {id:'data',label:'Data & sources',icon:Database,routes:['data','overview','posts','sources','briefs','simulation']},
  ]},
  {label:'Investigation',items:[
    {id:'coordination',label:'Network',icon:Network,routes:['coordination','collected']},
    {id:'dna',label:'Narrative',icon:Dna,routes:['dna']},
    {id:'fingerprint',label:'Coordination',icon:Fingerprint,routes:['fingerprint']},
    {id:'review',label:'Evidence review',icon:BookOpenCheck,routes:['review','hypotheses','ground-truth','blind-spots']},
  ]},
  {label:'Outcomes',items:[{id:'impact',label:'Impact review',icon:Activity,routes:['impact']}]},
];
export const sidebarItemForRoute = (route:string) => sidebarGroups.flatMap(group=>group.items).find(item=>item.routes.includes(route));
