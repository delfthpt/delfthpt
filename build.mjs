// Static site generator for delfthpt.com. No dependencies: `node build.mjs` writes the site to ./dist
// Text content lives in src/data.mjs. Layout and page structure live here.
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync } from 'node:fs';
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
const asset = (f) => `${f}?v=${ver(f)}`;

const logo = `<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="16" fill="#1a2233" stroke="#34415c"/><path d="M17 17 L31 9 A16 16 0 0 1 31 25 Z" fill="#b5653a"/><path d="M17 17 L27.5 11 A12 12 0 0 1 27.5 23 Z" fill="#e0a13a"/><path d="M17 17 L22.2 14 A6 6 0 0 1 22.2 20 Z" fill="#ffe9a8"/><circle cx="17" cy="17" r="16" fill="none" stroke="#ff8a3d" stroke-opacity=".55"/></svg>`;

function layout({ file, title, desc, body, scripts = [], cls = '' }) {
  const full = file === 'index.html' ? `${D.site.name} | ${D.site.full}` : `${title} | ${D.site.name}`;
  const url = `${D.site.url}/${file === 'index.html' ? '' : file}`;
  const navHtml = D.nav.map(([label, href]) => `<a href="${href}"${href === file ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
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
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${asset('css/site.css')}">
<script>(function(){var d=document.documentElement;d.classList.add('js');try{var q=location.search;if(/[?&]review=1/.test(q))sessionStorage.setItem('review','1');if(/[?&]review=0/.test(q))sessionStorage.removeItem('review');if(sessionStorage.getItem('review'))d.classList.add('review')}catch(e){if(/[?&]review=1/.test(location.search))d.classList.add('review')}})()</script>
</head>
<body class="${cls}">
<a class="skip" href="#main">Skip to content</a>
<div class="review-bar">Review mode: yellow marks show what the lab still needs to confirm or fill in. <a href="?review=0">Turn off</a></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html">${logo}<span>Delft HPT Lab<small>Planetary materials laboratory</small></span></a>
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
    <div>
      <h4>Contact</h4>
      <p>${esc(D.site.contact.name)}<br><a href="mailto:${D.site.contact.email}">${D.site.contact.email}</a></p>
      <p class="small">Maintained by the lab team. No cookies, no tracking.</p>
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
    <div class="btns"><a class="btn primary" href="equipment.html">Explore the experiments</a><a class="btn" href="research.html">Our research</a></div>
  </div>
</section>

<section>
  <div class="wrap grid g2 intro">
    <div class="prose reveal">
      <p class="eyebrow">Welcome</p>
      <h2>Extreme conditions, made in Delft</h2>
      <p>${esc(D.intro[0])}</p>
      <p>${esc(D.goal)}</p>
      <p><a href="research.html">More about our research</a></p>
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
      ${D.themes.map((t) => `<a class="card reveal" href="research.html#${t.id}"><h3>${esc(t.t)}</h3><p class="muted">${esc(t.d)}</p></a>`).join('')}
      <a class="card more reveal" href="research.html#projects"><h3>Funded projects</h3><p class="muted">The ERC, NWO, NWA and M2i projects behind this research.</p></a>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Worlds</p>
    <h2>From the laboratory to other planets</h2>
    <p class="prose muted">One set of instruments, many destinations. The same experiment means something different on each body, because gravity, composition and atmosphere all change the answer.</p>
    <div class="worlds">
      ${D.worlds.map((w) => `<div class="world reveal"><i class="orb ${w.id}"></i><h3>${esc(w.name)}</h3><p class="muted">${esc(w.d)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <p class="eyebrow">Equipment</p>
    <h2>The instruments</h2>
    <div class="grid g4">
      ${D.instruments.map((i) => `<a class="card reveal" href="equipment.html#${i.id}">${i.img ? `<img src="img/${i.img}" alt="${esc(i.alt)}" loading="lazy">` : `<div class="ph">${esc(i.short)}${todo('photo to add')}</div>`}<h3>${esc(i.short)}</h3><p class="muted">${i.specs.slice(0, 2).map((s) => esc(s[0])).join(' · ')}</p></a>`).join('')}
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
      <p><a href="news.html">All news</a></p>
    </div>
    <div class="card cta">
      <h3>Work with us</h3>
      <p class="muted">For questions about the laboratory, collaborations or student projects, please get in touch.</p>
      <a class="btn primary" href="contact.html">Contact</a>
    </div>
  </div>
</section>`,
});

/* ---------- Research ---------- */
pages.push({
  file: 'research.html', title: 'Research',
  desc: 'Research themes and funded projects of the Delft HPT Lab: Venus, planetary differentiation, magma rheology, cloud chemistry and green steelmaking.',
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
      <a class="card more reveal" href="equipment.html"><h3>See the experiments</h3><p class="muted">How each instrument maps onto the interior, surface or atmosphere of another world.</p></a>
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <p class="eyebrow">Funding</p>
    <h2 id="projects">Projects</h2>
    <div class="grid g2">
      ${D.projects.map((p) => `<div class="card reveal" id="${p.id}"><p class="role">${esc(p.funder)}${p.year ? ` · ${esc(p.year)}` : ''}</p><h3>${esc(p.name)}</h3><p${p.d ? '' : ' class="muted"'}>${p.d ? esc(p.d) : 'Project description coming soon.'}${p.review ? ` ${todo(p.review)}` : ''}</p>${p.src ? `<p><a href="${p.src}" rel="noopener">${esc(p.srcLabel || 'Read more')}</a></p>` : ''}</div>`).join('')}
    </div>
  </div>
</section>
<section class="alt">
  <div class="wrap">
    <p class="eyebrow">Worlds</p>
    <h2>Bodies we study</h2>
    <div class="worlds">
      ${D.worlds.map((w) => `<div class="world reveal"><i class="orb ${w.id}"></i><h3>${esc(w.name)}</h3><p class="muted">${esc(w.d)}</p></div>`).join('')}
    </div>
    <p><a class="btn" href="equipment.html">See how the experiments map onto each world</a></p>
  </div>
</section>`,
});

/* ---------- Equipment ---------- */
pages.push({
  file: 'equipment.html', title: 'Equipment and experiments',
  desc: 'The instruments of the Delft HPT Lab and what they simulate: a piston cylinder press, a high-temperature rheometer, the Venus Surface Simulator and a gas-mixing furnace.',
  scripts: ['js/viz.js'],
  body: `
${head('Equipment and experiments', 'Four instruments, a solar system of conditions', 'Each instrument recreates one part of a planet: the pressure of its interior, the flow of its lavas, the heat and weight of its atmosphere, or the chemistry of its gases. Use the controls under each instrument to see which world an experiment corresponds to.')}
<div class="wrap">
  <nav class="jump" aria-label="Instruments">
    ${D.instruments.map((i) => `<a href="#${i.id}">${esc(i.short)}</a>`).join('')}<a href="#clouds">Venus clouds</a>
  </nav>
  ${D.instruments.map((i, n) => `
  <article class="instrument" id="${i.id}">
    <div class="photo reveal">
      ${i.img ? `<img src="img/${i.img}" alt="${esc(i.alt)}" loading="lazy">` : `<div class="ph tall">${esc(i.short)}<small>Photo coming soon</small>${todo('photo to add')}</div>`}
      ${(i.extra || []).map((x) => `<figure class="mini"><img src="img/${x.img}" alt="${esc(x.alt)}" loading="lazy"><figcaption>${esc(x.cap)} ${todo('caption to confirm')}</figcaption></figure>`).join('')}
    </div>
    <div class="reveal">
      <p class="eyebrow">Instrument ${String(n + 1).padStart(2, '0')}</p>
      <h2>${esc(i.name)}</h2>
      <div class="specs">${i.specs.map((s) => `<div class="spec"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div>
      <p>${esc(i.text)}</p>
    </div>
    <div class="full reveal">
      ${viz(i.id, i.vizTitle, esc(i.vizFallback))}
      <p class="small muted">${esc(i.vizNote)} ${todo('numbers to check')}</p>
    </div>
  </article>`).join('')}
  <article class="instrument" id="clouds">
    <div class="full reveal">
      <p class="eyebrow">Beyond rock</p>
      <h2>The clouds of Venus and ionic liquids</h2>
      <p class="prose">${esc(D.clouds.text[0])}</p>
      <p class="prose">${esc(D.clouds.text[1])}</p>
      ${viz('clouds', 'Inside the clouds of Venus', esc(D.clouds.fallback))}
      <p class="small muted">${esc(D.clouds.note)} ${todo('text to confirm')}</p>
      <p class="small">${D.clouds.refs.map((r) => `<a href="${r[1]}" rel="noopener">${esc(r[0])}</a>`).join(' · ')}</p>
    </div>
  </article>
</div>`,
});

/* ---------- People ---------- */
const personCard = (p, cls = '') => `<div class="card person ${cls} reveal">
      ${p.photo ? `<img class="avatar" src="img/${p.photo}" alt="Portrait of ${esc(p.name)}">` : `<div class="avatar" aria-hidden="true">${esc(p.init)}</div>`}
      <div>
        <h3>${esc(p.name)}</h3>
        ${p.role ? `<p class="role">${esc(p.role)}</p>` : `<p class="role">${todo('role to add')}</p>`}
        <p${p.bio ? '' : ' class="muted"'}>${p.bio ? esc(p.bio) : 'Bio coming soon.'}${p.bio ? '' : ` ${todo('bio and photo to add')}`}${p.bio && !p.photo ? ` ${todo('photo to add')}` : ''}</p>
        ${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
        ${(p.links || []).length ? `<p class="links">${p.links.map((l) => `<a href="${l[1]}" rel="noopener">${esc(l[0])}</a>`).join(' · ')}</p>` : ''}
      </div>
    </div>`;
pages.push({
  file: 'people.html', title: 'People',
  desc: 'The team of the Delft HPT Lab, led by Dr. Edgar Steenstra.',
  body: `
${head('People', 'The team', 'Experimentalists, geochemists and planetary scientists working at the Faculty of Aerospace Engineering of TU Delft.')}
<section>
  <div class="wrap">
    ${personCard(D.people[0], 'lead')}
    <div class="grid g2 team">
      ${D.people.slice(1).map((p) => personCard(p)).join('')}
    </div>
  </div>
</section>
<section class="alt">
  <div class="wrap grid g2">
    <div class="prose"><h2>Join the lab</h2><p>For questions about student projects, positions or collaborations, please contact ${esc(D.site.contact.name)}.</p><p><a class="btn" href="contact.html">Contact</a></p></div>
  </div>
</section>`,
});

/* ---------- Publications ---------- */
const pubItem = (p) => `<li><span class="yr">${p.y}</span>${esc(p.a)}. <i>${esc(p.t)}</i>. ${esc(p.j)}.${p.doi ? ` <a href="https://doi.org/${p.doi}" rel="noopener">doi:${esc(p.doi)}</a>` : ''}</li>`;
pages.push({
  file: 'publications.html', title: 'Publications',
  desc: 'Publications of the Delft HPT Lab and earlier work by its members.',
  body: `
${head('Publications', 'Publications', 'Papers from the laboratory, followed by selected earlier work of lab members.')}
<section>
  <div class="wrap">
    <h2>Group publications</h2>
    <ol class="pubs" reversed>${D.groupPubs.map(pubItem).join('')}</ol>
  </div>
</section>
<section class="alt">
  <div class="wrap">
    <h2>Venus clouds and ionic liquids</h2>
    <p class="muted">Work by Iaroslav Iakubivskyi and co-authors. ${todo('list to confirm')}</p>
    <ul class="pubs">${D.cloudPubs.map(pubItem).join('')}</ul>
  </div>
</section>
<section>
  <div class="wrap">
    <h2>Earlier work by Edgar Steenstra</h2>
    <p class="muted">Compiled from public university profiles. A complete and current list is on <a href="https://scholar.google.nl/citations?user=RnRn5XYAAAAJ&amp;hl=nl" rel="noopener">Google Scholar</a>. ${todo('list and author format to confirm')}</p>
    <ul class="pubs">${D.piPubs.map(([y, a, t, j]) => pubItem({ y, a, t, j })).join('')}</ul>
  </div>
</section>`,
});

/* ---------- News ---------- */
pages.push({
  file: 'news.html', title: 'News',
  desc: 'News from the Delft HPT Lab.',
  body: `
${head('News', 'News', 'Announcements and coverage of the laboratory.')}
<section>
  <div class="wrap grid two">
    ${D.news.map((n) => `<a class="card reveal" href="${n.url}" rel="noopener"><p class="role">${esc(n.date)} · ${esc(n.src)}</p><h3>${esc(n.t)}</h3><p class="muted">${esc(n.d)}</p></a>`).join('')}
  </div>
</section>`,
});

/* ---------- Virtual tour ---------- */
pages.push({
  file: 'tour.html', title: 'Virtual tour',
  desc: 'A virtual tour of the Delft HPT Lab.',
  body: `
${head('Virtual tour', 'Step inside the laboratory', 'A 3D walk-through of the laboratory is in preparation. Until then, here is a look at the instruments.')}
<section>
  <div class="wrap">
    <!-- Virtual tour slot: replace the placeholder below with the 3D viewer embed once the scan is ready. -->
    <div class="tour-slot" id="tour-embed"><div><h3>Virtual tour coming soon</h3><p>A 3D scan of the laboratory will appear here. ${todo('scan to add')}</p></div></div>
  </div>
</section>
<section class="alt">
  <div class="wrap">
    <h2>In the lab</h2>
    <div class="gallery">
      ${D.gallery.map((g) => `<figure class="reveal"><img src="img/${g.img}" alt="${esc(g.alt)}" loading="lazy"><figcaption>${esc(g.cap)}</figcaption></figure>`).join('')}
    </div>
  </div>
</section>`,
});

/* ---------- Contact ---------- */
pages.push({
  file: 'contact.html', title: 'Contact',
  desc: 'Contact details of the Delft HPT Lab at the Faculty of Aerospace Engineering, TU Delft.',
  body: `
${head('Contact', 'Get in touch', 'Questions about the laboratory, collaborations or student projects are welcome.')}
<section>
  <div class="wrap grid g2">
    <div class="card">
      <h3>${esc(D.site.contact.name)}</h3>
      <p class="role">${esc(D.site.contact.role)}</p>
      <p><a href="mailto:${D.site.contact.email}">${D.site.contact.email}</a></p>
      <p>${D.site.contact.address.map(esc).join('<br>')}</p>
      <p><a href="https://www.openstreetmap.org/search?query=Kluyverweg%201%2C%20Delft" rel="noopener">Show on a map</a></p>
    </div>
    <div class="card">
      <h3>Acknowledgements</h3>
      <p>The experimental facilities and research have been supported by:</p>
      <ul class="plain">${D.funders.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <p>${todo('funder list and required acknowledgement wording to confirm')}</p>
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
writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((p) => p.file !== '404.html').map((p) => `  <url><loc>${D.site.url}/${p.file === 'index.html' ? '' : p.file}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${pages.length} pages into ${OUT}/`);
