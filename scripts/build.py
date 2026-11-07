"""Dependency-free static renderer. Edit data/, not generated HTML."""
from pathlib import Path
import html, json, re
ROOT = Path(__file__).resolve().parents[1]
def load(name): return json.loads((ROOT/'data'/f'{name}.json').read_text())
def esc(value): return html.escape(str(value), quote=True)
profile, socials, education, experience, projects, hardware, gallery, notes = [load(x) for x in ['profile','socials','education','experience','projects','hardware','gallery','notes']]
def link(label,url):
    if not re.match(r'^(https://|mailto:|/|#)',url): raise ValueError(f'Unsafe URL: {url}')
    return f'<a href="{esc(url)}">{esc(label)}</a>'
def social(): return '<div class="socials">'+''.join(link(x['label'],x['url']) for x in socials)+'</div>'
def photo(x,portrait=False):
    path=x['path']; assert (ROOT/path.lstrip('/')).is_file(), path
    size=f'width="{x["width"]}" height="{x["height"]}"'
    responsive=f' srcset="{esc(x["srcset"])}" sizes="(max-width: 600px) 90vw, 400px"' if x.get('srcset') else ''
    img=f'<img src="/{esc(path.lstrip("/"))}" alt="{esc(x["alt"])}" {size}{responsive} loading="{"eager" if portrait else "lazy"}" decoding="async">'
    return f'<figure class="{"portrait" if portrait else "photo"}"><a class="photo-link" href="/{esc(path.lstrip("/"))}" data-photo data-caption="{esc(x.get("caption",""))}">{img}</a><figcaption>{esc(x.get("caption",""))}</figcaption></figure>'
def photos(category=None,project=None):
    items=sorted([x for x in gallery if (category is None or x['category']==category) and (project is None or x.get('project')==project)],key=lambda x:x.get('order',0))
    return '<div class="gallery">'+''.join(photo(x) for x in items)+'</div>' if items else ''
def roles(status,detail=False):
    result=''
    for x in experience:
        if x['status']!=status: continue
        name=link(x['organization'],x['url']) if x.get('url') else esc(x['organization'])
        result+=f'<li class="role"><div><strong>{name}</strong><span class="role-title">{esc(x["role"])}</span></div>'
        if x.get('dates'): result+=f'<p class="meta">{esc(x["dates"])}</p>'
        if x.get('description'): result+=f'<p>{esc(x["description"])}</p>'
        if detail:
            for key in ['responsibilities','results']:
                if x.get(key): result+='<ul>'+''.join('<li>'+esc(y)+'</li>' for y in x[key])+'</ul>'
            result+=''.join(photo(y) for y in x.get('images',[]))
        result+='</li>'
    return '<ul class="roles">'+result+'</ul>'
def project_list(items):
    return '<div class="project-list">'+''.join(f'<article><div><h3>{link(p["name"],"/projects/"+p["slug"]+".html")}</h3><p>{esc(p["description"])}</p></div><span class="meta">{esc(" / ".join(p.get("stack",[])))}</span></article>' for p in items)+'</div>'
def section(title,body,id=''):
    return f'<section{(" id="+chr(34)+id+chr(34)) if id else ""}><h2>{esc(title)}</h2>{body}</section>'
def page(path,title,body,active='home',description=None):
    description=description or 'Krishiv Vaid — Applied Physics and Computer Science at Waterloo. Electronics, hardware, software, and things I’m learning.'
    canonical='https://krishvaid.me/'+('' if path=='index.html' else 'notes.html' if path=='blog.html' else path)
    nav=''.join(f'<a href="/{url}"'+(' aria-current="page"' if name==active else '')+f'>{name}</a>' for name,url in [('home',''),('projects','projects.html'),('experience','experience.html'),('notes','notes.html'),('resume','resume.html')])
    output=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} | Krishiv Vaid</title><meta name="description" content="{esc(description)}">
<meta name="theme-color" content="#fafafa"><link rel="canonical" href="{canonical}">
<meta property="og:title" content="{esc(title)} — Krishiv Vaid"><meta property="og:description" content="{esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="{canonical}"><meta property="og:image" content="https://krishvaid.me/public/images/social-preview.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Krishiv Vaid — physics, electronics & software"><meta name="twitter:card" content="summary_large_image">
<script src="/js/theme.js"></script><link rel="icon" href="/public/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/css/styles.css"><script src="/js/main.js" defer></script></head>
<body><a class="skip" href="#main">Skip to content</a><div class="site-shell"><header><a class="brand" href="/">Krish Vaid<span aria-hidden="true">.</span></a><nav aria-label="Main">{nav}</nav><button id="theme-toggle" class="theme-toggle" aria-label="Toggle color theme" title="Toggle color theme"><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15A8.5 8.5 0 0 1 9 4a8.5 8.5 0 1 0 11 11Z"/></svg></button></header>
<main id="main">{body}</main><footer><div><span>© <span data-year>2026</span> Krishiv Vaid</span>{social()}</div>{f'<p class="visits" data-counter="{esc(profile["counterEndpoint"])}" aria-live="polite">Visit counter not connected yet.</p>' if path=='index.html' else ''}</footer></div>
<dialog id="lightbox" aria-label="Photo viewer"><button class="close" aria-label="Close photo">Close ×</button><img alt=""><p></p></dialog></body></html>'''
    out=ROOT/path; out.parent.mkdir(parents=True,exist_ok=True); out.write_text(output+'\n')
portrait=next((x for x in gallery if x['category']=='profile'),None)
portrait_html=photo(portrait,True) if portrait else '<figure class="portrait placeholder"><div><span class="meta">A face to the name</span><span>Portrait coming soon.</span></div><figcaption>Space for a photograph of me.</figcaption></figure>'
intro=f'<section class="intro"><div><p class="eyebrow">physics · electronics · software</p><h1>hey, i’m krish.</h1><p class="full-name">Krishiv Vaid</p><p>{esc(profile["intro"])}</p>{social()}<p class="resume-link">{link("resume ↗","/resume.html")}</p></div>{portrait_html}</section>'
hardware_copy='<p>I’ve spent <strong>2,000+ hours in hands-on electronics labs</strong>, working with components, microcontrollers, digital logic, and hardware prototypes.</p><p>That includes RS flip-flops, programming electronic systems, and testing how a circuit behaves in practice.</p>'
hardware_empty='<div class="empty"><span class="meta">From the workbench</span><p>Build photographs and project write-ups are coming soon.</p></div>'
body=intro+section('currently:',roles('current'))+section('hardware & electronics',hardware_copy+(project_list(hardware) if hardware else hardware_empty)+photos('hardware')+'<p class="section-link">'+link('Explore the workbench →','/projects.html#hardware')+'</p>')+section('selected software',project_list(projects)+'<p class="section-link">'+link('All projects →','/projects.html')+'</p>')+section('previously:',roles('past')+'<p class="section-link">'+link('More about my experience →','/experience.html')+'</p>')+section('education',f'<p>{link(education["institution"],education["url"])}</p><p class="muted">{esc(education["major"])} · {esc(education["minor"])} minor</p>')+section('otherwise:',f'<p>{esc(profile["otherwise"])}</p>'+photos('personal'))
page('index.html','Hey, I’m Krish',body)
page('projects.html','Projects','<p class="eyebrow">a work in progress, in the best sense</p><h1>things i’m building.</h1><p class="lede">Physical circuits, numerical experiments, and software built to understand what’s underneath.</p>'+section('hardware & electronics',hardware_copy+(project_list(hardware) if hardware else hardware_empty)+photos('hardware'),'hardware')+section('software',project_list(projects),'software'),'projects')
page('experience.html','Experience','<p class="eyebrow">work & learning</p><h1>experience.</h1><p class="lede">Across electronics, software, and research.</p>'+section('currently:',roles('current',True))+section('previously:',roles('past',True))+section('at the bench',hardware_copy),'experience')
for p in projects+hardware:
    assert re.fullmatch('[a-z0-9-]+',p['slug'])
    body='<p class="eyebrow">'+link('← projects','/projects.html')+' / '+esc(p['category'])+'</p><h1>'+esc(p['name'])+'</h1><p class="lede">'+esc(p['description'])+'</p><p class="meta">'+esc(' · '.join(p.get('stack',[])))+'</p>'
    body+=''.join(photo(x) for x in p.get('images',[]))+photos(project=p['slug'])
    body+=''.join(section(x['title'],'<p>'+esc(x['text'])+'</p>') for x in p.get('sections',[]))
    links=' '.join(link(label,p[key]) for key,label in [('repository','Source on GitHub ↗'),('demo','Live demo ↗')] if p.get(key))
    links+=' '.join(link(x['label'],x['url']) for x in p.get('files',[]))
    if links: body+=section('links & files',links)
    page('projects/'+p['slug']+'.html',p['name'],body,'projects',p['description'])
def markdown(text):
    # Deliberately small, escaped Markdown subset; no raw HTML or external parser.
    result=[]; paragraph=[]; code=None
    def flush():
        if paragraph: result.append('<p>'+inline(' '.join(paragraph))+'</p>'); paragraph.clear()
    def inline(s):
        s=esc(s)
        s=re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
        s=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
        return s
    for line in text.splitlines():
        if line.startswith('```'):
            flush()
            if code is None: code=[]
            else: result.append('<pre><code>'+esc('\n'.join(code))+'</code></pre>'); code=None
        elif code is not None: code.append(line)
        elif line.startswith('## '): flush(); result.append('<h2>'+inline(line[3:])+'</h2>')
        elif line.startswith('### '): flush(); result.append('<h3>'+inline(line[4:])+'</h3>')
        elif not line.strip(): flush()
        else: paragraph.append(line)
    flush()
    if code is not None: raise ValueError('Unclosed code block')
    return ''.join(result)
listing=''
for n in sorted(notes,key=lambda n:n['date'],reverse=True):
    assert re.fullmatch('[a-z0-9-]+',n['slug'])
    listing+='<article class="note-row"><span class="meta">'+esc(n['date'])+'</span><h2>'+link(n['title'],'/notes/'+n['slug']+'.html')+'</h2><span class="muted">'+esc(n.get('category',''))+'</span></article>'
    page('notes/'+n['slug']+'.html',n['title'],'<p class="eyebrow">'+link('← notes','/notes.html')+'</p><h1>'+esc(n['title'])+'</h1><p class="meta">'+esc(n['date'])+' · '+esc(n.get('category',''))+'</p><article class="prose">'+markdown((ROOT/n['file']).read_text())+'</article>','notes')
notes_body='<p class="eyebrow">a place to think out loud</p><h1>notes.</h1><p class="lede">Physics, electronics experiments, code, and things I’m figuring out.</p>'+(listing or '<div class="empty"><p>No published notes yet.</p><p class="muted">I’ll add experiments and write-ups here as I go.</p></div>')
page('notes.html','Notes',notes_body,'notes'); page('blog.html','Notes',notes_body,'notes')
resume=profile.get('resume')
if resume: assert (ROOT/resume.lstrip('/')).is_file()
page('resume.html','Resume','<p class="eyebrow">Krishiv Vaid</p><h1>resume.</h1>'+('<p>'+link('Open resume PDF ↗',resume)+'</p>' if resume else '<p class="lede">My resume PDF is not available here yet.</p><p>You can reach me at '+link(profile['email'],'mailto:'+profile['email'])+'.</p>'),'resume')
page('404.html','Page not found','<h1>nothing here, yet.</h1><p>This page may have moved. '+link('Head home →','/')+'</p>')
paths=['']+[str(p.relative_to(ROOT)) for p in ROOT.glob('*.html') if p.name not in ['index.html','blog.html','404.html']]+[str(p.relative_to(ROOT)) for folder in ['projects','notes'] for p in (ROOT/folder).glob('*.html')]
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>https://krishvaid.me/'+p+'</loc></url>' for p in paths)+'</urlset>\n')
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://krishvaid.me/sitemap.xml\n')
print(f'Built {len(paths)+2} static pages.')
