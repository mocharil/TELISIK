"""Only resolved explicit reply/quote references form edges. Matching text never does."""
def network(posts, mode):
    by_uri = {p['uri']: p for p in posts}
    nodes, edges, missing = {}, {}, 0
    for p in posts:
        nodes.setdefault(p['did'],dict(id=p['did'],label=p['handle'],posts=0,references=0))['posts'] += 1
    for child in posts:
        for kind, field in [('reply','reply_to'),('quote','quote_of')]:
            parent_uri = child.get(field)
            if not parent_uri:
                continue
            parent = by_uri.get(parent_uri)
            if not parent:
                missing += 1
                continue
            if parent['did'] == child['did']:
                continue
            key = (parent['did'],child['did'])
            if key not in edges:
                edges[key] = dict(id=f'{key[0]}>{key[1]}', source=key[0], target=key[1], weight=0, evidence=[])
            edges[key]['weight'] += 1
            edges[key]['evidence'].append(dict(kind=kind,post=child,parent=parent))
            nodes[parent['did']]['references'] += 1
    connected = {n for e in edges.values() for n in (e['source'],e['target'])}
    return dict(mode=mode,nodes=list(nodes.values()),edges=list(edges.values()),posts=len(posts),
                connected_accounts=len(connected),isolates=len(nodes)-len(connected),unresolved=missing,
                method='Referenced author → replying or quoting author. Both posts must be in the current sample. No inferred links, reposts or audience estimates.')
