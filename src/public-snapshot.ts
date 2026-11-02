import capture from './data/public-snapshot.json';
import type {Overview,Post,Sources} from './types';
export const snapshotMetadata=capture.metadata;
export const publicPosts=capture.posts as Post[];
export const snapshotCounts={primary:publicPosts.filter(p=>!p.context_only).length,context:publicPosts.filter(p=>p.context_only).length,authors:new Set(publicPosts.map(p=>p.did)).size};
export const capturedLabel=new Date(snapshotMetadata.captured_at).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'})+' WIB';
export const publicSources:Sources={mode:'snapshot',settings:{keywords:snapshotMetadata.keywords,languages:[],retention_days:7},collector:{running:false,connected:false,received:0,accepted:0,deleted:0,reconnects:0,last_event:null,error:null},endpoint:'https://public.api.bsky.app',live_posts:0,gemini_configured:false,cursor:null,limit:publicPosts.length};
export function publicOverview():Overview{
 const topics=new Map<string,number>(),months=new Map<string,number>();
 for(const p of publicPosts){topics.set(p.topic,(topics.get(p.topic)||0)+1);const d=new Date(p.created_at);const key=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);months.set(new Date(key).toISOString(),(months.get(new Date(key).toISOString())||0)+1);}
 const first=new Date(Math.min(...publicPosts.map(p=>Date.parse(p.created_at)))),last=new Date(Math.max(...publicPosts.map(p=>Date.parse(p.created_at))));
 const series=[];const month=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),1));
 while(month<=last){const time=month.toISOString();series.push({time,posts:months.get(time)||0});month.setUTCMonth(month.getUTCMonth()+1);}
 return {posts:publicPosts.length,authors:snapshotCounts.authors,topics:topics.size,clusters:0,series,topic_counts:[...topics].map(([topic,count])=>({topic,count})).sort((a,b)=>b.count-a.count),latest:publicPosts.slice(0,4),coverage:'Selected public feeds and linked conversation context only. This is not a representative sample of Jakarta or the whole Bluesky network.',range_start:first.toISOString(),range_end:last.toISOString(),mode:'snapshot',context_posts:snapshotCounts.context,series_unit:'month'};
}
