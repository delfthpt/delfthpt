# Delft High PT Lab website

The website of the TU Delft High-Pressure/Temperature Laboratory for Planetary Materials, published at [delfthpt.com](https://delfthpt.com).

It is a plain static site with no dependencies. All text lives in one file, and the site rebuilds and publishes itself about a minute after every change to the `main` branch.

## Changing the text

Everything a visitor reads is in [`src/data.mjs`](src/data.mjs): the introduction, research themes, projects, people, instruments, shared facilities, publications, news and contact details.

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
| Change the topics of the contact form | `site.contact.form.topics`, and the same list `TOPICS` in `worker/mail.js` |
| Change who can be chosen under "To" in the contact form | `site.contact.form.people` (see "Changing who receives the mail" below) |
| Add or describe a project | the `projects` list |
| Change instrument text or specifications | the `instruments` list |
| Change the shared facilities and in-house manufacturing | `facilities` |
| Change the text about the Venus clouds | `clouds` |
| Change the photos on the Virtual tour page | the `gallery` list |
| Change the texts, the views or the labels of the 3D model | `scan` (see "The virtual tour" below) |
| Change the funder logos at the bottom of every page | `funderLogos`, and the acknowledgement text in `funders` and `euStatement` |
| Change the rotating questions on the home page | the `questions` list |

A list of publications with more than five entries shows about five of them in a frame that scrolls, with a button that opens the whole list. This happens by itself.

## Adding photos

1. Upload the image to [`public/img/`](public/img) (**Add file → Upload files**). Use lowercase file names without spaces, for example `edgar-steenstra.jpg`. About 1400 pixels on the long side is enough.
2. Refer to the file by its name in `src/data.mjs`:
   - a portrait: set `photo: 'edgar-steenstra.jpg'` for that person in `people`. A square photo of at least 400 pixels is shown square. A wider photo, such as one taken in the lab, is shown across the whole column; describe it in `alt`;
   - an instrument photo: set `img: 'file-name.jpg'`, write a short description in `alt` and a caption in `cap` for that instrument in `instruments`;
   - more photos for an instrument: add them to its `extra` list, each with `img`, `alt`, a caption `cap` and a short label `short`;
   - a photo for the Virtual tour page: add it to `gallery`.

Every photo on the Equipment and Virtual tour pages opens large when it is clicked, with its caption. To show more detail there, put a larger version of the photo (up to about 2400 pixels) under the same file name in [`public/img/full/`](public/img/full). A portrait opens large only when it has such a larger version.

Phone photos often hold the place where they were taken. Remove that information before uploading (on a phone: share the photo with the location switched off).

Only use photos the lab owns or has written permission to publish. Manufacturer product photos are copyrighted and need permission from the manufacturer before they can be used here.

## People

Someone with a photo or a biography gets a wide card on the People page: the photo on the left with the fields of expertise (`tags`) and the links under it, the text on the right. Someone without both gets a small card under the others until the details arrive. `links` is a list of pairs, a label and an address, for example `['Google Scholar', 'https://scholar.google.com/...']`. With `contact: 'Name'`, the card gets a **Send a message** link that opens the contact form with that person chosen.

## Review mode

Items that still need to be confirmed or supplied are marked in the source with a review note. Visitors never see these notes. To see them, open the site with `?review=1` at the end of the address, for example `https://delfthpt.com/?review=1`. Yellow marks then show what is open on each page. `?review=0` turns the marks off again.

When an item is settled, remove its `review: '...'` entry from `src/data.mjs`, or the matching `todo(...)` call in `build.mjs`.

## The virtual tour

The Virtual tour page shows a 3D scan of the laboratory. Visitors can turn it and zoom in, every instrument carries a numbered label, and a short tour flies from one instrument to the next. Below the model is the photo gallery (the `gallery` list).

The model is drawn by [`public/js/tour.js`](public/js/tour.js) from the files in [`public/scan/`](public/scan), which hold about 450,000 coloured points in 1.5 MB. They arrive in three parts, and the model shows as soon as the first part is there (0.3 MB). A device that asks to save data, or that has little memory, loads two parts. Until the model is there, and in a browser that cannot draw it, the page shows a still picture of the scan (`public/img/lab-scan.jpg`). Without scripts it shows that picture with the texts of all views.

The tour plays by itself and stops as soon as a visitor takes hold of the model; the Play button starts it again. For visitors who have asked their device for reduced motion, nothing moves until they press Play. The mouse wheel zooms only after a click on the model, so that the page still scrolls past it.

An address can name a view: `delfthpt.com/tour#press` opens the page at the press. The Equipment page links to the model this way.

### Changing the views and the labels

The texts, the views and the places of the labels are in `scan` in [`src/data.mjs`](src/data.mjs). Each entry of `views` is one button under the model. A view with a `spot` also gets a numbered label in the model.

| Setting | Meaning |
| --- | --- |
| `key` | the name of the view in the address (`/tour#press`) |
| `name`, `text` | the label and the text under the model |
| `img`, `alt`, `href`, `more` | a photo beside the text, and a link to the Equipment page |
| `at` | the point the camera looks at, as three numbers in metres: towards the open side on the right, towards the wall with the door, and above the floor. The lines on the floor of the model are one metre apart |
| `look` | the direction of the camera round the room in degrees, its height in degrees (90 is straight from above), and how many metres of the room the picture shows over its shorter side |
| `cut` | how many metres in front of `at` the room is still drawn. What stands nearer to the camera is left away, so that the instrument is in clear view. Leave it out for a view of the whole room |
| `spot` | the point where the label sits: the top of the instrument or a little above it |
| `rest`, `turn` | how many seconds the tour stays in the view, and how many degrees per second the model turns meanwhile |

To find these numbers:

1. Open the Virtual tour page, and turn and zoom the model until it shows what the view should show. A double click on an instrument brings it to the middle.
2. Open the console of the browser (F12, then **Console**) and enter `document.getElementById('tour-embed').scan.where()`.
3. The answer gives `at`, `look` and `cut` of the present view, written the way they stand in `src/data.mjs`. It also gives `picked`, the point of the model that was double-clicked last. For a label, double-click the top of the instrument and use `picked` as its `spot`.

### A new scan

The scan was made with the Scaniverse app and exported as a point cloud (PLY). [`tools/scan/prepare.py`](tools/scan/prepare.py) turns such a file into the files in `public/scan/`. It needs Python 3 with numpy and scipy, and Pillow for the first step (`pip install numpy scipy pillow`). It is not part of the build of the site. Run it from the folder of the repository:

1. `python3 tools/scan/prepare.py scan.ply --look top.png` straightens the scan, so that the floor is level and the walls run along the axes, and saves a view from above with a line every metre.
2. Read from that picture which part of the scan is the room, and put it into `ROOM` at the top of the script. The script leaves out everything outside it, the ceiling, and loose points.
3. `python3 tools/scan/prepare.py scan.ply` writes `public/scan/room-1.bin`, `room-2.bin` and `room-3.bin`, and prints the lines `step`, `origin`, `box` and `parts` for `scan` in `src/data.mjs`.
4. Set `walls` in `scan` to places about 12 cm inside the wall on the left, the wall with the door and the wall with the windows. The model hides a wall when the camera stands behind it.
5. Find the views and the places of the labels again in the new model, as described above.
6. Renew the still picture: pause the tour in the Overview, take a screenshot of the model alone, and save it as `public/img/lab-scan.jpg`, about 1600 by 1000 pixels.

Run on the scan of November 2026, the script reproduces the three published files exactly. How the points are packed is described at `pack` in the script, and `decode` in `tour.js` undoes it.

## The interactive illustrations

The illustrations on the equipment page are drawn by [`public/js/viz.js`](public/js/viz.js). Each one uses a simple, documented model, and the numbers are meant to show the scale of an effect rather than to be used as data:

- **Piston cylinder press**: pressure against depth for each body, from simple interior models. The narrow column shows the whole body from surface to centre, the wide column the part within reach of the press. The slider stops at 3.5 GPa, or at the pressure in the centre of a small body.
- **Rheometer**: the time a sheet of melt 1 m thick needs to cover 100 m on a 1° slope, for the chosen viscosity and gravity. The flow is laminar, with an upper limit on the speed for thin melts, where a real flow turns turbulent. The inset shows the measurement itself: a spindle turning at one speed and the stress read from it.
- **Venus Surface Simulator**: temperature and pressure of the atmosphere of Venus after the Venus International Reference Atmosphere. Pressures are given in bar and in GPa.
- **Gas-mixing furnace**: oxygen fugacity of ideal CO₂–CO mixtures at 1 bar, relative to the iron–wüstite and quartz–fayalite–magnetite buffers. The pressure slider moves only the two buffer lines, after Frost (1991). The furnace itself always works at 1 bar.
- **Venus clouds**: the cloud decks between about 48 and 70 km, and a schematic of how an ionic liquid forms.

Each illustration plays by itself as a short tour of scenes: it glides to a scene, rests there, and goes on to the next one. While it glides, the numbers next to the sliders change in coarse steps and the sentence under the picture already describes the scene it is heading for, so the text stays readable. The room for the longest sentence is reserved, so that nothing below the picture moves.

The button at the top right says what a press will do: **Pause** while anything in the picture moves, **Play** while it rests. A click on the picture does the same as the button.

- **Pause** freezes the picture exactly as it is, and **Play** lets it go on from that same moment. Nothing jumps to another scene.
- Using a control (a planet, a slider) ends the tour and hands the picture over to the visitor: it keeps moving with their values, so the button still says Pause. Pause and then Play give the picture back to the tour. In the lava flow illustration the visitor's own flow first runs to its end before the tour goes on.
- On a phone, a finger that lands on a control while scrolling the page does not count as using it. The tour only ends when a control really changes.
- For visitors who have asked their device for reduced motion, nothing moves until they press Play, and using a control brings back the still picture.

The values, the planetary ranges, the sentences and the scenes of each tour are at the top of each section of that file, so they are easy to correct.

## The contact form and info@delfthpt.com

The site shows no personal email address. Visitors write through the form on the contact page, and the lab has one general address, `info@delfthpt.com`. Both end up in the mailboxes of the lab members.

One small Cloudflare Worker does the work. It is called `delfthpt-mail`, its source is [`worker/mail.js`](worker/mail.js), and it runs in the Cloudflare account that holds the domain (free plan):

- **Mail to `info@delfthpt.com`**: Cloudflare Email Routing hands every message to the Worker, which forwards a copy to each lab member. Email Routing by itself can forward an address to one mailbox only.
- **The contact form**: the contact page posts the form to `https://forms.delfthpt.com/contact`. The Worker checks the message and emails it to the same people, with the visitor's address as reply-to, so that Reply answers the visitor. Nothing is stored.
- **A message for one person**: under **To**, a visitor can choose one lab member instead of the whole team. The message then goes to that person alone. If that mailbox cannot be reached, it goes to the rest of the team, marked for that person, and the visitor is told so.

The mailboxes of the lab members are a setting in Cloudflare. They are not written anywhere in this repository, because the repository is public.

### Changing who receives the mail

In the [Cloudflare dashboard](https://dash.cloudflare.com):

1. **Email Service → Email Routing → Destination addresses → Add address.** Cloudflare sends the new person an email with a **Verify email address** button. Until they press it, they receive nothing.
2. **Workers & Pages → delfthpt-mail → Settings → Variables and secrets**: edit `RECIPIENTS` and deploy. It is a list of entries separated by commas, each one a name with the mailbox in angle brackets, for example `Ada Lovelace <ada@example.org>`.
3. To let visitors write to the new person alone, add the same name to `site.contact.form.people` in `src/data.mjs`, and set `contact: 'that name'` for the person in `people`. The name must be spelled exactly as in `RECIPIENTS`.

To take someone off the list, remove the entry from `RECIPIENTS` and the name from `site.contact.form.people`.

### How it is set up

| Where in Cloudflare | Setting |
| --- | --- |
| Email Routing → Routing rules | `info@delfthpt.com` → Send to a Worker → `delfthpt-mail` |
| Email Routing → Destination addresses | every mailbox in `RECIPIENTS`, verified by its owner |
| Worker → Settings → Variables | `RECIPIENTS` (required); `FROM_ADDRESS` and `ALLOWED_ORIGINS` are optional and described at the top of `worker/mail.js` |
| Worker → Settings → Bindings | Email Service, variable name `MAIL` |
| Worker → Domains | custom domain `forms.delfthpt.com`; the `workers.dev` address is switched off |
| Worker → Settings → Observability | Logs on, **Include Invocation logs** off. With it on, Cloudflare would keep the IP address and location of every visitor who sends the form. |

Form messages are sent from `website@delfthpt.com`. No mailbox is behind that address on purpose, so that automatic replies do not reach the whole team.

Against spam, the form has a hidden field that people never fill in, a minimum time between opening the page and sending, and a limit of 5 messages per visitor and 60 in total per hour. If spam still gets through, [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) can be added to the form and the Worker.

### Changing the Worker

The Worker is managed in the dashboard. After changing `worker/mail.js` here, open **Workers & Pages → delfthpt-mail → Edit code**, replace the code with the new file and press **Deploy**. Someone with access to the Cloudflare account can also run `npx wrangler deploy` in the `worker` folder; [`worker/wrangler.toml`](worker/wrangler.toml) holds the settings for that. Keep the file here and the deployed code the same.

## Working on the site locally

You need [Node.js](https://nodejs.org) 18 or newer. There is nothing to install.

```sh
node build.mjs      # writes the site to ./dist
node preview.mjs    # shows it the way GitHub Pages does; then open http://localhost:8000
```

Page addresses have no `.html`: the People page is `delfthpt.com/people`. The files are still written as `people.html`, GitHub Pages serves them under the short address, and an old address that ends in `.html` is shortened in the browser. Links between pages are written as `/people`, so the site has to be opened through `preview.mjs` (or any server that maps `/people` to `people.html`), not by opening the files from the folder.

| Path | What it is |
| --- | --- |
| `src/data.mjs` | all text content |
| `build.mjs` | page layouts and the generator |
| `public/css/site.css` | styles |
| `preview.mjs` | a small server to look at the built site on your own computer |
| `public/js/site.js` | navigation, home page animation, counters, the large view of photos |
| `public/js/viz.js` | interactive illustrations |
| `public/js/tour.js` | the 3D model on the Virtual tour page |
| `public/js/contact.js` | sends the contact form |
| `worker/` | the Cloudflare Worker behind the contact form and `info@delfthpt.com` (not part of the published site) |
| `public/img/` | photos and the funder logos; `public/img/full/` holds larger versions for the large view |
| `public/scan/` | the 3D scan of the laboratory, packed for the web |
| `tools/scan/prepare.py` | prepares a new 3D scan (not part of the build) |
| `.github/workflows/deploy.yml` | builds and publishes the site |

## Publishing and domain

The site is published by GitHub Pages through the workflow in `.github/workflows/deploy.yml` (repository **Settings → Pages → Source: GitHub Actions**, custom domain `delfthpt.com`).

The domain is managed in Cloudflare. The DNS records point at GitHub Pages and are set to **DNS only** (grey cloud), so that GitHub can issue the HTTPS certificate:

| Type | Name | Value |
| --- | --- | --- |
| A | `delfthpt.com` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA | `delfthpt.com` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www` | `<owner of this repository>.github.io` |

Mail and the contact form add these records. Cloudflare creates and manages them, so they are best left alone:

| Type | Name | Value |
| --- | --- | --- |
| MX | `delfthpt.com` | `route1.mx.cloudflare.net`, `route2.mx.cloudflare.net`, `route3.mx.cloudflare.net` |
| TXT | `delfthpt.com` | `v=spf1 include:_spf.mx.cloudflare.net ~all` |
| TXT | `cf2024-1._domainkey` | the DKIM key of Cloudflare Email Routing |
| Worker | `forms` | `delfthpt-mail` |

The site sets no cookies and loads nothing from other servers. The contact form sends a message to `forms.delfthpt.com` only when a visitor presses **Send message**.
