// All text content of the site lives in this file, so lab members can edit it without touching the layout.
// After editing, the site rebuilds and publishes itself (see README.md).
//
// `review: '...'` adds a yellow review mark. Review marks are hidden for visitors and only
// show when the site is opened with ?review=1 at the end of the address.

export const site = {
  name: 'Delft High PT Lab',
  full: 'TU Delft High-Pressure/Temperature Laboratory for Planetary Materials',
  url: 'https://delfthpt.com',
  tagline: 'We recreate the pressures, temperatures and atmospheres of other worlds to understand how planets form and evolve.',
  contact: {
    name: 'Dr. Edgar S. Steenstra',
    role: 'Assistant Professor, principal investigator',
    address: [
      'TU Delft, Faculty of Aerospace Engineering',
      'Department of Space Engineering',
      'Section Planetary Exploration',
      'Building 62, room N2.32',
      'Kluyverweg 1, 2629 HS Delft, The Netherlands',
    ],
    // The contact form. Messages go by email to the lab team (see README.md, "The contact form and info@delfthpt.com").
    // The topics must be the same as the TOPICS list in worker/mail.js.
    // `people` are the lab members who receive the messages. A visitor can also write to one of them only.
    // Spell each name exactly as in the RECIPIENTS setting of the mail service (see README.md); a name
    // that is not found there sends the message to the whole team.
    form: {
      endpoint: 'https://forms.delfthpt.com/contact',
      email: 'info@delfthpt.com',
      topics: ['General question', 'Collaboration', 'Student project or position', 'Media', 'Other'],
      people: ['Edgar Steenstra', 'Iaroslav Iakubivskyi', 'Guus Aerts', 'Jaap Jorritsma', 'Anneke Royakkers'],
    },
  },
};

// Page addresses have no ".html": /people, /contact and so on.
export const nav = [
  ['Home', '/'],
  ['Research', '/research'],
  ['Equipment', '/equipment'],
  ['People', '/people'],
  ['Publications', '/publications'],
  ['News', '/news'],
  ['Virtual tour', '/tour'],
  ['Contact', '/contact'],
];

// Rotating questions on the home page.
export const questions = [
  'How did Venus become so different from Earth?',
  'What happens to rock a hundred kilometres below the surface?',
  'How do lavas flow on worlds we cannot visit?',
  'How do planets build their cores?',
  'What do volcanoes feed into an atmosphere?',
  'Can liquids other than water persist on other worlds?',
];

export const intro = [
  'Welcome! In the TU Delft High-Pressure/Temperature Laboratory for Planetary Materials we investigate the physical and chemical processes that shape planets, moons, and their interiors. By recreating extreme conditions in the laboratory, we study how planetary materials behave under the pressures, temperatures, and chemical environments encountered during planetary formation and evolution.',
  'Our research combines experimental petrology, high-temperature geochemistry, and materials science to investigate planetary differentiation, melting and crystallisation, magma rheology, volatile element cycling, and interactions between planetary interiors and atmospheres. Our experiments address fundamental questions about the evolution of rocky planets such as Venus, Earth, and Mars, as well as the materials and processes relevant to icy worlds and other planetary bodies.',
  'In materials science and green steelmaking, we investigate high-temperature processes, melt properties, and chemical interactions that influence material production and processing. Our experimental approach helps establish the relationships between composition, temperature, atmosphere, and material behaviour, providing fundamental insights relevant to developing more sustainable metallurgical processes.',
  'The laboratory brings together specialised experimental facilities for high-pressure and high-temperature experiments, controlled-atmosphere melting, and the characterisation of the thermal and rheological properties of planetary materials. By systematically varying experimental conditions and chemical compositions, we generate new insights into processes that cannot be directly observed in planetary interiors.',
  'Located within the Faculty of Aerospace Engineering at TU Delft, the laboratory bridges fundamental experimental research and planetary exploration. Our results help interpret spacecraft observations, develop models of planetary evolution, and improve our understanding of worlds beyond Earth.',
];
export const goal = 'Our goal is to understand how planetary materials behave under extreme conditions and how these processes shape the worlds we explore.';

export const stats = [
  { v: 3.5, dec: 1, unit: 'GPa', label: 'pressure in the piston cylinder press' },
  { v: 1730, unit: '°C', label: 'sample temperature in the rheometer' },
  { v: 1200, unit: '°C', label: 'temperature in the Venus Surface Simulator' },
  { v: 150, unit: 'bar', label: 'gas pressure in the Venus Surface Simulator' },
];

export const themes = [
  { id: 'venus', t: 'Venus: interior, surface and atmosphere',
    d: 'Volcanic degassing, surface weathering and the cycling of volatile elements on our sister planet.',
    long: 'How strongly does the hot, corrosive atmosphere of Venus weather its surface, and what did its volcanoes add to that atmosphere over time? We study volcanic degassing, surface weathering and the cycling of volatile elements between the interior, surface and atmosphere of Venus, in support of missions such as EnVision, DAVINCI and VERITAS.' },
  { id: 'differentiation', t: 'Planetary differentiation',
    d: 'Core formation, melting and crystallisation in rocky planets, moons and asteroids.',
    long: 'Core formation, magma ocean crystallisation and the partitioning of elements between metal, sulfide and silicate tell us how rocky bodies such as the early Earth, the Moon, Mars, Mercury and Vesta acquired their layered interiors and their present compositions.' },
  // "Lava" in the title, because the flows we study are at the surface. "Magma" in the text is melt below the surface.
  { id: 'rheology', t: 'Lava rheology and volcanism',
    d: 'How easily silicate, metal, salt and sulfate melts flow, and what that means for volcanic processes.',
    long: 'The viscosity of a melt controls how magma rises, erupts and spreads. We measure the flow behaviour of silicate melts as well as metal, slag, salt and sulfate melts at temperatures up to 1730 °C and under controlled atmospheres, providing data relevant to magma mobility and volcanic processes.' },
  { id: 'clouds-theme', t: 'Clouds and unconventional liquids',
    d: 'Sulfuric acid chemistry and ionic liquids relevant to the clouds of Venus.',
    long: 'The clouds of Venus are made of concentrated sulfuric acid. We study the chemistry of this environment, including ionic liquids: salts that stay liquid over a wide range of temperatures and may form where sulfuric acid meets nitrogen-bearing organic compounds.',
    link: ['See the Venus cloud experiment', '/equipment#clouds'] },
  { id: 'materials', t: 'Materials science and green steelmaking',
    d: 'Melt properties and high-temperature reactions for more sustainable metallurgical processes.',
    long: intro[2] },
];

// Project names follow the list provided by the PI. Descriptions come from public announcements where available.
export const projects = [
  { id: 'venusvolatmos', name: 'VenusVolAtmos', funder: 'ERC Starting Grant', year: '2023',
    d: 'Volatile Element Cycles on Venus: Implications for the Evolution of Venus’ Greenhouse-Dominated Atmosphere. High-pressure, high-temperature experiments and numerical models address surface weathering, volcanic degassing and the early development of the atmosphere of Venus.',
    src: 'https://tudelft.nl/en/2023/lr/erc-starting-grant-for-edgar-steenstra-a-lifelong-dream-of-mine', srcLabel: 'Announcement' },
  { id: 'phosphorus', name: 'Venus Phosphorus', funder: 'NWO XS', year: '2025',
    d: 'Volcanic degassing of phosphorus on Venus and implications for cloud habitability. Systematic high-temperature experiments on how phosphorus degasses from Venus-like lavas, a possible route for this element to reach the clouds.',
    src: 'https://research.tudelft.nl/en/prizes/nwo-xs-grant-2025/', srcLabel: 'Grant record' },
  { id: 'atmosphere', name: 'Venus Atmosphere', funder: 'NWO GO', year: '2026',
    d: 'Unravelling Venus’ atmospheric evolution: from laboratory experiments to future missions. New experiments at extreme pressure and temperature address the composition and dynamics of the lower atmosphere of Venus and its interaction with the rocky surface, in support of future missions such as DAVINCI.',
    src: 'https://www.tudelft.nl/en/2026/lr/nwo-funding-for-three-planetary-science-projects', srcLabel: 'Announcement' },
  { id: 'canali', name: 'Probing Venus’ Unique Evolution Through Experiments on the Formation and Development of Canali Channels', funder: 'NWO M-Invest', year: '2024',
    d: 'Research investment to acquire additional laboratory equipment for experimental investigations into the formation and evolution of Canali channels on Venus, providing new insights into volcanic processes and the geological evolution of the planet.' },
  { id: 'zircons', name: 'Novel Constraints on Reading the Isotope and Trace-Element Signatures of Hadean Zircons', funder: 'NWO NWA-ORC PRELIFE', year: '2024–2029',
    d: 'Research project within the interdisciplinary PRELIFE consortium, funded by the Dutch Research Council (NWO). The project combines experimental petrology, geochemistry and isotope analysis to develop new approaches for interpreting the chemical signatures preserved in Hadean zircons. By investigating trace-element and isotopic systematics in these ancient minerals, the research aims to reconstruct the conditions and evolution of Earth’s earliest crust, providing new insights into the development of a habitable early Earth.' },
  { id: 'steel', name: 'Green Steelmaking', funder: 'M2i', year: '',
    d: 'High-temperature processes, melt properties and chemical interactions relevant to more sustainable metallurgical processes.', review: 'description to add' },
];

// The home page shows the descriptions. The research page shows the names only.
export const worlds = [
  { id: 'venus', name: 'Venus', d: 'Our main focus: volcanism, surface weathering and the exchange of volatiles between interior, surface, atmosphere and clouds.' },
  { id: 'earth', name: 'Earth', d: 'The earliest crust and the conditions on the early Earth, read from the chemistry of Hadean zircons.', review: 'wording to confirm' },
  { id: 'moon', name: 'Moon', d: 'Core formation and the crystallisation of the lunar magma ocean.' },
  { id: 'mars', name: 'Mars', d: 'Earlier work on the composition of the core and the depletion of volatile elements in the mantle.', review: 'wording to confirm' },
  { id: 'mercury', name: 'Mercury', d: 'Differentiation of a planet that formed under highly reduced conditions.' },
  { id: 'asteroid', name: 'Asteroids', d: 'Core formation in Vesta and the loss of volatile elements from molten, metal-rich planetesimals.' },
];

// Add a portrait by placing a file in public/img and setting photo: 'filename.jpg'. A square photo is shown
// square, a wider one (such as a photo in the lab) across the whole column. `alt` describes the photo for
// people who cannot see it. A larger version under the same name in public/img/full opens when the portrait is clicked.
// `contact` is the person's name in the contact form (site.contact.form.people). With it, the card on the
// People page gets a link that opens the form with this person chosen.
// People with a photo or a biography get a wide card; the others follow in small cards until their details arrive.
// The cards appear in the order of this list. The lab chose it on 27 November 2026: Edgar first, then the PhD candidates
// with women and men in turn, then Iaroslav. `review` puts a mark behind the biography in review mode.
export const people = [
  { name: 'Dr. Edgar Steenstra', contact: 'Edgar Steenstra', role: 'Principal investigator, Assistant Professor', init: 'ES', photo: 'edgar-steenstra.jpg',
    bio: 'Edgar is an Assistant Professor in Planetary Exploration at Delft University of Technology specialising in experimental geochemistry and planetary evolution. His group’s research investigates the formation and differentiation of rocky planets, the chemical evolution of planetary interiors and atmospheres, and the processes shaping Venus, Moon and the Earth. Using high-pressure and high-temperature experiments, his group recreates extreme planetary conditions in the laboratory to investigate volcanic processes, volatile element cycling, and planetary formation. He leads the development of specialised experimental facilities at TU Delft and contributes to the preparation of future planetary exploration missions.',
    tags: ['High-pressure, high-temperature experiments', 'Geochemistry', 'EPMA', 'LA-ICP-MS'],
    links: [['Google Scholar', 'https://scholar.google.nl/citations?user=RnRn5XYAAAAJ&hl=nl'], ['TU Delft profile', 'https://tudelft.nl/en/staff/e.s.steenstra']] },
  { name: 'Anneke Royakkers, MSc', contact: 'Anneke Royakkers', role: 'PhD candidate', init: 'AR', photo: null,
    bio: 'Anneke is a first-year PhD candidate who studies the chemical signatures in zircon minerals from early Earth and the early Moon to get a better understanding of the effects of melt composition, pressure, temperature, and water content on the isotope fractionation in the mineral zircon, which will provide new information on the environment during the Hadean. She is currently investigating the timing of zircon crystallization in the Lunar Magma Ocean to get a better understanding of the age and the evolution of the early Moon. She conducts high-pressure and high-temperature experiments and studies the isotopic fractionation of the major and trace elements in zircon with advanced geochemical techniques.',
    tags: ['High-pressure, high-temperature experiments', 'Geochemistry', 'EPMA analyses', 'LA-ICP-MS'],
    links: [['Google Scholar', 'https://scholar.google.com/citations?user=xsm7ha4AAAAJ'], ['ORCID', 'https://orcid.org/0009-0007-7626-5880']] },
  { name: 'Guus Aerts, MSc', contact: 'Guus Aerts', role: 'PhD candidate', init: 'GA', photo: 'guus-aerts.jpg',
    bio: 'Guus started his PhD in September 2024, after doing a Bachelor and Master of Science at the Vrije Universiteit, Amsterdam. He studied Geology & Geochemistry, specialising in the Petrology and Planetary Science tracks, and completing his thesis under Prof. Dr. Wim van Westrenen. Now based in Delft within Dr. Steenstra’s group, Guus uses high-pressure and high-temperature experiments to study volcanic processes on Venus. His current research focuses on the volcanic outgassing of phosphorus, carbonate melts as a potential source for the Venusian canali, and the viscosity of partial melts in the Venusian crust.',
    tags: ['High-pressure, high-temperature experiments', 'Geochemistry', 'EPMA'] },
  { name: 'Racheda Melloul, MSc', role: 'PhD candidate', init: 'RM', photo: 'racheda-melloul.jpg',
    bio: 'Racheda is a new PhD candidate whose work focuses on the thermodynamic behaviour of tramp elements in green steel production. Her project investigates how these elements partition between molten steel, slag and vapour, combining high-temperature experiments, in the Delft laboratory and at an industrial partner, with thermodynamic modelling to support more sustainable steelmaking. Data of this kind are also used in planetary science, and vice versa. She studied Materials Science and Engineering at the National Polytechnic School of Algiers, followed by a Research Master’s in Materials for Energy and Transport at Paris-Saclay University. For her Master’s thesis at CNRS she worked on the nanostructuring and experimental characterisation of thermoelectric alloys, and she has since contributed to international R&D projects in metallurgy, for instance on material durability and integrity and on metal–metal and gas–metal interactions for industrial decarbonisation.',
    tags: ['High-temperature experiments', 'Thermodynamic modelling', 'Metallurgy', 'Materials characterisation'],
    review: 'bio, expertise and photo to confirm' },
  { name: 'Jaap Jorritsma, MSc', contact: 'Jaap Jorritsma', role: 'PhD candidate', init: 'JJ', photo: 'jaap-jorritsma.jpg',
    bio: 'Jaap is a 3rd year PhD researcher who is experimentally investigating the sulphur fluxes between the crust and atmosphere of Venus. In his MSc thesis at the VU, he studied the feasibility of ferrovolcanism on 16 Psyche.',
    tags: ['High-pressure, high-temperature experiments', 'EPMA analysis', 'Volcanism', 'Evaporation thermodynamics'] },
  { name: 'Dr. Iaroslav Iakubivskyi', contact: 'Iaroslav Iakubivskyi', role: 'Postdoctoral researcher', init: 'II', photo: 'iaroslav-iakubivskyi.jpg',
    alt: 'Iaroslav Iakubivskyi in a white lab coat, with safety goggles pushed up and a respirator around his neck, beside a fume hood with glass flasks',
    bio: 'Dr. Iaroslav Iakubivskyi is a Ukrainian planetary scientist and space technologist working to expand the chemical parameter space for life, from water-centric to solvent-diverse planetary environments. At Tartu Observatory in Estonia he worked on (i) electric solar wind sail and plasma brake experiments for the ESTCube-2 (launched in 2023) and FORESAIL-1 (launched in 2022) satellites, and (ii) the OPIC instrument on board the Comet Interceptor mission (launch planned for 2028–2029). From 2022 to 2026 he worked at MIT with Sara Seager on the Morning Star Missions to Venus, combining lab chemistry, instruments and fieldwork. He helped show that sulfuric acid, which makes up Venus’s clouds, reacts with nitrogen-bearing organics to form ionic liquids, a possible solvent for life. He also developed the Venus Cloud Catcher, worked with the Autofluorescence Nephelometer for Rocket Lab’s Venus probe, and did fieldwork at planetary analogues from Kīlauea and Kawah Ijen to lava tubes in Iceland and the Azores. For the Berggruen Institute’s art-science project Proxima Kósmos, he co-designed the speculative planet Phaínōterra and presented at the project’s public launch at the Getty PST Open House in Los Angeles. He is now a postdoctoral researcher at TU Delft, working on Venus surface–atmosphere geochemistry and planetary ionic liquids.',
    tags: ['Venus clouds', 'Ionic liquids', 'Sulfuric acid chemistry', 'Molecular spectroscopy', 'Electron microscopy', 'Space instrumentation'],
    links: [['www.iaro.space', 'https://www.iaro.space'], ['Google Scholar', 'https://scholar.google.com/citations?user=wU0AEWMAAAAJ']] },
];

// Each instrument: `card` is the line on the home page, `img` the main photo with its description `alt` and caption `cap`.
// `extra` are small photos under the main one: `short` is the label under the thumbnail, `cap` the caption in the
// large view. Every photo opens large when clicked. A larger version of a photo can be placed in public/img/full
// under the same file name, and is then used for the large view.
export const instruments = [
  { id: 'press', name: 'End-Loaded Piston Cylinder Press', short: 'Piston cylinder press', card: 'Up to 3.5 GPa and 1600 °C',
    img: 'piston-cylinder-press.jpg',
    alt: 'The end-loaded piston cylinder press with its pressure gauges and control panel',
    cap: 'The end-loaded piston cylinder press.',
    extra: [
      { img: 'run-product-silicate-melt.jpg', short: 'Silicate melt and gas', alt: 'Annotated greyscale electron image of a sample capsule that holds a rounded pool of silicate melt and a gas bubble',
        cap: 'Electron image of an experiment at 1300 °C and 0.85 GPa (composition OIB+Ca): silicate melt (SM) and gas inside the sample capsule.', review: 'caption to confirm' },
      { img: 'run-product-carbonate-melt.jpg', short: 'Carbonate melt', alt: 'Annotated greyscale electron image of a sample with a layer of carbonate melt above silicate crystals and pockets of silicate melt',
        cap: 'Electron image of an experiment at 1100 °C and 1.7 GPa (composition OIB+Na): carbonate melt, silicate melt and silicate crystals inside the sample capsule.', review: 'caption to confirm' },
      { img: 'run-product-bse.jpg', short: 'Crystals in a sample', alt: 'Greyscale electron microscope image showing angular crystals in a fine-grained matrix',
        cap: 'Electron microscope image of an experimental sample.', review: 'caption to confirm' },
      { img: 'capsule-welder.jpg', short: 'Capsule welding', alt: 'A precision welder and a stereo microscope on a workbench',
        cap: 'Precision welder with a stereo microscope, used to weld the platinum sample capsules for the piston cylinder press.' },
    ],
    specs: [['Up to 3.5 GPa', 'pressure'], ['Up to 1600 °C', 'temperature']],
    text: 'The Bristol-type end-loaded piston-cylinder press is a high-pressure experimental apparatus used to investigate the physical and chemical properties of planetary materials under conditions relevant to planetary interiors. The design enables high-pressure and high-temperature experiments on geological materials, including silicate rocks, minerals, and metal alloys, up to 3.5 GPa and 1600°C. The system is suitable for investigating phase equilibria, melting relations, mineral stability, and chemical partitioning under controlled pressure and temperature conditions. It supports experimental studies of planetary differentiation, magma generation, and the evolution of rocky bodies, including Earth, Venus, Mars, and planetary interiors more broadly. Within the planetary materials laboratory, the press provides an experimental platform for reproducing shallow to deep-interior conditions, depending on the planetary body, and constraining the processes that govern their formation and evolution.',
    vizTitle: 'How deep does the press take us?',
    vizFallback: 'At its maximum of 3.5 GPa the press reproduces the pressure roughly 110 km inside the Earth, about 280 km inside Mars and about halfway to the centre of the Moon.',
    vizNote: 'Depths are approximate and follow simple interior models of each body. Layer boundaries are schematic. The narrow column shows the whole body from the surface to the centre, and the wide column enlarges the part that the press can reach.' },
  { id: 'rheometer', name: 'Anton Paar FRS 1800 Gas-Tight Rheometer', short: 'High-temperature rheometer', card: 'Up to 1730 °C under controlled atmosphere',
    img: 'rheometer-frs1800.jpg',
    alt: 'The Anton Paar FRS 1800 furnace rheometer system in its safety enclosure, next to its control computer',
    cap: 'The Anton Paar FRS 1800 rheometer.',
    specs: [['Up to 1730 °C', 'sample temperature'], ['Rotation and oscillation', 'measurement modes'], ['Gas-tight', 'controlled atmosphere']],
    text: 'The Anton Paar FRS 1800 is a state-of-the-art high-temperature rotational rheometer designed to measure the viscosity and rheological properties of molten materials under controlled atmospheric conditions. The system enables measurements at sample temperatures up to 1730°C, making it suitable for investigating the flow behaviour of silicate melts, including planetary magmas, as well as metal, slag, salt and sulfate melts. The rheometer supports both rotational and oscillatory measurements, allowing the characterization of material viscosity and viscoelastic behaviour across a wide range of conditions. Its controlled-atmosphere capability enables experiments using selected gas environments, supporting investigations of the influence of atmospheric composition on melt properties. Within the planetary materials laboratory, the rheometer is used to constrain the rheological behaviour of planetary materials at high temperatures, providing experimental data relevant to magma mobility, volcanic processes, and the evolution of (shallow) planetary interiors.',
    vizTitle: 'How does a melt flow on another world?',
    vizFallback: 'Viscosity decides whether a melt races downhill or barely moves. The same lava flows more slowly where gravity is weaker.',
    vizNote: 'Flow times are estimates for a sheet of melt 1 m thick on a 1° slope: flow in layers for stiff melts, and the limit set by turbulence for thin ones. They only indicate the scale of the effect, because real lava also cools and stiffens on its way. In the instrument the speed of the spindle is adapted to the melt. The inset keeps one speed, so that the measured stress can be compared.' },
  { id: 'sta', name: 'Linseis STA HP3 TGA-DSC “Venus Surface Simulator”', short: 'Venus Surface Simulator', card: 'Up to 1200 °C and 150 bar',
    img: 'venus-surface-simulator.jpg',
    alt: 'The Linseis STA HP3 thermal analyser on a stone bench, with its gas lines and control units below',
    cap: 'The Linseis STA HP3, the “Venus Surface Simulator”.',
    extra: [{ img: 'venus-surface-simulator-vessel.jpg', short: 'Close-up', alt: 'Close view of the instrument: a grey metal block with a cylindrical head that carries a warning label',
      cap: 'Close-up of the Venus Surface Simulator. The label warns that all humidity must be removed before experiments with CO₂, because of the risk of corrosion.' }],
    specs: [['Up to 1200 °C', 'temperature'], ['Up to 150 bar', 'pressure'], ['TGA and DSC', 'mass and heat flow together']],
    text: 'The LINSEIS STA HP3 is a simultaneous thermal analysis system designed to investigate the thermal properties and behaviour of materials under controlled experimental conditions, up to 1200 °C and 150 bar. By combining thermogravimetric analysis (TGA) and differential scanning calorimetry (DSC), the instrument measures changes in sample mass and heat flow as a function of temperature and time. The system enables the characterization of thermal stability, decomposition, oxidation, phase transitions, and endothermic or exothermic reactions. Its high-temperature capabilities make it suitable for investigating geological and planetary materials, including minerals, rocks, and synthetic analogues, under controlled atmospheric conditions. In fact, the hostile conditions at the surface of Venus can be directly reproduced within the set-up. Within the planetary materials laboratory, the instrument supports studies of the thermal evolution and chemical stability of planetary materials, helping constrain processes such as mineral transformations, volatile release, and high-temperature reactions relevant to planetary interiors and surfaces.',
    vizTitle: 'Which worlds fit inside the instrument?',
    vizFallback: 'The surface of Venus, at about 460 °C and 92 bar, lies well inside the range of the instrument, as does the whole lower atmosphere up to the cloud base.',
    vizNote: 'Venus atmosphere values are approximate, after the Venus International Reference Atmosphere. The shaded box uses the listed maxima of the instrument. The axis on the right gives the same pressures in GPa, the unit used for the press: 150 bar is 0.015 GPa.' },
  { id: 'furnace', name: 'Carbolite Gero Gas-Mixing Furnace', short: 'Gas-mixing furnace', card: 'CO₂, CO and SO₂ at controlled oxygen fugacity',
    img: 'gas-mixing-furnace.jpg',
    alt: 'The Carbolite Gero vertical tube furnace next to a window, with its controller in front and the gas cabinet on the right',
    cap: 'The Carbolite Gero gas-mixing furnace with its controller.',
    extra: [{ img: 'wire-loop-samples.jpg', short: 'Samples on a wire loop', alt: 'A thin wire loop holding several small glassy beads', cap: 'Sample beads suspended from a wire loop.', review: 'caption to confirm' }],
    specs: [['CO₂, CO, SO₂', 'and inert gases'], ['Oxygen fugacity', 'set by the gas mixture'], ['Gas–melt reactions', 'at high temperature']],
    text: 'The Carbolite Gero gas-mixing furnace is a high-temperature experimental system designed to investigate the behaviour of planetary materials under controlled atmospheric conditions. By combining precise temperature control with regulated gas delivery, the furnace enables experiments under atmospheres with tailored chemical compositions and oxygen fugacities. The system can be operated with a range of gases, including CO₂, CO, SO₂, and inert gases, depending on the experimental configuration. This capability allows for investigating the effects of atmospheric composition and redox conditions on melting, mineral stability, oxidation, reduction, and gas–melt interactions. Within the planetary materials laboratory, the furnace supports experimental simulations of environments relevant to rocky planets, including the CO₂-rich atmosphere of Venus. It provides a platform for studying high-temperature chemical processes, the stability of planetary materials, and interactions between silicate melts and controlled gas atmospheres.',
    vizTitle: 'Mixing the gas of another world',
    vizFallback: 'The ratio of CO₂ to CO in the furnace sets how oxidising the gas is. Different mixtures match the interiors of the Moon, Mars or the Earth.',
    vizNote: 'Oxygen fugacity is calculated for ideal CO₂–CO mixtures at 1 bar, the pressure at which the furnace works, and shown relative to the iron–wüstite (IW) and quartz–fayalite–magnetite (QFM) buffers at 1 bar. The pressure slider only moves these two reference lines, after Frost (1991), to show how they shift inside a planet. Planetary ranges are indicative literature values.',
    // A short explanation shown in a box under the illustration.
    explain: { t: 'What is oxygen fugacity?', review: 'text to confirm', p: [
      'Oxygen fugacity (fO₂) tells how much oxygen is available to react, written as the pressure that oxygen gas would have in balance with the material. It decides, for example, whether iron occurs as metal, as FeO or as Fe₂O₃.',
      'In a gas, the mixture sets it directly: here the ratio of CO₂ to CO. A melt takes over the value of the gas around it and records it in its proportion of Fe²⁺ to Fe³⁺. In solids, reactions between minerals fix it, such as iron with wüstite (IW) or quartz and fayalite with magnetite (QFM), which is why these sets of minerals serve as reference lines.',
    ] } },
];

export const clouds = {
  text: [
    'Between about 48 and 70 km above its surface, Venus is wrapped in clouds of concentrated sulfuric acid. Near 55 km the temperature and pressure are similar to those at the surface of the Earth, which makes this layer a prime target for future atmospheric probes.',
    'Laboratory experiments have shown that sulfuric acid can dissolve nitrogen-bearing organic compounds and, once the excess acid evaporates, leave behind an ionic liquid: a salt that stays liquid over a wide range of temperatures and barely evaporates. In the laboratory we test such liquids under conditions relevant to the clouds of Venus.',
    'What happens when such a liquid meets water? Experiments and simulations show that a hydrogen sulfate ionic liquid takes up water evenly until there are about three water molecules for every ion pair. With more water it does not simply dissolve: it gathers into aggregates about 10 nanometres across that persist in the water (Iakubivskyi et al. 2025).',
  ],
  photo: { img: 'ionic-liquid-mars-soil.jpg', alt: 'A small heap of rust-coloured soil with dark, glossy droplets at its edge',
    cap: 'Droplets of an ionic liquid on Mars soil simulant.', review: 'caption to confirm' },
  fallback: 'The cloud decks of Venus span roughly 48 to 70 km altitude, from about 90 °C at the base to about −40 °C at the top.',
  note: 'Atmosphere values are approximate, after the Venus International Reference Atmosphere. The droplet sequence on the right shows a laboratory process and runs on its own: it does not depend on the altitude chosen with the slider. Agrawal et al. (2025) describe it for conditions from about 27 °C at 10⁻⁷ atm to 80–200 °C at 0.01 atm.',
  refs: [
    ['Agrawal et al. 2025, PNAS', 'https://doi.org/10.1073/pnas.2425520122'],
    ['Iakubivskyi et al. 2025, Planet. Sci. J.', 'https://doi.org/10.3847/PSJ/ae260d'],
    ['Iakubivskyi et al. 2024, Scientific Reports', 'https://doi.org/10.1038/s41598-024-80847-8'],
    ['Seager et al. 2026, Life', 'https://doi.org/10.3390/life16030408'],
  ],
};

// Shown on the equipment page after the instruments.
export const facilities = {
  title: 'Sample preparation, shared facilities and in-house manufacturing',
  lead: 'Experiments need more than the main instruments. Samples are prepared and stored at our own bench, analysed with the shared instruments of the faculty, and custom parts are made in-house.',
  photo: { img: 'sample-preparation-bench.jpg', alt: 'A laboratory bench with a drying oven, a stereo microscope and two tall storage cabinets',
    cap: 'The sample preparation bench, with a drying oven, a stereo microscope, desiccators and sample storage.' },
  groups: [
    { t: 'Sample preparation', d: 'A stereo microscope, a drying oven, desiccators and dry storage for starting materials and finished experiments. Platinum sample capsules for the press are welded shut with a precision welder under a microscope.' },
    { t: 'Analysis in shared facilities', d: 'Raman spectroscopy, Fourier-transform infrared spectroscopy (FTIR) and scanning electron microscopy (SEM), together with general techniques such as X-ray diffraction, thermal analysis and optical and confocal microscopy.' },
    { t: 'In-house manufacturing', d: 'A large 3D printing laboratory and a workshop for machine parts and moulds, so that custom parts for the experiments can be designed and made on site.' },
  ],
  links: [
    ['Aircraft Hall (DASML) of the Faculty of Aerospace Engineering', 'https://www.tudelft.nl/en/ae/organisation/departments/dasml'],
    ['Material Physics Lab', 'https://www.tudelft.nl/lr/organisatie/afdelingen/aerospace-structures-and-materials/novel-aerospace-materials/facilities/material-physics-lab'],
  ],
  review: 'list of techniques to confirm',
};

export const groupPubs = [
  { y: 2026, a: 'G. Aerts, J. Jorritsma, J. Berndt, S. Klemme, E.S. Steenstra', t: 'Experiments on P evaporation from silicate melt and implications for atmosphere-interior volatile exchange on Venus and other terrestrial bodies', j: 'Earth Planet. Sci. Lett., under review' },
  { y: 2026, a: 'G. Farkas, A. Geldolf, L. Lorenci, R. Methner, M. Pavel, L. Potharaju, S. Topper, J. Van Gestel, T. Wijgerse, J. Xin, G. Aerts, J. Jorritsma, E. Schrama, E. Steenstra', t: 'Exploring Venus with the Long-Duration Lander Mission Concept ‘KYTHERA’', j: 'Adv. Space Res., 77, 12822–12835' },
];

// Work by Iaroslav Iakubivskyi and co-authors, checked against the publishers' records (Crossref).
// The publications page links to his complete list on Google Scholar.
export const scholar = { iakubivskyi: 'https://scholar.google.com/citations?user=wU0AEWMAAAAJ' };

export const cloudPubs = [
  { y: 2026, a: 'S. Seager, W. Bains, I. Iakubivskyi, R. Agrawal, J. Jenkins, P. Shinde, J.J. Petkowski', t: 'Ionic liquid biospheres', j: 'Life 16, 408', doi: '10.3390/life16030408' },
  { y: 2026, a: 'M.R.A. Moreno, C.E. Carr, D. Baumgardner, K.M. Choi-Slattery, S. Nellutla, I. Iakubivskyi, K.T. Jansen, J.J. Petkowski, S. Seager', t: 'Development of a data retrieval algorithm for Venus nephelometry in preparation for the Rocket Lab Mission to Venus', j: 'Icarus 459, 117189', doi: '10.1016/j.icarus.2026.117189' },
  { y: 2025, a: 'I. Iakubivskyi, S. Seager, L.S. Morrissey, A.P. Georgiou, M.D. Seager, R. Agrawal, J.J. Pętkowski', t: 'Miscibility of hydrogen sulfate planetary ionic liquids with water', j: 'Planet. Sci. J. 6, 304', doi: '10.3847/PSJ/ae260d' },
  { y: 2025, a: 'R. Agrawal, S. Seager, I. Iakubivskyi, W.P. Buchanan, A. Glidden, M.D. Seager, W. Bains, J. Huang, J.J. Petkowski', t: 'Warm, water-depleted rocky exoplanets with surface ionic liquids: a proposed class for planetary habitability', j: 'Proc. Natl. Acad. Sci. USA 122, e2425520122', doi: '10.1073/pnas.2425520122' },
  { y: 2024, a: 'I. Iakubivskyi, S. Seager, C.E. Carr, J.J. Petkowski, R. Agrawal, M.R.A. Moreno, S. Nellutla', t: 'Venus cloud catcher as a proof of concept aerosol collection instrument', j: 'Scientific Reports 14, 30045', doi: '10.1038/s41598-024-80847-8' },
  { y: 2024, a: 'R. Agrawal, S. Seager, J.J. Petkowski, C.E. Carr, W.P. Buchanan, K. Bywaters, M. de Jong, D.H. Grinspoon, I. Iakubivskyi, I.R. King, S.J. Saikia, K. Zacny', t: 'Venus cloud sample return concept for astrobiology', j: 'Adv. Space Res. 74, 490–504', doi: '10.1016/j.asr.2024.03.065' },
  { y: 2022, a: 'S. Seager, J.J. Petkowski, C.E. Carr, S.J. Saikia, R. Agrawal, W.P. Buchanan, D.H. Grinspoon, M.U. Weber, P. Klupar, S.P. Worden, I. Iakubivskyi, M. Pajusalu, L. Kaasik', t: 'Venus Life Finder habitability mission: motivation, science objectives, and instrumentation', j: 'Aerospace 9, 733', doi: '10.3390/aerospace9110733' },
];

// Journal papers only. Long author lists are shortened to the first authors and the number of authors.
export const missionPubs = [
  { y: 2026, a: 'M.F. Palos, A. Ivanova, G. Mengali, et al. (15 authors, including I. Iakubivskyi)', t: 'Curved space telescope: E-sail concept to the solar gravitational lens focal region', j: 'Adv. Space Res. 78, 9702–9716', doi: '10.1016/j.asr.2026.05.095' },
  { y: 2024, a: 'G.H. Jones, C. Snodgrass, C. Tubiana, et al. (234 authors, including I. Iakubivskyi)', t: 'The Comet Interceptor mission', j: 'Space Sci. Rev. 220, 9', doi: '10.1007/s11214-023-01035-0' },
  { y: 2024, a: 'A. Slavinskis, M.F. Palos, J. Dalbins, et al. (35 authors, including I. Iakubivskyi)', t: 'Electric Sail Test Cube–Lunar Nanospacecraft, ESTCube-LuNa: solar wind propulsion demonstration mission concept', j: 'Aerospace 11, 230', doi: '10.3390/aerospace11030230' },
  { y: 2023, a: 'M.F. Palos, P. Janhunen, P. Toivanen, M. Tajmar, I. Iakubivskyi, et al. (22 authors)', t: 'Electric Sail Mission Expeditor, ESME: software architecture and initial ESTCube lunar cubesat E-sail experiment design', j: 'Aerospace 10, 694', doi: '10.3390/aerospace10080694' },
  { y: 2023, a: 'J. Dalbins, K. Allaje, H. Ehrpais, I. Iakubivskyi, et al. (16 authors)', t: 'Interplanetary student nanospacecraft: development of the LEO demonstrator ESTCube-2', j: 'Aerospace 10, 503', doi: '10.3390/aerospace10060503' },
  { y: 2022, a: 'N. Kopacz, J. Csuka, M. Baqué, I. Iakubivskyi, et al. (17 authors)', t: 'A study in blue: secondary copper-rich minerals and their associated bacterial diversity in Icelandic lava tubes', j: 'Earth and Space Science 9, e2022EA002234', doi: '10.1029/2022EA002234' },
  { y: 2022, a: 'M. Pajusalu, I. Iakubivskyi, G.J. Schwarzkopf, O. Knuuttila, T. Väisänen, M. Bührer, M.F. Palos, H. Teras, G. Le Bonhomme, J. Praks, A. Slavinskis', t: 'SISPO: space imaging simulator for proximity operations', j: 'PLoS ONE 17, e0263882', doi: '10.1371/journal.pone.0263882' },
  { y: 2021, a: 'I. Iakubivskyi, L. Mačiulis, P. Janhunen, J. Dalbins, M. Noorma, A. Slavinskis', t: 'Aspects of nanospacecraft design for main-belt sailing voyage', j: 'Adv. Space Res. 67, 2957–2980', doi: '10.1016/j.asr.2020.07.023' },
  { y: 2020, a: 'I. Iakubivskyi, P. Janhunen, J. Praks, et al. (44 authors)', t: 'Coulomb drag propulsion experiments of ESTCube-2 and FORESAIL-1', j: 'Acta Astronautica 177, 771–783', doi: '10.1016/j.actaastro.2019.11.030' },
];

// Earlier work by the PI. Authors and DOIs follow the publishers' records (Crossref).
export const piPubs = [
  { y: 2025, a: 'T.-A. Suer, E.S. Steenstra, S. Marchi, J.A. Tarduno, I. Pascucci', t: 'The formation and structure of iron-dominated planetesimals', j: 'Astronomy & Astrophysics 704, A226', doi: '10.1051/0004-6361/202554674' },
  { y: 2024, a: 'E.S. Steenstra', t: 'Probing Venus’ enigmatic evolution with the new Venus Simulation Laboratory at TU Delft', j: 'EPSC Abstracts 17, EPSC2024-388', doi: '10.5194/epsc2024-388' },
  { y: 2024, a: 'E.S. Steenstra, M. Klaver, J. Berndt, S. Flemetakis, A. Rohrbach, S. Klemme', t: 'Thermal stability of F-rich phlogopite and K-richterite during partial melting of metasomatized mantle peridotite with implications for deep Earth volatile cycles', j: 'JGR: Solid Earth 129, e2023JB028202', doi: '10.1029/2023JB028202' },
  { y: 2024, a: 'E.S. Steenstra, C.J. Renggli, J. Berndt, S. Klemme', t: 'Quantification of evaporative loss of volatile metals from planetary cores and metal-rich planetesimals', j: 'Geochim. Cosmochim. Acta 384, 93–110', doi: '10.1016/j.gca.2024.08.021' },
  { y: 2023, a: 'C.P. Haupt, C.J. Renggli, M. Klaver, E.S. Steenstra, J. Berndt, A. Rohrbach, S. Klemme', t: 'Experimental and petrological investigations into the origin of the lunar Chang’e 5 basalts', j: 'Icarus 402, 115625', doi: '10.1016/j.icarus.2023.115625' },
  { y: 2023, a: 'E.S. Steenstra, C.J. Renggli, J. Berndt, S. Klemme', t: 'Evaporation of moderately volatile elements from metal and sulfide melts: implications for volatile element abundances in magmatic iron meteorites', j: 'Earth Planet. Sci. Lett. 622, 118406', doi: '10.1016/j.epsl.2023.118406' },
  { y: 2022, a: 'E.S. Steenstra, O.T. Lord, S. Vitale, E.S. Bullock, S. Klemme, M. Walter', t: 'Sulfur solubility in a deep magma ocean and implications for the deep sulfur cycle', j: 'Geochem. Perspect. Lett. 22, 5–9', doi: '10.7185/geochemlet.2219' },
  { y: 2022, a: 'E.S. Steenstra, J. Berndt, S. Klemme, W. van Westrenen, A. Heginbotham, G.R. Davies', t: 'Analysis of the CHARM Cu-alloy reference materials using excimer ns-LA-ICP-MS: assessment of matrix effects and applicability to artefact provenancing', j: 'Archaeometry 64, 655–670', doi: '10.1111/arcm.12729' },
  { y: 2022, a: 'M. Klaver, E.S. Steenstra, M. Borchert, E. Welter, M. Wilke, J. Berndt, S. Klemme', t: 'The effect of alkalinity on Ni–O bond length in silicate glasses: implications for Ni isotope geochemistry', j: 'Chemical Geology 610, 121070', doi: '10.1016/j.chemgeo.2022.121070' },
  { y: 2022, a: 'E.S. Steenstra, J. Berndt, A. Rohrbach, E.S. Bullock, W. van Westrenen, S. Klemme, M.J. Walter', t: 'Partitioning of Ru, Pd, Ag, Re, Pt, Ir and Au between sulfide-, metal- and silicate liquid at highly reduced conditions: implications for terrestrial accretion and aubrite parent body evolution', j: 'Geochim. Cosmochim. Acta 336, 15–32', doi: '10.1016/j.gca.2022.08.021' },
  { y: 2020, a: 'E.S. Steenstra, W. van Westrenen', t: 'Geochemical constraints on core-mantle differentiation in Mercury and the aubrite parent body', j: 'Icarus 340, 113621', doi: '10.1016/j.icarus.2020.113621' },
  { y: 2020, a: 'E.S. Steenstra, E. Kelderman, J. Berndt, S. Klemme, E.S. Bullock, W. van Westrenen', t: 'Highly reduced accretion of the Earth by large impactors? Evidence from elemental partitioning between sulfide liquids and silicate melts at highly reduced conditions', j: 'Geochim. Cosmochim. Acta 286, 248–268', doi: '10.1016/j.gca.2020.07.002' },
  { y: 2020, a: 'E.S. Steenstra, J. Berndt, S. Klemme, J.F. Snape, E.S. Bullock, W. van Westrenen', t: 'The fate of sulfur and chalcophile elements during crystallization of the lunar magma ocean', j: 'JGR: Planets 125, e2019JE006328', doi: '10.1029/2019JE006328' },
  { y: 2020, a: 'E.S. Steenstra, F. van Haaster, R. van Mulligen, S. Flemetakis, J. Berndt, S. Klemme, W. van Westrenen', t: 'An experimental assessment of the chalcophile behavior of F, Cl, Br and I: implications for the fate of halogens during planetary accretion and the formation of magmatic ore deposits', j: 'Geochim. Cosmochim. Acta 273, 275–290', doi: '10.1016/j.gca.2020.01.006' },
  { y: 2020, a: 'E.S. Steenstra, J. Berndt, S. Klemme, W. van Westrenen, E.S. Bullock, A. Shahar', t: 'Addressing matrix effects for 193 nm excimer LA-ICP-MS analyses of Fe-rich sulfides and a new predictive model', j: 'J. Anal. At. Spectrom. 35, 498–509', doi: '10.1039/C9JA00391F' },
  { y: 2020, a: 'E.S. Steenstra, A.X. Seegers, R. Putter, J. Berndt, S. Klemme, S. Matveev, E.S. Bullock, W. van Westrenen', t: 'Metal-silicate partitioning systematics of siderophile elements at reducing conditions: a new experimental database', j: 'Icarus 335, 113391', doi: '10.1016/j.icarus.2019.113391' },
  { y: 2020, a: 'E.S. Steenstra, J. Berndt, S. Klemme, A. Rohrbach, E.S. Bullock, W. van Westrenen', t: 'An experimental assessment of the potential of sulfide saturation of the source regions of eucrites and angrites: implications for asteroidal models of core formation, late accretion and volatile element depletions', j: 'Geochim. Cosmochim. Acta 269, 39–62', doi: '10.1016/j.gca.2019.10.006' },
  { y: 2020, a: 'E.S. Steenstra, J. Berndt, S. Klemme, Y. Fei, W. van Westrenen', t: 'A possible high-temperature origin of the Moon and its geochemical consequences', j: 'Earth Planet. Sci. Lett. 538, 116222', doi: '10.1016/j.epsl.2020.116222' },
  { y: 2020, a: 'E.S. Steenstra, V.T. Trautner, J. Berndt, S. Klemme, W. van Westrenen', t: 'Trace element partitioning between sulfide-, metal- and silicate melts at highly reduced conditions: insights into the distribution of volatile elements during core formation in reduced bodies', j: 'Icarus 335, 113408', doi: '10.1016/j.icarus.2019.113408' },
  { y: 2019, a: 'E.S. Steenstra, D. Dankers, J. Berndt, S. Klemme, S. Matveev, W. van Westrenen', t: 'Significant depletion of volatile elements in the mantle of asteroid Vesta due to core formation', j: 'Icarus 317, 669–681', doi: '10.1016/j.icarus.2018.08.020' },
  { y: 2019, a: 'E.S. Steenstra, J. Berndt, S. Klemme, W. van Westrenen', t: 'LA-ICP-MS analyses of Fe-rich alloys: quantification of matrix effects for 193 nm excimer laser systems', j: 'J. Anal. At. Spectrom. 34, 222–231', doi: '10.1039/C8JA00291F' },
  { y: 2018, a: 'E.S. Steenstra, W. van Westrenen', t: 'A synthesis of geochemical constraints on the inventory of light elements in the core of Mars', j: 'Icarus 315, 69–78', doi: '10.1016/j.icarus.2018.06.023' },
  { y: 2018, a: 'E.S. Steenstra, A.X. Seegers, J. Eising, B.G.J. Tomassen, F.P.F. Webers, J. Berndt, S. Klemme, S. Matveev, W. van Westrenen', t: 'Evidence for a sulfur-undersaturated lunar interior from the solubility of sulfur in lunar melts and sulfide-silicate partitioning of siderophile elements', j: 'Geochim. Cosmochim. Acta 231, 130–156', doi: '10.1016/j.gca.2018.04.008' },
  { y: 2018, a: 'E.S. Steenstra, N. Agmon, J. Berndt, S. Klemme, S. Matveev, W. van Westrenen', t: 'Depletion of potassium and sodium in mantles of Mars, Moon and Vesta by core formation', j: 'Scientific Reports 8, 7053', doi: '10.1038/s41598-018-25505-6' },
  { y: 2018, a: 'J.S. Knibbe, S.M. Luginbühl, R. Stoevelaar, W. van der Plas, D.M. van Harlingen, N. Rai, E.S. Steenstra, R. van de Geer, W. van Westrenen', t: 'Calibration of a multi-anvil high-pressure apparatus to simulate planetary interior conditions', j: 'EPJ Techniques and Instrumentation 5', doi: '10.1140/epjti/s40485-018-0047-z' },
  { y: 2017, a: 'E.S. Steenstra, Y. Lin, D. Dankers, N. Rai, J. Berndt, S. Matveev, W. van Westrenen', t: 'The lunar core can be a major reservoir for volatile elements S, Se, Te and Sb', j: 'Scientific Reports 7, 14552', doi: '10.1038/s41598-017-15203-0' },
  { y: 2017, a: 'E.S. Steenstra, A.B. Sitabi, Y.H. Lin, N. Rai, J.S. Knibbe, J. Berndt, S. Matveev, W. van Westrenen', t: 'The effect of melt composition on metal-silicate partitioning of siderophile elements and constraints on core formation in the angrite parent body', j: 'Geochim. Cosmochim. Acta 212, 62–83', doi: '10.1016/j.gca.2017.05.034' },
  { y: 2017, a: 'Y. Lin, E.J. Tronche, E.S. Steenstra, W. van Westrenen', t: 'Experimental constraints on the solidification of a nominally dry lunar magma ocean', j: 'Earth Planet. Sci. Lett. 471, 104–116', doi: '10.1016/j.epsl.2017.04.045' },
  { y: 2017, a: 'E.S. Steenstra, Y. Lin, N. Rai, M. Jansen, W. van Westrenen', t: 'Carbon as the dominant light element in the lunar core', j: 'American Mineralogist 102, 92–97', doi: '10.2138/am-2017-5727' },
  { y: 2016, a: 'Y. Lin, E.J. Tronche, E.S. Steenstra, W. van Westrenen', t: 'Evidence for an early wet Moon from experimental crystallization of the lunar magma ocean', j: 'Nature Geoscience 10, 14–18', doi: '10.1038/ngeo2845' },
  { y: 2016, a: 'E.S. Steenstra, D.J.P. Martin, F.E. McDonald, S. Paisarnsombat, C. Venturino, S. O’Hara, A. Calzada-Diaz, S. Bottoms, M.K. Leader, K.K. Klaus, W. van Westrenen, D.H. Needham, D.A. Kring', t: 'Analyses of robotic traverses and sample sites in the Schrödinger basin for the HERACLES human-assisted sample return mission concept', j: 'Adv. Space Res. 58, 1050–1065', doi: '10.1016/j.asr.2016.05.041' },
  { y: 2016, a: 'E.S. Steenstra, N. Rai, J.S. Knibbe, Y.H. Lin, W. van Westrenen', t: 'New geochemical models of core formation in the Moon from metal–silicate partitioning of 15 siderophile elements', j: 'Earth Planet. Sci. Lett. 441, 1–9', doi: '10.1016/j.epsl.2016.02.028' },
  { y: 2016, a: 'E.S. Steenstra, J.S. Knibbe, N. Rai, W. van Westrenen', t: 'Constraints on core formation in Vesta from metal–silicate partitioning of siderophile elements', j: 'Geochim. Cosmochim. Acta 177, 48–61', doi: '10.1016/j.gca.2016.01.002' },
];

export const news = [
  { date: 'February 2026', t: 'NWO funding for research on the lower atmosphere of Venus', src: 'TU Delft', url: 'https://www.tudelft.nl/en/2026/lr/nwo-funding-for-three-planetary-science-projects',
    d: 'One of three planetary science projects funded through the NWO programme for the use of space infrastructure.' },
  { date: 'December 2025', t: 'Delta visits the new planetary laboratory', src: 'TU Delta', url: 'https://delta.tudelft.nl/en/article/130-kilometers-deep-into-the-earths-crust-in-a-new-laboratory-in-delft',
    d: 'The university newspaper reports on the newly opened laboratory and its press, rheometer and gas-mixing set-up.' },
  { date: 'March 2025', t: 'Vening Meinesz Prize for Edgar Steenstra', src: 'TU Delft', url: 'https://tudelft.nl/en/staff/e.s.steenstra',
    d: 'Awarded for research on the formation and evolution of planets, in particular Venus and the Moon.' },
  { date: 'September 2023', t: 'ERC Starting Grant for the VenusVolAtmos project', src: 'TU Delft', url: 'https://tudelft.nl/en/2023/lr/erc-starting-grant-for-edgar-steenstra-a-lifelong-dream-of-mine',
    d: 'A five-year European Research Council grant to study volatile element cycles on Venus.' },
];

// Photos under the 3D scan on the virtual tour page. Each one opens large when clicked.
export const gallery = [
  { img: 'piston-cylinder-press.jpg', alt: instruments[0].alt, cap: 'End-loaded piston cylinder press' },
  { img: 'rheometer-frs1800.jpg', alt: instruments[1].alt, cap: 'Anton Paar FRS 1800 rheometer' },
  { img: 'venus-surface-simulator.jpg', alt: instruments[2].alt, cap: 'Venus Surface Simulator' },
  { img: 'venus-surface-simulator-vessel.jpg', alt: instruments[2].extra[0].alt, cap: 'Venus Surface Simulator, close-up' },
  { img: 'gas-mixing-furnace.jpg', alt: instruments[3].alt, cap: 'Carbolite Gero gas-mixing furnace' },
  { img: 'sample-preparation-bench.jpg', alt: facilities.photo.alt, cap: 'Sample preparation bench' },
  { img: 'capsule-welder.jpg', alt: 'A precision welder and a stereo microscope on a workbench', cap: 'Welding of platinum sample capsules' },
  { img: 'wire-loop-samples.jpg', alt: 'A thin wire loop holding several small glassy beads', cap: 'Sample beads on a wire loop' },
  { img: 'run-product-carbonate-melt.jpg', alt: instruments[0].extra[1].alt, cap: 'Electron image: carbonate and silicate melt' },
  { img: 'run-product-silicate-melt.jpg', alt: instruments[0].extra[0].alt, cap: 'Electron image: silicate melt and gas' },
  { img: 'run-product-bse.jpg', alt: 'Greyscale electron microscope image showing angular crystals in a fine-grained matrix', cap: 'Electron microscope image of a sample' },
  { img: 'ionic-liquid-mars-soil.jpg', alt: clouds.photo.alt, cap: 'Ionic liquid on Mars soil simulant' },
];

// The 3D scan on the virtual tour page, drawn by public/js/tour.js. Distances are in metres in the frame of the
// room: x runs from the wall on the left to the open side on the right, y from the windows to the wall with the
// door, and z is the height above the floor.
//   at    the point the camera looks at
//   look  [direction in degrees round the room, height of the camera in degrees, metres shown across the picture]
//   spot  where the label of an instrument sits (its top)
//   cut   how many metres in front of `at`, measured over the floor towards the camera, the room is still drawn;
//         what stands nearer to the camera is left away, so that the instrument is in clear view
//   rest  seconds the tour stays in this view, and `turn` how many degrees per second the model turns meanwhile
// The README tells how to find these numbers for a new view, and how the files in public/scan are made.
export const scan = {
  title: 'The laboratory in 3D',
  poster: 'lab-scan.jpg',
  alt: '3D scan of the laboratory seen from above at an angle, with the benches along the walls and the island bench in the middle',
  step: 0.002, origin: [-3.86, -3.63, -0.06], box: [2.66, 3.63, 2.8],
  walls: [-3.58, 3.38, -3.36],           // the wall on the left (x), the wall with the door (y), the windows (y)
  parts: [
    { file: 'room-1.bin', points: 90000, bytes: 329570 },
    { file: 'room-2.bin', points: 155000, bytes: 528193 },
    { file: 'room-3.bin', points: 207302, bytes: 678537 },
  ],
  // How to move the model: one sentence for visitors with a mouse, one for visitors with a touch screen.
  hint: { mouse: 'Drag to turn the model. Click it and scroll to zoom, and double-click a spot to look at it closely.',
    touch: 'Swipe sideways to turn the model, pinch to zoom, and double-tap a spot to look at it closely.' },
  views: [
    { key: 'overview', name: 'Overview', at: [-0.6, 0, 0.9], look: [72, 36, 8.4], rest: 16, turn: -4.5,
      text: 'A scan of the laboratory, made of about 450,000 coloured points. The scanned part of the room measures about 6.5 by 7 metres, and each square of the grid is one metre. The ceiling is left out and the walls nearest to you are hidden, so that you can look inside.', review: 'places of the five labels to confirm' },
    { key: 'plan', name: 'From above', at: [-0.6, 0, 0.9], look: [-90, 89.4, 9.2], rest: 7, turn: 0,
      text: 'The room seen from straight above. The windows are at the bottom and the door is at the top. The island bench with the press stands in the middle, and the other instruments stand along the walls.' },
    { key: 'press', name: instruments[0].short, at: [-0.45, -1.05, 1.15], look: [-78, 30, 5.0], cut: 1.25, spot: [-0.45, -1.1, 2.15], rest: 8, turn: 1.5,
      img: instruments[0].img, alt: instruments[0].alt, href: '/equipment#press', more: 'More about the press',
      text: 'The press stands at the end of the island bench in the middle of the room: a blue frame on steel columns, with the tall white cabinet for its gauges and controls beside it. It squeezes and heats a sample to the conditions inside a planet, up to 3.5 GPa and 1600 °C.' },
    { key: 'rheometer', name: 'Rheometer', at: [0.2, -2.9, 1.2], look: [72, 30, 5.2], cut: 0.95, spot: [-0.15, -2.95, 2.0], rest: 8, turn: 1.5,
      img: instruments[1].img, alt: instruments[1].alt, href: '/equipment#rheometer', more: 'More about the rheometer',
      text: 'The rheometer stands by the windows in its safety enclosure of wire mesh, next to the desk with its control computer. It measures how easily a melt flows, at temperatures of up to 1730 °C and in a chosen gas.' },
    { key: 'sta', name: instruments[2].short, at: [-2.95, 0.5, 0.9], look: [12, 32, 4.8], cut: 1.3, spot: [-2.95, 0.2, 1.6], rest: 8, turn: 1.5,
      img: instruments[2].img, alt: instruments[2].alt, href: '/equipment#sta', more: 'More about the Venus Surface Simulator',
      text: 'The Venus Surface Simulator stands on the table against the wall, with its control units and gas lines underneath. It weighs a sample and follows its heat flow in hot, dense gas, up to 1200 °C and 150 bar. The conditions at the surface of Venus lie well within that range.' },
    { key: 'furnace', name: instruments[3].short, at: [-1.7, -2.6, 1.2], look: [58, 30, 5.0], cut: 1.25, spot: [-1.5, -2.8, 1.95], rest: 8, turn: 1.5,
      img: instruments[3].img, alt: instruments[3].alt, href: '/equipment#furnace', more: 'More about the furnace',
      text: 'The gas-mixing furnace is the dark tower by the windows, with its controller in front of it and the gas cabinet beside it. Samples are heated in a flowing mixture of gases such as CO₂, CO and SO₂, which sets how much oxygen is available to them.' },
    { key: 'prep', name: 'Sample preparation', at: [2.05, 0, 1.0], look: [172, 30, 5.2], cut: 1.3, spot: [2.0, 0, 1.75], rest: 8, turn: 1.5,
      img: facilities.photo.img, alt: facilities.photo.alt, href: '/equipment#facilities', more: 'More about sample preparation',
      text: 'The bench where samples are prepared and stored: a drying oven, a stereo microscope and the desiccator cabinets that keep starting materials and finished experiments dry.' },
  ],
};

export const funders = [
  'European Research Council (ERC Starting Grant VenusVolAtmos)',
  'Dutch Research Council NWO (M-Invest, XS and GO programmes)',
  'Dutch Research Agenda (NWA)',
  'Materials innovation institute (M2i)',
];

// The wording that the European Research Council asks for next to its logo (Horizon Europe grants).
export const euStatement = 'Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the European Research Council Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.';

// Small funder logos at the bottom of every page: white on a clear background, all shown at one height, which is
// `--h` of `.funders` in public/css/site.css (26 pixels). The files are in public/img; `w` and `h` are the size of
// the file, which is four times the size on screen. They were made from the logos on the funders' own pages.
// - NWO: the white version of its logo. NWO asks for a height of at least 15 mm (57 pixels); here it is smaller.
// - ERC: it asks for its logo together with the EU emblem and the words "Funded by the European Union". It offers
//   the pair only in colour for light backgrounds, so here the emblem is drawn in white lines (logo-eu.svg, drawn
//   for a height of 26 pixels), the words are text in `lines`, and `pair` is the ERC's mark recoloured to white.
// - NWA: the logo of the Dutch Research Agenda from NWO's page about the programme, recoloured to white.
// To add a funder: put a white picture on a clear background in public/img and add a line with `name`, `img`, `w`,
// `h` and `url`. A funder without a logo file can be named in letters: `{ name: 'Full name', text: 'ABC' }`.
export const funderLogos = [
  { name: 'Dutch Research Council (NWO)', img: 'logo-nwo.png', w: 64, h: 104, url: 'https://www.nwo.nl/en' },
  { name: 'Funded by the European Union: European Research Council (ERC)', img: 'logo-eu.svg', w: 39, h: 26, lines: ['Funded by', 'the European Union'],
    pair: { name: 'European Research Council', img: 'logo-erc.png', w: 103, h: 104 }, url: 'https://erc.europa.eu' },
  { name: 'Dutch Research Agenda (NWA)', img: 'logo-nwa.png', w: 286, h: 104, url: 'https://www.nwo.nl/en/researchprogrammes/dutch-research-agenda-nwa' },
];
