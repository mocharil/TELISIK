import json,re,urllib.request,urllib.parse,concurrent.futures
from pathlib import Path
from datetime import datetime,timezone
import argparse
parser=argparse.ArgumentParser(description='Capture a bounded public-feed snapshot. No login or AI required.');parser.add_argument('--output',type=Path,default=Path('data/snapshot-raw.json'));args=parser.parse_args();OUT=args.output.parent;OUT.mkdir(parents=True,exist_ok=True)
KEYWORDS=['jakarta','banjir','transjakarta','mrt'];ACCOUNTS=['jakpost.bsky.social','kumparan-poster.bsky.social','antara-poster.bsky.social','nurapixel.bsky.social']
def get(method,params):
 url='https://public.api.bsky.app/xrpc/'+method+'?'+urllib.parse.urlencode(params,doseq=True)
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'TELISIK-public-evidence-preview/1.0'}),timeout=20) as r:return json.load(r)
def feed(actor):
 try:
  d=get('app.bsky.feed.getAuthorFeed',{'actor':actor,'limit':100,'filter':'posts_with_replies'})
  # Raw responses are kept only in the explicit output, not in the web app.
  items=[f['post'] for f in d.get('feed',[]) if re.search(r'\b(?:jakarta|banjir|transjakarta|mrt)\b',f['post'].get('record',{}).get('text',''),re.I) and not f['post'].get('labels')]
  print(json.dumps({'account':actor,'scanned':len(d.get('feed',[])),'keyword_matches':len(items)}),flush=True)
  return items,{'account':actor,'scanned':len(d.get('feed',[])),'matches':len(items)}
 except Exception as e:
  print(actor,type(e).__name__,str(e)[:100],flush=True);return [],{'account':actor,'error':type(e).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(feed,ACCOUNTS))
primary={p['uri']:p for items,_ in results for p in items};primary=dict(sorted(primary.items(),key=lambda kv:kv[1]['record'].get('createdAt',''),reverse=True)[:70]);context={};thread_sources=[]
def walk(node):
 if not isinstance(node,dict):return
 p=node.get('post')
 if p and p['uri'] not in primary and not p.get('labels'):context[p['uri']]=p
 if node.get('parent'):walk(node['parent'])
 for child in node.get('replies',[]):walk(child)
seeds=sorted(primary.values(),key=lambda p:p.get('replyCount',0)+p.get('quoteCount',0),reverse=True)[:4]
for post in seeds:
 if not post.get('replyCount') and not post.get('record',{}).get('reply'):continue
 try:
  d=get('app.bsky.feed.getPostThread',{'uri':post['uri'],'depth':2,'parentHeight':2});walk(d.get('thread',{}));thread_sources.append(post['uri'])
  print(json.dumps({'thread':post['uri'],'context_posts':len(context)}),flush=True)
 except Exception as e:print('thread',type(e).__name__,str(e)[:80],flush=True)
refs=set()
for p in primary.values():
 r=p.get('record',{});reply=r.get('reply',{}) or {};embed=r.get('embed',{}) or {};quoted=embed.get('record',{}) or {}
 if isinstance(quoted.get('record'),dict):quoted=quoted['record']
 refs.update(u for u in [reply.get('parent',{}).get('uri'),quoted.get('uri')] if u and u not in primary and u not in context)
for offset in range(0,len(refs),25):
 try:
  d=get('app.bsky.feed.getPosts',{'uris':list(refs)[offset:offset+25]})
  for p in d.get('posts',[]):
   if not p.get('labels'):context[p['uri']]=p
 except Exception as e:print('parents',type(e).__name__,str(e)[:80],flush=True)
result={'source':'Bluesky public AppView API','captured_at':datetime.now(timezone.utc).isoformat(),'keywords':KEYWORDS,'language_filter':[],'seed_feeds':[m for _,m in results],'scope':'One page (up to 100 items) from each listed public feed, keyword-matched posts, plus explicitly linked thread context. Not a network-wide search or representative Jakarta sample.','primary':list(primary.values()),'context':list(context.values()),'thread_seeds':thread_sources}
args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({'complete':True,'primary':len(primary),'context':len(context)}),flush=True)
