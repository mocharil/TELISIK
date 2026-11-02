"""Convert captured public AppView records to a small, attributed, read-only UI snapshot.
Input is an explicit capture file; this converter makes no network or AI calls.
"""
import argparse,json,re
from pathlib import Path

KEYWORDS=['jakarta','banjir','transjakarta','mrt']
TOPICS={'Transport':['transjakarta','mrt','commuter','transit','bus','toll','ojol'],'Flooding':['banjir','flood','hujan'],'Public services':['classroom','school','schools','planetarium'],'Environment':['green','waste','groundwater','subsidence'],'Other':[]}
def convert(raw):
    posts=[]
    keywords=raw['keywords']
    primary={p['uri'] for p in raw['primary']}
    for p in raw['primary']+raw['context']:
        r=p['record'];did=p['author']['did'];rkey=p['uri'].rsplit('/',1)[1];text=r.get('text','');words=text.split();excerpt=' '.join(words[:25])+(' …' if len(words)>25 else '')
        embed=r.get('embed',{}) or {};quoted=embed.get('record',{}) or {}
        if isinstance(quoted.get('record'),dict):quoted=quoted['record']
        links=[]
        for facet in r.get('facets',[]):
            for feature in facet.get('features',[]):
                if feature.get('uri','').startswith(('http://','https://')):links.append(feature['uri'])
        score={k:sum(term in text.casefold() for term in terms) for k,terms in TOPICS.items()};topic=max(score,key=score.get) if any(score.values()) else 'Other'
        posts.append(dict(uri=p['uri'],did=did,handle=p['author']['handle'],text=excerpt,created_at=r['createdAt'],collected_at=raw['captured_at'],langs=r.get('langs',[]),links=sorted(set(links)),topic=topic,origin='public-snapshot',url=f'https://bsky.app/profile/{did}/post/{rkey}',reply_to=r.get('reply',{}).get('parent',{}).get('uri'),quote_of=quoted.get('uri'),context_only=p['uri'] not in primary,matched_keywords=[k for k in keywords if re.search(r'\b'+re.escape(k)+r'\b',text,re.I)],excerpted=len(words)>25))
    assert len({p['uri'] for p in posts})==len(posts)
    assert all(p['did'].startswith('did:') and not p['did'].startswith('did:example:') for p in posts)
    return dict(metadata={k:raw[k] for k in ['source','captured_at','keywords','language_filter','seed_feeds','scope','thread_seeds']},posts=sorted(posts,key=lambda p:p['created_at'],reverse=True))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('capture',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
    value=convert(json.loads(args.capture.read_text()));args.output.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'posts':len(value['posts']),'primary':sum(not p['context_only'] for p in value['posts']),'context':sum(p['context_only'] for p in value['posts'])}))
