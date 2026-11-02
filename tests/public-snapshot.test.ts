import assert from 'node:assert/strict';
import {publicPosts,publicOverview,publicSources,snapshotCounts,snapshotMetadata} from '../src/public-snapshot';
import {collectionGraph} from '../src/collection-model';
import {api} from '../src/demo';
const byUri=new Map(publicPosts.map(p=>[p.uri,p]));
assert.equal(byUri.size,publicPosts.length);
assert.equal(snapshotCounts.primary+snapshotCounts.context,publicPosts.length);
assert.equal(snapshotCounts.primary,23);assert.equal(snapshotCounts.context,5);
for(const p of publicPosts){
 assert(!p.did.startsWith('did:example:'));
 assert.equal(p.origin,'public-snapshot');
 assert.equal(p.url,`https://bsky.app/profile/${p.did}/post/${p.uri.split('/').at(-1)}`);
 assert(Number.isFinite(Date.parse(p.created_at))&&Date.parse(p.created_at)<=Date.parse(p.collected_at));
 assert(p.text.replace(/\s…$/,'').split(/\s+/).length<=25);
 if(!p.context_only)assert(p.matched_keywords!.length>0);
 else assert(p.reply_to&&byUri.has(p.reply_to));
}
const g=collectionGraph(publicPosts,'snapshot');assert.equal(g.edges.length,5);assert.equal(g.nodes.length,7);assert.equal(g.isolates,3);
for(const e of g.edges)for(const evidence of e.evidence){assert.equal(evidence.post.reply_to||evidence.post.quote_of,evidence.parent.uri);assert.equal(e.source,evidence.parent.did);assert.equal(e.target,evidence.post.did);}
const o=publicOverview();assert.equal(o.series.reduce((n,b)=>n+b.posts,0),o.posts);assert.equal(o.topic_counts.reduce((n,t)=>n+t.count,0),o.posts);assert.equal(o.mode,'snapshot');assert.equal(publicSources.collector.running,false);assert(snapshotMetadata.seed_feeds.length===4);
async function checkAdapter(){
 const result=await api<{items:typeof publicPosts;total:number}>('posts?limit=100');assert.equal(result.total,28);assert(result.items.every(p=>p.origin==='public-snapshot'));
 assert.equal((await api<typeof publicSources>('sources')).mode,'snapshot');
 await assert.rejects(()=>api('sources/settings','PUT',{}),/read-only/);
 console.log('Snapshot provenance, source links, excerpts, graph evidence, totals and read-only adapter checks passed.');
}
checkAdapter().catch(e=>{console.error(e);process.exitCode=1;});
