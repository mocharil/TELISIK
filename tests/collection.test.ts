import assert from 'node:assert/strict';
import { collectionGraph } from '../src/collection-model';
import type { Post } from '../src/types';
const base:Post={uri:'at://did:example:a/app.bsky.feed.post/a',did:'did:example:a',handle:'a.example',text:'Same identical wording is not an interaction.',created_at:'2026-01-01T00:00:00Z',collected_at:'2026-01-01T00:00:00Z',langs:['id'],links:[],topic:'Other',origin:'synthetic',url:null,reply_to:null,quote_of:null};
const reply={...base,uri:'at://did:example:b/app.bsky.feed.post/b',did:'did:example:b',handle:'b.example'};
assert.equal(collectionGraph([base,reply]).edges.length,0);
reply.reply_to=base.uri;
const g=collectionGraph([base,reply]);assert.equal(g.edges.length,1);assert.equal(g.connected_accounts,2);assert.equal(g.edges[0].source,base.did);assert.equal(g.edges[0].evidence[0].post.uri,reply.uri);
assert.equal(collectionGraph([reply]).unresolved,1);assert.equal(collectionGraph([reply]).edges.length,0);
assert.equal(collectionGraph([]).isolates,0);console.log('Collection graph checks passed.');
import { requestApi } from '../src/runtime';
async function checkFailure(){
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>{throw new TypeError('Network unavailable');};
 try {await assert.rejects(()=>requestApi('posts'),/Sample data has not been substituted/);}
 finally {globalThis.fetch=previous;}
 console.log('API failure does not substitute sample data.');
}
checkFailure().catch(error=>{console.error(error);process.exitCode=1;});
