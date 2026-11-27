// Static site generator for delfthpt.com. No dependencies: `node build.mjs` writes the site to ./dist
// Text content lives in src/data.mjs. Layout and page structure live here.
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as D from './src/data.mjs';

const OUT = 'dist';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync('public', OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Review marks: hidden for visitors, shown when the site is opened with ?review=1
const todo = (label = 'to confirm') => `<span class="todo">${esc(label)}</span>`;
const ver = (f) => createHash('sha1').update(readFileSync(`public/${f}`)).digest('hex').slice(0, 8);
const asset = (f) => `/${f}?v=${ver(f)}`;
// Pages are written as people.html and published as /people: the addresses carry no ".html".
const path = (file) => (file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`);
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- photos ---------- */
// Width and height of a JPEG or PNG in public/img, so that the page does not jump while photos load.
function imgSize(f) {
  const b = readFileSync(`public/img/${f}`);
  if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (let i = 2; i + 9 < b.length;) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`cannot read the size of public/img/${f}`);
}
const pic = (f, alt, attrs = '') => { const [w, h] = imgSize(f); return `<img src="/img/${f}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy"${attrs}>`; };
// A photo that opens large when clicked (see "photos open large" in public/js/site.js). The large view uses the file
// of the same name in public/img/full when there is one. Without scripts the link simply opens the image.
const zoom = (p) => `<a class="zoom" href="/img/${existsSync(`public/img/full/${p.img}`) ? 'full/' : ''}${p.img}" data-cap="${esc(p.cap || '')}">${pic(p.img, p.alt)}</a>`;
const mark = (p) => (p.review ? ` ${todo(p.review)}` : '');
// Small photos under a main photo: one photo with its caption beside it, or a row of thumbnails with short labels.
const shots = (list = []) => (!list.length ? ''
  : list.length === 1 ? `<figure class="mini">${zoom(list[0])}<figcaption>${esc(list[0].cap)}${mark(list[0])}</figcaption></figure>`
  : `<div class="shots">${list.map((x) => `<figure>${zoom(x)}<figcaption>${esc(x.short || x.cap)}${mark(x)}</figcaption></figure>`).join('')}</div>`);

const logo = `<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="16" fill="#1a2233" stroke="#34415c"/><path d="M17 17 L31 9 A16 16 0 0 1 31 25 Z" fill="#b5653a"/><path d="M17 17 L27.5 11 A12 12 0 0 1 27.5 23 Z" fill="#e0a13a"/><path d="M17 17 L22.2 14 A6 6 0 0 1 22.2 20 Z" fill="#ffe9a8"/><circle cx="17" cy="17" r="16" fill="none" stroke="#ff8a3d" stroke-opacity=".55"/></svg>`;

// Funder logos at the bottom of every page (the list is in src/data.mjs).
// A logo can have words beside it (`lines`) and a second logo after a thin line (`pair`).
const funderImg = (f, alt) => `<img src="/img/${f.img}" alt="${esc(alt)}" width="${f.w}" height="${f.h}" loading="lazy">`;
const funderLogos = `<ul class="funders" aria-label="Funders">${D.funderLogos.map((f) => {
  const inner = f.img
    ? funderImg(f, f.lines ? '' : f.name)
      + (f.lines ? `<span class="lines">${f.lines.map(esc).join('<br>')}</span>` : '')
      + (f.pair ? `<i class="rule"></i>${funderImg(f.pair, f.pair.name)}` : '')
    : `<span class="word" aria-hidden="true">${esc(f.text)}</span><span class="sr">${esc(f.name)}</span>`;
  return `<li>${f.url ? `<a href="${f.url}" rel="noopener" title="${esc(f.name)}">${inner}</a>` : `<span title="${esc(f.name)}">${inner}</span>`}</li>`;
}).join('')}</ul>`;

function layout({ file, title, desc, body, scripts = [], cls = '' }) {
  const full = file === 'index.html' ? `${D.site.name} | ${D.site.full}` : `${title} | ${D.site.name}`;
  const here = path(file);
  const url = `${D.site.url}${here === '/' ? '/' : here}`;
  const navHtml = D.nav.map(([label, href]) => `<a href="${href}"${href === here ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
${file === '404.html' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(D.site.name)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${D.site.url}/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A banded planet under a field of stars, with the name of the laboratory">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0e14">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${asset('css/site.css')}">
<script>(function(){var d=document.documentElement,l=location;d.classList.add('js');
/* an old address such as /people.html is shown as /people */
try{var p=l.pathname.replace(/\\/index\\.html$/,'/').replace(/\\.html$/,'');if(p!==l.pathname)history.replaceState(null,'',p+l.search+l.hash)}catch(e){}
try{var q=l.search;if(/[?&]review=1/.test(q))sessionStorage.setItem('review','1');if(/[?&]review=0/.test(q))sessionStorage.removeItem('review');if(sessionStorage.getItem('review'))d.classList.add('review')}catch(e){if(/[?&]review=1/.test(l.search))d.classList.add('review')}})()</script>
</head>
<body class="${cls}">
<a class="skip" href="#main">Skip to content</a>
<div class="review-bar">Review mode: yellow marks show what the lab still needs to confirm or fill in. <a href="?review=0">Turn off</a></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">${logo}<span>${esc(D.site.name)}<small>Planetary materials laboratory</small></span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">${navHtml}</nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer>
  <div class="wrap grid">
    <div>
      <h4>${esc(D.site.full)}</h4>
      <p>${D.site.contact.address.map(esc).join('<br>')}</p>
    </div>
    <div>
      <h4>Site</h4>
      <ul>${D.nav.slice(1).map(([l, h]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('')}</ul>
    </div>
    <div class="foot-last">
      <div>
        <h4>Contact</h4>
        <p>${esc(D.site.contact.name)}<br><a href="/contact">Send us a message</a></p>
        <p class="small">Maintained by the lab team. No cookies, no tracking.</p>
      </div>
      ${funderLogos}
    </div>
  </div>
</footer>
<script src="${asset('js/site.js')}" defer></script>
${scripts.map((s) => `<script src="${asset(s)}" defer></script>`).join('\n')}
</body>
</html>
`;
}

const head = (eyebrow, h1, lead) => `<div class="page-head"><div class="wrap"><p class="eyebrow">${esc(eyebrow)}</p><h1>${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div></div>`;

const viz = (kind, title, fallback) => `<figure class="viz" data-viz="${kind}">
  <figcaption class="viz-title">${esc(title)}</figcaption>
  <canvas role="img" aria-label="${esc(title)}: interactive illustration"></canvas>
  <div class="bar"></div>
  <p class="cap">${fallback}</p>
</figure>`;

const pages = [];

/* ---------- Home ---------- */
pages.push({
  file: 'index.html', title: 'Home', cls: 'home',
  desc: 'The TU Delft High-Pressure/Temperature Laboratory for Planetary Materials recreates the interiors, surfaces and atmospheres of planets and moons in the laboratory.',
  scripts: [],
  body: `
<section class="hero">
  <canvas id="hero-canvas" aria-hidden="true"></canvas>
  <div class="wrap">
    <h1 class="hero-name">TU Delft High-Pressure/Temperature Laboratory for Planetary Materials</h1>
    <p class="q" id="q" data-questions="${esc(JSON.stringify(D.questions))}">${esc(D.questions[0])}</p>
    <p class="lead">${esc(D.site.tagline)}</p>
    <div class="btns"><a class="btn primary" href="/equipment">Explore the equipment</a><a class="btn" href="/research">Our research</a></div>
  </div>
</section>

<section>
  <div class="wrap grid g2 intro">
    <div class="prose reveal">
      <p class="eyebrow">Welcome</p>
      <h2>Extreme conditions, made in Delft</h2>
      <p>${esc(D.intro[0])}</p>
      <p>${esc(D.goal)}</p>
      <p><a href="/research">More about our research</a></p>
    </div>
    <div class="grid g2 stats reveal">
      ${D.stats.map((s) => `<div class="card stat"><b data-count="${s.v}" data-dec="${s.dec || 0}">${s.v}</b><em>${esc(s.unit)}</em><span>${esc(s.label)}</span></div>`).join('')}
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <p class="eyebrow">Research</p>
    <h2>What we work on</h2>
    <div class="grid g2">
      ${D.themes.map((t) => `<a class="card reveal" href="/research#${t.id}"><h3>${esc(t.t)}</h3><p class="muted">${esc(t.d)}</p></a>`).join('')}
      <a class="card more reveal" href="/research#projects"><h3>Funded projects</h3><p class="muted">The ERC, NWO, NWA and M2i projects behind this research.</p></a>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Worlds</p>
    <h2>From the laboratory to other planets</h2>
    <p class="prose muted">One set of instruments, many destinations. The same experiment means something different on each body, because gravity, composition and atmosphere all change the answer.</p>
    <div class="worlds">
      ${D.worlds.map((w) => `<div class="world reveal"><i class="orb ${w.id}"></i><h3>${esc(w.name)}</h3><p class="muted">${esc(w.d)}${mark(w)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <p class="eyebrow">Equipment</p>
    <h2>The instruments</h2>
    <div class="grid g4">
      ${D.instruments.map((i) => `<a class="card reveal" href="/equipment#${i.id}">${i.img ? pic(i.img, i.alt) : `<div class="ph">${esc(i.short)}${todo('photo to add')}</div>`}<h3>${esc(i.short)}</h3><p class="muted">${esc(i.card)}</p></a>`).join('')}
    </div>
  </div>
</section>

<section>
  <div class="wrap grid g2">
    <div>
      <p class="eyebrow">News</p>
      <h2>Latest</h2>
      <ul class="newslist">
        ${D.news.slice(0, 3).map((n) => `<li><span class="date">${esc(n.date)}</span><a href="${n.url}" rel="noopener">${esc(n.t)}</a></li>`).join('')}
      </ul>
      <p><a href="/news">All news</a></p>
    </div>
    <div class="card cta">
      <h3>Work with us</h3>
      <p class="muted">For questions about the laboratory, collaborations or student projects, please get in touch.</p>
      <a class="btn primary" href="/contact">Contact</a>
    </div>
  </div>
</section>`,
});

/* ---------- Research ---------- */
pages.push({
  file: 'research.html', title: 'Research',
  desc: `Research themes and funded projects of the ${D.site.name}: Venus, planetary differentiation, lava rheology, cloud chemistry and green steelmaking.`,
  body: `
${head('Research', 'How planets work, tested in the laboratory', esc(D.intro[1]))}
<section>
  <div class="wrap grid g2 intro">
    <div class="prose">
      ${D.intro.slice(3).map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
    <p class="note big">${esc(D.goal)}</p>
  </div>
</section>
<section class="alt">
  <div class="wrap">
    <p class="eyebrow">Themes</p>
    <h2>Research themes</h2>
    <div class="grid g2">
      ${D.themes.map((t) => `<div class="card reveal" id="${t.id}"><h3>${esc(t.t)}</h3><p>${esc(t.long || t.d)}</p>${t.link ? `<p><a href="${t.link[1]}">${esc(t.link[0])}</a></p>` : ''}</div>`).join('')}
      <a class="card more reveal" href="/equipment"><h3>See the experiments</h3><p class="muted">How each instrument maps onto the interior, surface or atmosphere of another world.</p></a>
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <p class="eyebrow">Funding</p>
    <h2 id="projects">Projects</h2>
    <div class="grid g2">
      ${D.projects.map((p) => `<div class="card reveal" id="${p.id}"><p class="role">${esc(p.funder)}${p.year ? ` · ${esc(p.year)}` : ''}</p><h3>${esc(p.name)}</h3><p${p.d ? '' : ' class="muted"'}>${p.d ? esc(p.d) : 'Project description coming soon.'}${mark(p)}</p>${p.src ? `<p><a href="${p.src}" rel="noopener">${esc(p.srcLabel || 'Read more')}</a></p>` : ''}</div>`).join('')}
    </div>
  </div>
</section>
<section class="alt">
  <div class="wrap">
    <p class="eyebrow">Worlds</p>
    <h2>Bodies we study</h2>
    <ul class="orbrow">
      ${D.worlds.map((w) => `<li class="reveal"><i class="orb ${w.id}"></i>${esc(w.name)}</li>`).join('')}
    </ul>
    <p><a class="btn" href="/equipment">See how the experiments map onto each world</a></p>
  </div>
</section>`,
});

/* ---------- Equipment ---------- */
const FAC = D.facilities;
pages.push({
  file: 'equipment.html', title: 'Equipment and experiments',
  desc: `The instruments of the ${D.site.name} and what they simulate: a piston cylinder press, a high-temperature rheometer, the Venus Surface Simulator and a gas-mixing furnace.`,
  scripts: ['js/viz.js'],
  body: `
${head('Equipment and experiments', 'A solar system of conditions in one laboratory', 'Each instrument recreates one part of a planet: the pressure of its interior, the flow of its lavas, the heat and weight of its atmosphere, or the chemistry of its gases. Each illustration plays by itself. Use the controls under it to see which world an experiment corresponds to, and press Play to let it run again.')}
<div class="wrap">
  <nav class="jump" aria-label="On this page">
    ${D.instruments.map((i) => `<a href="#${i.id}">${esc(i.short)}</a>`).join('')}<a href="#clouds">Venus clouds</a><a href="#facilities">Shared facilities</a>
  </nav>
  ${D.instruments.map((i) => `
  <article class="instrument" id="${i.id}" data-gallery>
    <div class="photo reveal">
      ${i.img ? zoom(i) : `<div class="ph tall">${esc(i.short)}<small>Photo coming soon</small>${todo('photo to add')}</div>`}
      ${shots(i.extra)}
    </div>
    <div class="reveal">
      <h2>${esc(i.name)}</h2>
      <div class="specs">${i.specs.map((s) => `<div class="spec"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div>
      <p>${esc(i.text)}</p>
      ${D.scan.views.some((v) => v.key === i.id) ? `<p class="small"><a href="/tour#${i.id}">Find it in the 3D model of the laboratory →</a></p>` : ''}
    </div>
    <div class="full reveal">
      ${viz(i.id, i.vizTitle, esc(i.vizFallback))}
      <p class="small muted">${esc(i.vizNote)} ${todo('numbers to check')}</p>
      ${i.explain ? `<div class="note explain"><h3>${esc(i.explain.t)}</h3>${i.explain.p.map((p) => `<p>${esc(p)}</p>`).join('')}${mark(i.explain)}</div>` : ''}
    </div>
  </article>`).join('')}
  <article class="instrument" id="clouds" data-gallery>
    <div class="full reveal">
      <p class="eyebrow">Beyond rock</p>
      <h2>The clouds of Venus and ionic liquids</h2>
      <div class="withfig">
        <div class="prose">${D.clouds.text.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        <figure class="sidefig">${zoom(D.clouds.photo)}<figcaption>${esc(D.clouds.photo.cap)}${mark(D.clouds.photo)}</figcaption></figure>
      </div>
      ${viz('clouds', 'Inside the clouds of Venus', esc(D.clouds.fallback))}
      <p class="small muted">${esc(D.clouds.note)} ${todo('text to confirm')}</p>
      <p class="small">${D.clouds.refs.map((r) => `<a href="${r[1]}" rel="noopener">${esc(r[0])}</a>`).join(' · ')}</p>
    </div>
  </article>
  <article class="instrument" id="facilities" data-gallery>
    <div class="photo reveal">
      <figure class="plainfig">${zoom(FAC.photo)}<figcaption>${esc(FAC.photo.cap)}</figcaption></figure>
    </div>
    <div class="reveal">
      <p class="eyebrow">Around the instruments</p>
      <h2>${esc(FAC.title)}</h2>
      <p>${esc(FAC.lead)}</p>
      <dl class="fac">${FAC.groups.map((g) => `<dt>${esc(g.t)}</dt><dd>${esc(g.d)}</dd>`).join('')}</dl>
      <p class="small">More about these facilities: ${FAC.links.map((l) => `<a href="${l[1]}" rel="noopener">${esc(l[0])}</a>`).join(' · ')}${mark(FAC)}</p>
      <p class="small"><a href="/tour#prep">Find the preparation bench in the 3D model of the laboratory →</a></p>
    </div>
  </article>
</div>`,
});

/* ---------- People ---------- */
const F = D.site.contact.form;
// A person with a photo or a biography gets a wide card: the photo on the left with the fields of expertise and
// the links under it, the text on the right. The others get a small card until their details arrive.
// "Send a message" is not one of the links: it stands by itself at the bottom of the card, in grey.
const detailed = (p) => Boolean(p.photo || p.bio);
const personCard = (p) => {
  const links = (p.links || []).map((l) => `<li><a href="${l[1]}" rel="noopener">${esc(l[0])}</a></li>`);
  const msg = p.contact && F.people.includes(p.contact)
    ? `<a class="p-msg" href="/contact#${slug(p.contact)}"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M1.75 3.5h12.5v9H1.75zM2 4l6 4.6L14 4"/></svg>Send a message</a>` : '';
  let photo = `<div class="avatar" aria-hidden="true">${esc(p.init)}</div>`;
  if (p.photo) {
    const [w, h] = imgSize(p.photo);
    const cls = `portrait${w / h > 1.25 ? ' wide' : ''}`;
    const img = pic(p.photo, p.alt || `Portrait of ${p.name}`);
    photo = existsSync(`public/img/full/${p.photo}`)
      ? `<a class="zoom ${cls}" href="/img/full/${p.photo}" data-cap="${esc(p.name)}">${img}</a>`
      : `<div class="${cls}">${img}</div>`;
  }
  const meta = `${p.tags.length ? `<p class="p-label">Expertise</p><div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}${links.length ? `<ul class="links">${links.join('')}</ul>` : ''}${msg}`;
  return `<div class="card person${detailed(p) ? '' : ' small'} reveal">
      <div class="p-photo">${photo}</div>
      <div class="p-text">
        <h3>${esc(p.name)}</h3>
        ${p.role ? `<p class="role">${esc(p.role)}</p>` : `<p class="role">${todo('role to add')}</p>`}
        <p${p.bio ? '' : ' class="muted"'}>${p.bio ? esc(p.bio) : 'Bio coming soon.'}${p.bio ? '' : ` ${todo('bio and photo to add')}`}${p.bio && !p.photo ? ` ${todo('photo to add')}` : ''}${mark(p)}</p>
      </div>
      ${meta ? `<div class="p-meta">${meta}</div>` : ''}
    </div>`;
};
pages.push({
  file: 'people.html', title: 'People',
  desc: `The team of the ${D.site.name}, led by Dr. Edgar Steenstra.`,
  body: `
${head('People', 'The team', 'We are a young but fast-growing team with members at every career stage: experimentalists, geochemists, materials scientists and planetary scientists at the Faculty of Aerospace Engineering of TU Delft.')}
<section>
  <div class="wrap">
    <div class="people">
      ${D.people.filter(detailed).map(personCard).join('')}
    </div>
    ${D.people.some((p) => !detailed(p)) ? `<div class="grid team">
      ${D.people.filter((p) => !detailed(p)).map(personCard).join('')}
    </div>` : ''}
  </div>
</section>
<section class="alt">
  <div class="wrap grid g2">
    <div class="prose"><h2>Join the lab</h2><p>For questions about student projects, positions or collaborations, please write to us through the contact form.</p><p><a class="btn" href="/contact">Contact form</a></p></div>
  </div>
</section>`,
});

/* ---------- Publications ---------- */
const pubItem = (p) => `<li><span class="yr">${p.y}</span>${esc(p.a)}. <i>${esc(p.t)}</i>. ${esc(p.j)}.${p.doi ? ` <a href="https://doi.org/${p.doi}" rel="noopener">doi:${esc(p.doi)}</a>` : ''}</li>`;
// A list of more than five papers sits in a frame that shows about five and scrolls, with a button that opens the whole list.
const pubList = (list, label) => (list.length <= 5 ? `<ul class="pubs">${list.map(pubItem).join('')}</ul>`
  : `<div class="pubframe" tabindex="0" role="region" aria-label="${esc(label)}: ${list.length} papers, scroll to see all">
      <ul class="pubs">${list.map(pubItem).join('')}</ul>
    </div>
    <p class="pubmore"><button class="btn" type="button" aria-expanded="false" data-all="Show all ${list.length} papers" data-few="Show fewer">Show all ${list.length} papers</button></p>`);
pages.push({
  file: 'publications.html', title: 'Publications',
  desc: `Publications of the ${D.site.name} and earlier work by its members.`,
  body: `
${head('Publications', 'Publications', 'Papers from the laboratory, followed by selected earlier work of lab members.')}
<section>
  <div class="wrap">
    <h2>Group publications</h2>
    ${pubList(D.groupPubs, 'Group publications')}
  </div>
</section>
<section class="alt">
  <div class="wrap">
    <h2>Earlier work by Edgar Steenstra</h2>
    <p class="muted">Compiled from public university profiles and the publishers’ records. A complete and current list is on <a href="https://scholar.google.nl/citations?user=RnRn5XYAAAAJ&amp;hl=nl" rel="noopener">Google Scholar</a>. ${todo('list to confirm')}</p>
    ${pubList(D.piPubs, 'Earlier work by Edgar Steenstra')}
  </div>
</section>
<section>
  <div class="wrap">
    <h2>Venus clouds and ionic liquids</h2>
    <p class="muted">Work by Iaroslav Iakubivskyi and co-authors. His complete list is on <a href="${D.scholar.iakubivskyi}" rel="noopener">Google Scholar</a>. ${todo('list to confirm')}</p>
    ${pubList(D.cloudPubs, 'Venus clouds and ionic liquids')}
  </div>
</section>
<section class="alt">
  <div class="wrap">
    <h2>Space missions, instruments and field analogues</h2>
    <p class="muted">Earlier work by Iaroslav Iakubivskyi and co-authors, from the Comet Interceptor mission to electric solar wind sails and nanospacecraft. ${todo('list to confirm')}</p>
    ${pubList(D.missionPubs, 'Space missions, instruments and field analogues')}
  </div>
</section>`,
});

/* ---------- News ---------- */
pages.push({
  file: 'news.html', title: 'News',
  desc: `News from the ${D.site.name}.`,
  body: `
${head('News', 'News', 'Announcements and coverage of the laboratory.')}
<section>
  <div class="wrap grid two">
    ${D.news.map((n) => `<a class="card reveal" href="${n.url}" rel="noopener"><p class="role">${esc(n.date)} · ${esc(n.src)}</p><h3>${esc(n.t)}</h3><p class="muted">${esc(n.d)}</p></a>`).join('')}
  </div>
</section>`,
});

/* ---------- Virtual tour ---------- */
// The 3D scan. Without scripts, or in a browser that cannot draw it, visitors see the picture of the scan and the
// texts of all views below it. public/js/tour.js puts the model over the picture and shows one text at a time.
const SC = D.scan;
const scanData = {
  step: SC.step, origin: SC.origin, box: SC.box, walls: SC.walls,
  parts: SC.parts.map((p) => ({ url: asset(`scan/${p.file}`), points: p.points, bytes: p.bytes })),
  views: SC.views.map((v) => ({ key: v.key, label: v.label || v.name, at: v.at, look: v.look, cut: v.cut || 0, spot: v.spot || null, rest: v.rest, turn: v.turn })),
};
const spotNo = (v) => SC.views.filter((x) => x.spot).indexOf(v) + 1;
const [posterW, posterH] = imgSize(SC.poster);
const scanInfo = (v) => `<div class="scan-info" data-key="${v.key}">
      ${v.img ? zoom({ img: v.img, alt: v.alt, cap: v.name }) : ''}
      <div>
        ${v.spot ? `<h3><b>${spotNo(v)}</b>${esc(v.name)}</h3>` : ''}
        <p>${esc(v.text)}${v.review ? ` ${todo(v.review)}` : ''}</p>
        ${v.href ? `<p><a href="${v.href}">${esc(v.more)} →</a></p>` : `<p class="hint"><span class="for-mouse">${esc(SC.hint.mouse)}</span><span class="for-touch">${esc(SC.hint.touch)}</span></p>`}
      </div>
    </div>`;
pages.push({
  file: 'tour.html', title: 'Virtual tour',
  desc: `A 3D scan of the ${D.site.name}: turn the model of the laboratory and find its instruments.`,
  scripts: ['js/tour.js'],
  body: `
${head('Virtual tour', 'Step inside the laboratory', 'Turn a 3D scan of the laboratory, zoom in, and find the instruments. Press Play for a short tour.')}
<section>
  <div class="wrap">
    <figure class="scan" id="tour-embed" data-scan="${esc(JSON.stringify(scanData))}" data-gallery>
      <div class="scan-title">${esc(SC.title)}</div>
      <div class="scan-stage"><img class="scan-poster" src="/img/${SC.poster}" alt="${esc(SC.alt)}" width="${posterW}" height="${posterH}"></div>
      <div class="bar"><div class="seg" role="group" aria-label="Views of the laboratory">${SC.views.map((v) => `<button type="button" data-key="${v.key}">${v.spot ? `<b>${spotNo(v)}</b>` : ''}${esc(v.name)}</button>`).join('')}</div></div>
      <figcaption class="scan-text">
    ${SC.views.map(scanInfo).join('\n    ')}
      </figcaption>
    </figure>
  </div>
</section>
<section class="alt">
  <div class="wrap">
    <h2>In the lab</h2>
    <div class="gallery" data-gallery>
      ${D.gallery.map((g) => `<figure class="reveal">${zoom(g)}<figcaption>${esc(g.cap)}</figcaption></figure>`).join('')}
    </div>
  </div>
</section>`,
});

/* ---------- Contact ---------- */
const names = F.people.length > 1 ? `${F.people.slice(0, -1).join(', ')} and ${F.people[F.people.length - 1]}` : F.people.join('');
pages.push({
  file: 'contact.html', title: 'Contact',
  desc: `Contact form and address of the ${D.site.name} at the Faculty of Aerospace Engineering, TU Delft.`,
  scripts: ['js/contact.js'],
  body: `
${head('Contact', 'Get in touch', 'Questions about the laboratory, collaborations or student projects are welcome.')}
<section>
  <div class="wrap grid contact">
    <div class="card">
      <h3>Send us a message</h3>
      <form class="form" id="contact-form" action="${F.endpoint}" method="post" novalidate data-email="${F.email}">
        <p class="muted">Your message goes by email to the lab team: ${esc(names)}. You can also send it to one of them only. Whoever receives it will answer by email.</p>
        <div class="field"><label for="cf-to">To</label><select id="cf-to" name="to"><option value="">The whole lab team</option>${F.people.map((p) => `<option value="${esc(p)}" data-slug="${slug(p)}">${esc(p)}</option>`).join('')}</select></div>
        <div class="field"><label for="cf-name">Your name</label><input id="cf-name" name="name" type="text" autocomplete="name" maxlength="100" required></div>
        <div class="field"><label for="cf-email">Your email address</label><input id="cf-email" name="email" type="email" autocomplete="email" maxlength="200" required></div>
        <div class="field"><label for="cf-topic">Topic</label><select id="cf-topic" name="topic">${F.topics.map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="cf-message">Message</label><textarea id="cf-message" name="message" rows="7" maxlength="5000" required></textarea></div>
        <div class="hp" aria-hidden="true"><label for="cf-extra">Leave this field empty</label><input id="cf-extra" name="leave-this-empty" type="text" tabindex="-1" autocomplete="off"></div>
        <button class="btn primary" type="submit">Send message</button>
        <p class="form-status" role="status" aria-live="polite"></p>
        <p class="small muted">Your message is sent by email and is not stored on this website. A message for one person goes to that person only. If that mailbox cannot be reached, it goes to the rest of the team instead.</p>
      </form>
      <div class="form-done" id="contact-done" tabindex="-1" hidden><h3>Message sent</h3><p>Thank you. Your message is on its way to the lab team, and one of us will answer by email.</p></div>
      <p class="nojs">The form needs JavaScript. You can also write to <a href="mailto:${F.email}">${F.email}</a>.</p>
    </div>
    <div class="stack">
      <div class="card">
        <h3>${esc(D.site.contact.name)}</h3>
        <p class="role">${esc(D.site.contact.role)}</p>
        <p>${D.site.contact.address.map(esc).join('<br>')}</p>
        <p><a href="https://www.openstreetmap.org/search?query=Kluyverweg%201%2C%20Delft" rel="noopener">Show on a map</a></p>
      </div>
      <div class="card" id="acknowledgements">
        <h3>Acknowledgements</h3>
        <p>The experimental facilities and research have been supported by:</p>
        <ul class="plain">${D.funders.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        <p class="small muted">${esc(D.euStatement)}</p>
        <p>${todo('funder list and acknowledgement wording to confirm')}</p>
      </div>
    </div>
  </div>
</section>`,
});

/* ---------- 404 ---------- */
pages.push({
  file: '404.html', title: 'Page not found',
  desc: 'Page not found.',
  body: `${head('404', 'This page is not here', 'The page you are looking for does not exist.')}<section><div class="wrap"><a class="btn primary" href="/">Back to the home page</a></div></section>`,
});

for (const p of pages) writeFileSync(`${OUT}/${p.file}`, layout(p));

writeFileSync(`${OUT}/CNAME`, 'delfthpt.com\n');
writeFileSync(`${OUT}/.nojekyll`, '');
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${D.site.url}/sitemap.xml\n`);
writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((p) => p.file !== '404.html').map((p) => `  <url><loc>${D.site.url}${path(p.file)}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${pages.length} pages into ${OUT}/`);
