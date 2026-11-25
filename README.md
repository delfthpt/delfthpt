# Delft High PT Lab website

The website of the TU Delft High-Pressure/Temperature Laboratory for Planetary Materials, published at [delfthpt.com](https://delfthpt.com).

It is a plain static site with no dependencies. All text lives in one file, and the site rebuilds and publishes itself about a minute after every change to the `main` branch.

## Changing the text

Everything a visitor reads is in [`src/data.mjs`](src/data.mjs): the introduction, research themes, projects, people, instruments, publications, news and contact details.

1. Open `src/data.mjs` on GitHub and click the pencil icon.
2. Edit the text between the quotation marks. Keep the quotation marks and commas as they are.
3. Click **Commit changes**. The site updates by itself; progress is shown under the **Actions** tab.

Typical edits:

| To do this | Edit this in `src/data.mjs` |
| --- | --- |
| Add or change a team member | the `people` list |
| Add a news item | the `news` list (newest first) |
| Add a paper of the group | `groupPubs` (newest first) |
| Add earlier work of a lab member | `cloudPubs`, `missionPubs` or `piPubs` (newest first) |
| Add or describe a project | the `projects` list |
| Change instrument text or specifications | the `instruments` list |
| Change the rotating questions on the home page | the `questions` list |

## Adding photos

1. Upload the image to [`public/img/`](public/img) (**Add file → Upload files**). Use lowercase file names without spaces, for example `edgar-steenstra.jpg`. Portraits look best square, at least 600 pixels wide.
2. Refer to the file by its name in `src/data.mjs`:
   - a portrait: set `photo: 'edgar-steenstra.jpg'` for that person in `people`;
   - an instrument photo: set `img: 'file-name.jpg'` and write a short description in `alt` for that instrument in `instruments`.

Only use photos the lab owns or has written permission to publish. Manufacturer product photos are copyrighted and need permission from the manufacturer before they can be used here.

## Review mode

Items that still need to be confirmed or supplied are marked in the source with a review note. Visitors never see these notes. To see them, open the site with `?review=1` at the end of the address, for example `https://delfthpt.com/?review=1`. Yellow marks then show what is open on each page. `?review=0` turns the marks off again.

When an item is settled, remove its `review: '...'` entry from `src/data.mjs`, or the matching `todo(...)` call in `build.mjs`.

## The virtual tour

The page `tour.html` has a reserved slot for a 3D walk-through of the laboratory. In [`build.mjs`](build.mjs), look for the comment `Virtual tour slot` and replace the placeholder inside `<div class="tour-slot" id="tour-embed">` with the viewer embed once the scan is ready.

## The interactive illustrations

The illustrations on the equipment page are drawn by [`public/js/viz.js`](public/js/viz.js). Each one uses a simple, documented model, and the numbers are meant to show the scale of an effect rather than to be used as data:

- **Piston cylinder press**: pressure against depth for each body, from simple interior models.
- **Rheometer**: speed of a laminar sheet flow 1 m thick on a 1° slope, for the chosen viscosity and gravity.
- **Venus Surface Simulator**: temperature and pressure of the atmosphere of Venus after the Venus International Reference Atmosphere.
- **Gas-mixing furnace**: oxygen fugacity of ideal CO₂–CO mixtures at 1 bar, relative to the iron–wüstite and quartz–fayalite–magnetite buffers.
- **Venus clouds**: the cloud decks between about 48 and 70 km, and a schematic of how an ionic liquid forms.

The values and planetary ranges are at the top of each section of that file, so they are easy to correct.

## Working on the site locally

You need [Node.js](https://nodejs.org) 18 or newer. There is nothing to install.

```sh
node build.mjs                      # writes the site to ./dist
python3 -m http.server -d dist 8000 # then open http://localhost:8000
```

| Path | What it is |
| --- | --- |
| `src/data.mjs` | all text content |
| `build.mjs` | page layouts and the generator |
| `public/css/site.css` | styles |
| `public/js/site.js` | navigation, home page animation, counters |
| `public/js/viz.js` | interactive illustrations |
| `public/img/` | photos |
| `.github/workflows/deploy.yml` | builds and publishes the site |

## Publishing and domain

The site is published by GitHub Pages through the workflow in `.github/workflows/deploy.yml` (repository **Settings → Pages → Source: GitHub Actions**, custom domain `delfthpt.com`).

The domain is managed in Cloudflare. The DNS records point at GitHub Pages and are set to **DNS only** (grey cloud), so that GitHub can issue the HTTPS certificate:

| Type | Name | Value |
| --- | --- | --- |
| A | `delfthpt.com` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA | `delfthpt.com` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www` | `<owner of this repository>.github.io` |

The site sets no cookies and loads nothing from other servers.
