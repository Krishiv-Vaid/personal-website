from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
ROOT=Path(__file__).resolve().parents[1]
errors=[]
class Check(HTMLParser):
 def __init__(self,path): super().__init__(); self.path=path; self.h1=0; self.ids=set(); self.refs=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1': self.h1+=1
  if 'id' in a:
   if a['id'] in self.ids: errors.append(f'{self.path}: duplicate id {a["id"]}')
   self.ids.add(a['id'])
  if tag=='meta' and a.get('property') == 'og:image':
   image = ROOT / urlsplit(a['content']).path.lstrip('/')
   if not image.is_file(): errors.append(f'{self.path}: missing social image')
  if tag=='img' and 'alt' not in a: errors.append(f'{self.path}: missing alt')
  for key in ['href','src']:
   if key not in a: continue
   u=urlsplit(a[key])
   if u.netloc == 'krishvaid.me': u = urlsplit(u.path)
   elif u.scheme or u.netloc: continue
   target=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else self.path.parent/unquote(u.path)
   if not u.path: target=self.path
   if target.is_dir(): target=target/'index.html'
   if not target.exists(): errors.append(f'{self.path.name}: missing {a[key]}')
   if u.fragment: self.refs.append((target,u.fragment))
checks={}
for path in ROOT.rglob('*.html'):
 if '.git' in path.parts: continue
 parser=Check(path); parser.feed(path.read_text()); checks[path]=parser
 if parser.h1!=1: errors.append(f'{path}: expected one h1')
 text=path.read_text()
 for required in ['rel="canonical"','og:image','name="description"','id="main"']:
  if required not in text: errors.append(f'{path}: missing {required}')
for parser in checks.values():
 for target,fragment in parser.refs:
  if target in checks and fragment not in checks[target].ids: errors.append(f'{parser.path}: missing fragment {fragment}')
assert (ROOT/'CNAME').read_text().strip()=='krishvaid.me'
for path in (ROOT/'data').glob('*.json'): json.loads(path.read_text())
assert not errors, '\n'.join(errors)
print(f'Checked {len(checks)} HTML pages: local links, assets, anchors, headings, metadata and CNAME pass.')
