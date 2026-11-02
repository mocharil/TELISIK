import type {Post,CollectionGraph,CollectionEdge} from './types';
export function collectionGraph(posts:Post[],mode='demo'):CollectionGraph {
  const byUri=new Map(posts.map(p=>[p.uri,p])),nodes=new Map<string,CollectionGraph['nodes'][number]>(),edges=new Map<string,CollectionEdge>();let unresolved=0;
  for(const p of posts){const n=nodes.get(p.did)||{id:p.did,label:p.handle,posts:0,references:0};n.posts++;nodes.set(p.did,n);}
  for(const post of posts)for(const [kind,uri] of [['reply',post.reply_to],['quote',post.quote_of]]){
    if(!uri)continue;const parent=byUri.get(uri);if(!parent){unresolved++;continue;}if(parent.did===post.did)continue;
    const id=`${parent.did}>${post.did}`,edge=edges.get(id)||{id,source:parent.did,target:post.did,weight:0,evidence:[]};edge.weight++;edge.evidence.push({kind:kind!,post,parent});edges.set(id,edge);nodes.get(parent.did)!.references++;
  }
  const connected=new Set([...edges.values()].flatMap(e=>[e.source,e.target]));
  return {mode,nodes:[...nodes.values()],edges:[...edges.values()],posts:posts.length,connected_accounts:connected.size,isolates:nodes.size-connected.size,unresolved,method:'Referenced author → replying or quoting author. Both posts must be in the current sample. No inferred links, reposts or audience estimates.'};
}
