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
    email: 'e.s.steenstra@tudelft.nl',
    address: [
      'TU Delft, Faculty of Aerospace Engineering',
      'Department of Space Engineering',
      'Section Planetary Exploration',
      'Building 62, room N2.32',
      'Kluyverweg 1, 2629 HS Delft, The Netherlands',
    ],
  },
};

export const nav = [
  ['Home', 'index.html'],
  ['Research', 'research.html'],
  ['Equipment', 'equipment.html'],
  ['People', 'people.html'],
  ['Publications', 'publications.html'],
  ['News', 'news.html'],
  ['Virtual tour', 'tour.html'],
  ['Contact', 'contact.html'],
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
  { v: 150, unit: 'bar', label: 'gas pressure in the Venus Surface Simulator' },
  { v: 4, unit: 'instruments', label: 'for interiors, lavas, surfaces and atmospheres' },
];

export const themes = [
  { id: 'venus', t: 'Venus: interior, surface and atmosphere',
    d: 'Volcanic degassing, surface weathering and the cycling of volatile elements on our sister planet.',
    long: 'How strongly does the hot, corrosive atmosphere of Venus weather its surface, and what did its volcanoes add to that atmosphere over time? We study volcanic degassing, surface weathering and the cycling of volatile elements between the interior, surface and atmosphere of Venus, in support of missions such as EnVision, DAVINCI and VERITAS.' },
  { id: 'differentiation', t: 'Planetary differentiation',
    d: 'Core formation, melting and crystallisation in rocky planets, moons and asteroids.',
    long: 'Core formation, magma ocean crystallisation and the partitioning of elements between metal, sulfide and silicate tell us how rocky bodies such as the Moon, Mars, Mercury and Vesta acquired their layered interiors and their present compositions.' },
  { id: 'rheology', t: 'Magma rheology and volcanism',
    d: 'How easily silicate, metal, salt and sulfate melts flow, and what that means for volcanic processes.',
    long: 'The viscosity of a melt controls how magma rises, erupts and spreads. We measure the flow behaviour of silicate melts as well as metal, slag, salt and sulfate melts at temperatures up to 1730 °C and under controlled atmospheres, providing data relevant to magma mobility and volcanic processes.' },
  { id: 'clouds-theme', t: 'Clouds and unconventional liquids',
    d: 'Sulfuric acid chemistry and ionic liquids relevant to the clouds of Venus.',
    long: 'The clouds of Venus are made of concentrated sulfuric acid. We study the chemistry of this environment, including ionic liquids: salts that stay liquid over a wide range of temperatures and may form where sulfuric acid meets nitrogen-bearing organic compounds.',
    link: ['See the Venus cloud experiment', 'equipment.html#clouds'] },
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
  { id: 'canali', name: 'Canali', funder: 'NWO M-Invest', year: '2024',
    d: 'Investment grant for additional laboratory equipment.', review: 'science description to add' },
  { id: 'zircons', name: 'Zircons', funder: 'NWA', year: '',
    d: 'Experimental petrology and isotope geochemistry of ancient zircons.', review: 'description to add' },
  { id: 'steel', name: 'Green Steelmaking', funder: 'M2i', year: '',
    d: 'High-temperature processes, melt properties and chemical interactions relevant to more sustainable metallurgical processes.', review: 'description to add' },
];

export const worlds = [
  { id: 'venus', name: 'Venus', d: 'Volcanism, surface weathering and the exchange of volatiles between interior, surface, atmosphere and clouds.' },
  { id: 'earth', name: 'Earth', d: 'Deep volatile cycles and the formation of the earliest crust.' },
  { id: 'moon', name: 'Moon', d: 'Core formation and the crystallisation of the lunar magma ocean.' },
  { id: 'mars', name: 'Mars', d: 'The composition of the core and the depletion of volatile elements in the mantle.' },
  { id: 'mercury', name: 'Mercury', d: 'Differentiation of a planet that formed under highly reduced conditions.' },
  { id: 'asteroid', name: 'Asteroids', d: 'Core formation in Vesta and the loss of volatile elements from molten, metal-rich planetesimals.' },
  { id: 'titan', name: 'Titan and icy worlds', d: 'Materials and processes relevant to icy moons and their deep interiors.' },
];

// Add a portrait by placing a file in public/img and setting photo: 'filename.jpg'.
export const people = [
  { name: 'Dr. Edgar Steenstra', role: 'Principal investigator, Assistant Professor', init: 'ES', photo: null,
    bio: 'Edgar is an Assistant Professor in Planetary Exploration at Delft University of Technology specialising in experimental geochemistry and planetary evolution. His group’s research investigates the formation and differentiation of rocky planets, the chemical evolution of planetary interiors and atmospheres, and the processes shaping Venus, Moon and the Earth. Using high-pressure and high-temperature experiments, his group recreates extreme planetary conditions in the laboratory to investigate volcanic processes, volatile element cycling, and planetary formation. He leads the development of specialised experimental facilities at TU Delft and contributes to the preparation of future planetary exploration missions.',
    tags: ['High-pressure, high-temperature experiments', 'Geochemistry', 'EPMA', 'LA-ICP-MS'],
    links: [['Google Scholar', 'https://scholar.google.nl/citations?user=RnRn5XYAAAAJ&hl=nl'], ['TU Delft profile', 'https://tudelft.nl/en/staff/e.s.steenstra']] },
  { name: 'Dr. Iaroslav Iakubivskyi', role: '', init: 'II', photo: null, bio: '',
    tags: ['Venus clouds', 'Ionic liquids', 'Sulfuric acid chemistry'],
    links: [['Google Scholar', 'https://scholar.google.com/citations?user=wU0AEWMAAAAJ']] },
  { name: 'Guus Aerts, MSc', role: 'PhD candidate', init: 'GA', photo: null, bio: '', tags: [] },
  { name: 'Jaap Jorritsma, MSc', role: 'PhD candidate', init: 'JJ', photo: null,
    bio: 'Jaap is a 3rd year PhD researcher who is experimentally investigating the sulphur fluxes between the crust and atmosphere of Venus. In his MSc thesis at the VU, he studied the feasibility of ferrovolcanism on 16 Psyche.',
    tags: ['High-pressure, high-temperature experiments', 'EPMA analysis', 'Volcanism', 'Evaporation thermodynamics'] },
  { name: 'Racheda Melloul, MSc', role: '', init: 'RM', photo: null, bio: '', tags: [] },
  { name: 'Anneke Royakkers, MSc', role: '', init: 'AR', photo: null, bio: '', tags: [] },
];

export const instruments = [
  { id: 'press', name: 'End-Loaded Piston Cylinder Press', short: 'Piston cylinder press', img: 'piston-cylinder-press.jpg',
    alt: 'The end-loaded piston cylinder press with its pressure gauges and control panel',
    extra: [{ img: 'run-product-bse.jpg', alt: 'Greyscale electron microscope image showing angular crystals in a fine-grained matrix', cap: 'Electron microscope image of an experimental sample.' }],
    specs: [['3.5 GPa', 'maximum pressure'], ['> 1600 °C', 'temperature'], ['Bristol type', 'end-loaded design']],
    text: 'The end-loaded piston-cylinder press is a high-pressure experimental apparatus used to investigate the physical and chemical properties of planetary materials under conditions relevant to planetary interiors. The Bristol-type design enables high-pressure and high-temperature experiments on geological materials, including silicate rocks, minerals, and metal alloys, up to 3.5 GPa and over 1600°C. The system is suitable for investigating phase equilibria, melting relations, mineral stability, and chemical partitioning under controlled pressure and temperature conditions. It supports experimental studies of planetary differentiation, magma generation, and the evolution of rocky bodies, including Earth, Venus, Mars, and planetary interiors more broadly. Within the planetary materials laboratory, the press provides an experimental platform for reproducing shallow to deep-interior conditions, depending on the planetary body, and constraining the processes that govern their formation and evolution.',
    vizTitle: 'How deep does the press take us?',
    vizFallback: 'At its maximum of 3.5 GPa the press reproduces the pressure roughly 110 km inside the Earth, almost 300 km inside Mars and most of the way to the centre of the Moon.',
    vizNote: 'Depths are approximate and follow simple interior models of each body. Layer boundaries are schematic.' },
  { id: 'rheometer', name: 'Anton Paar FRS 1800 Gas-Tight Rheometer', short: 'High-temperature rheometer', img: 'rheometer-frs1800.jpg',
    alt: 'The Anton Paar FRS 1800 furnace rheometer system in its safety enclosure, next to its control computer',
    specs: [['1730 °C', 'maximum sample temperature'], ['Rotation and oscillation', 'measurement modes'], ['Gas-tight', 'controlled atmosphere']],
    text: 'The Anton Paar FRS 1800 is a state-of-the-art high-temperature rotational rheometer designed to measure the viscosity and rheological properties of molten materials under controlled atmospheric conditions. The system enables measurements at sample temperatures up to 1730°C, making it suitable for investigating the flow behaviour of silicate melts, including planetary magmas, as well as metal, slag, salt and sulfate melts. The rheometer supports both rotational and oscillatory measurements, allowing the characterization of material viscosity and viscoelastic behaviour across a wide range of conditions. Its controlled-atmosphere capability enables experiments using selected gas environments, supporting investigations of the influence of atmospheric composition on melt properties. Within the planetary materials laboratory, the rheometer is used to constrain the rheological behaviour of planetary materials at high temperatures, providing experimental data relevant to magma mobility, volcanic processes, and the evolution of (shallow) planetary interiors.',
    vizTitle: 'How does a melt flow on another world?',
    vizFallback: 'Viscosity decides whether a melt races downhill or barely moves. The same lava flows more slowly where gravity is weaker.',
    vizNote: 'Speeds are a laminar-flow estimate for a sheet 1 m thick on a 1° slope and only indicate the scale of the effect.' },
  { id: 'sta', name: 'Linseis STA HP3 TGA-DSC “Venus Surface Simulator”', short: 'Venus Surface Simulator', img: null, alt: '',
    specs: [['1200 °C', 'maximum temperature'], ['150 bar', 'maximum pressure'], ['TGA and DSC', 'mass and heat flow together']],
    text: 'The LINSEIS STA HP3 is a simultaneous thermal analysis system designed to investigate the thermal properties and behaviour of materials under controlled experimental conditions, up to 1200 °C and 150 bar. By combining thermogravimetric analysis (TGA) and differential scanning calorimetry (DSC), the instrument measures changes in sample mass and heat flow as a function of temperature and time. The system enables the characterization of thermal stability, decomposition, oxidation, phase transitions, and endothermic or exothermic reactions. Its high-temperature capabilities make it suitable for investigating geological and planetary materials, including minerals, rocks, and synthetic analogues, under controlled atmospheric conditions. In fact, the hostile conditions at the surface of Venus can be directly reproduced within the set-up. Within the planetary materials laboratory, the instrument supports studies of the thermal evolution and chemical stability of planetary materials, helping constrain processes such as mineral transformations, volatile release, and high-temperature reactions relevant to planetary interiors and surfaces.',
    vizTitle: 'Which worlds fit inside the instrument?',
    vizFallback: 'The surface of Venus, at about 460 °C and 92 bar, lies well inside the range of the instrument, as does the whole lower atmosphere up to the cloud base.',
    vizNote: 'Venus atmosphere values are approximate, after the Venus International Reference Atmosphere. The shaded box uses the listed maxima of the instrument.' },
  { id: 'furnace', name: 'Carbolite Gero Gas-Mixing Furnace', short: 'Gas-mixing furnace', img: 'gas-mixing-furnace.jpg',
    alt: 'The Carbolite Gero vertical tube furnace with its controller',
    extra: [{ img: 'wire-loop-samples.jpg', alt: 'A thin wire loop holding several small glassy beads', cap: 'Sample beads suspended from a wire loop.' }],
    specs: [['CO₂, CO, SO₂', 'and inert gases'], ['Oxygen fugacity', 'set by the gas mixture'], ['Gas–melt reactions', 'at high temperature']],
    text: 'The Carbolite Gero gas-mixing furnace is a high-temperature experimental system designed to investigate the behaviour of planetary materials under controlled atmospheric conditions. By combining precise temperature control with regulated gas delivery, the furnace enables experiments under atmospheres with tailored chemical compositions and oxygen fugacities. The system can be operated with a range of gases, including CO₂, CO, SO₂, and inert gases, depending on the experimental configuration. This capability allows for investigating the effects of atmospheric composition and redox conditions on melting, mineral stability, oxidation, reduction, and gas–melt interactions. Within the planetary materials laboratory, the furnace supports experimental simulations of environments relevant to rocky planets, including the CO₂-rich atmosphere of Venus. It provides a platform for studying high-temperature chemical processes, the stability of planetary materials, and interactions between silicate melts and controlled gas atmospheres.',
    vizTitle: 'Mixing the gas of another world',
    vizFallback: 'The ratio of CO₂ to CO in the furnace sets how oxidising the gas is. Different mixtures match the interiors of the Moon, Mars or the Earth.',
    vizNote: 'Oxygen fugacity is calculated for ideal CO₂–CO mixtures at 1 bar and shown relative to the iron–wüstite (IW) and quartz–fayalite–magnetite (QFM) buffers. Planetary ranges are indicative literature values.' },
];

export const clouds = {
  text: [
    'Between about 48 and 70 km above its surface, Venus is wrapped in clouds of concentrated sulfuric acid. Near 55 km the temperature and pressure are similar to those at the surface of the Earth, which makes this layer a prime target for future atmospheric probes.',
    'Laboratory experiments have shown that sulfuric acid can dissolve nitrogen-bearing organic compounds and, once the excess acid evaporates, leave behind an ionic liquid: a salt that stays liquid over a wide range of temperatures and barely evaporates. In the laboratory we test such liquids under conditions relevant to the clouds of Venus.',
  ],
  fallback: 'The cloud decks of Venus span roughly 48 to 70 km altitude, from about 90 °C at the base to about −40 °C at the top.',
  note: 'Atmosphere values are approximate, after the Venus International Reference Atmosphere. The droplet sequence is a schematic of the process described by Agrawal et al. (2025).',
  refs: [
    ['Agrawal et al. 2025, PNAS', 'https://doi.org/10.1073/pnas.2425520122'],
    ['Iakubivskyi et al. 2024, Scientific Reports', 'https://doi.org/10.1038/s41598-024-80847-8'],
    ['Seager et al. 2026, Life', 'https://doi.org/10.3390/life16030408'],
  ],
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

// Earlier work by the PI, compiled from his public university profiles.
export const piPubs = [
  [2025, 'Suer, Steenstra, Marchi, Tarduno, Pascucci', 'The formation and structure of iron-dominated planetesimals', 'Astronomy & Astrophysics 704, A226'],
  [2024, 'Steenstra', 'Probing Venus’ enigmatic evolution with the new Venus Simulation Laboratory at TU Delft', 'EPSC Abstracts 17, EPSC2024-388'],
  [2024, 'Steenstra, Klaver, Berndt, Flemetakis, Rohrbach, Klemme', 'Thermal stability of F-rich phlogopite and K-richterite during partial melting of metasomatized mantle peridotite with implications for deep Earth volatile cycles', 'JGR: Solid Earth 129, e2023JB028202'],
  [2024, 'Steenstra, Renggli, Berndt, Klemme', 'Quantification of evaporative loss of volatile metals from planetary cores and metal-rich planetesimals', 'Geochim. Cosmochim. Acta 384, 93–110'],
  [2023, 'Haupt, Renggli, Klaver, Steenstra, Berndt, Rohrbach, Klemme', 'Experimental and petrological investigations into the origin of the lunar Chang’e 5 basalts', 'Icarus 402, 115625'],
  [2023, 'Steenstra, Renggli, Berndt, Klemme', 'Evaporation of moderately volatile elements from metal and sulfide melts: implications for volatile element abundances in magmatic iron meteorites', 'Earth Planet. Sci. Lett. 622, 118406'],
  [2022, 'Steenstra, Lord, Vitale, Bullock, Klemme, Walter', 'Sulfur solubility in a deep magma ocean and implications for the deep sulfur cycle', 'Geochem. Perspect. Lett. 22, 5–9'],
  [2022, 'Steenstra, Berndt, Klemme, Heginbotham, Davies', 'Analysis of the CHARM Cu-alloy reference materials using excimer ns-LA-ICP-MS: assessment of matrix effects and applicability to artefact provenancing', 'Archaeometry 64, 655–670'],
  [2022, 'Klaver, Steenstra, Borchert, Welter, Wilke, Berndt, Klemme', 'The effect of alkalinity on Ni–O bond length in silicate glasses: implications for Ni isotope geochemistry', 'Chemical Geology 610, 121070'],
  [2022, 'Steenstra, Berndt, Rohrbach, Bullock, van Westrenen, Klemme, Walter', 'Partitioning of Ru, Pd, Ag, Re, Pt, Ir and Au between sulfide-, metal- and silicate liquid at highly reduced conditions: implications for terrestrial accretion and aubrite parent body evolution', 'Geochim. Cosmochim. Acta 336, 15–32'],
  [2020, 'Steenstra, van Westrenen', 'Geochemical constraints on core-mantle differentiation in Mercury and the aubrite parent body', 'Icarus 340, 113621'],
  [2020, 'Steenstra, Kelderman, Berndt, Klemme, Bullock, van Westrenen', 'Highly reduced accretion of the Earth by large impactors? Evidence from elemental partitioning between sulfide liquids and silicate melts at highly reduced conditions', 'Geochim. Cosmochim. Acta 286, 248–268'],
  [2020, 'Steenstra, Berndt, Klemme, Snape, Bullock, van Westrenen', 'The fate of sulfur and chalcophile elements during crystallization of the lunar magma ocean', 'JGR: Planets 125, e2019JE006328'],
  [2020, 'Steenstra, van Haaster, van Mulligen, Flemetakis, Berndt, Klemme, van Westrenen', 'An experimental assessment of the chalcophile behavior of F, Cl, Br and I: implications for the fate of halogens during planetary accretion and the formation of magmatic ore deposits', 'Geochim. Cosmochim. Acta 273, 275–290'],
  [2020, 'Steenstra, Berndt, Klemme, Bullock, van Westrenen, Shahar', 'Addressing matrix effects for 193 nm excimer LA-ICP-MS analyses of Fe-rich sulfides and a new predictive model', 'J. Anal. At. Spectrom. 35, 498–509'],
  [2020, 'Steenstra, Seegers, Putter, Berndt, Klemme, Matveev, Bullock, van Westrenen', 'Metal-silicate partitioning systematics of siderophile elements at reducing conditions: a new experimental database', 'Icarus 335, 113391'],
  [2020, 'Steenstra, Berndt, Klemme, Rohrbach, Bullock, van Westrenen', 'An experimental assessment of the potential of sulfide saturation of the source regions of eucrites and angrites: implications for asteroidal models of core formation, late accretion and volatile element depletions', 'Geochim. Cosmochim. Acta 269, 39–62'],
  [2020, 'Steenstra, Berndt, Klemme, Fei, van Westrenen', 'A possible high-temperature origin of the Moon and its geochemical consequences', 'Earth Planet. Sci. Lett. 538, 116222'],
  [2020, 'Steenstra, Trautner, Berndt, Klemme, van Westrenen', 'Trace element partitioning between sulfide-, metal- and silicate melts at highly reduced conditions: insights into the distribution of volatile elements during core formation in reduced bodies', 'Icarus 335, 113408'],
  [2019, 'Steenstra, Dankers, Berndt, Klemme, Matveev, van Westrenen', 'Significant depletion of volatile elements in the mantle of asteroid Vesta due to core formation', 'Icarus 317, 669–681'],
  [2019, 'Steenstra, Berndt, Klemme, van Westrenen', 'LA-ICP-MS analyses of Fe-rich alloys: quantification of matrix effects for 193 nm excimer laser systems', 'J. Anal. At. Spectrom. 34, 222–231'],
  [2018, 'Steenstra, van Westrenen', 'A synthesis of geochemical constraints on the inventory of light elements in the core of Mars', 'Icarus 315, 69–78'],
  [2018, 'Steenstra, Seegers, Eising, Tomassen, Webers, Berndt, Klemme, Matveev, van Westrenen', 'Evidence for a sulfur-undersaturated lunar interior from the solubility of sulfur in lunar melts and sulfide-silicate partitioning of siderophile elements', 'Geochim. Cosmochim. Acta 231, 130–156'],
  [2018, 'Steenstra, Agmon, Berndt, Matveev, Klemme, van Westrenen', 'Depletion of potassium and sodium in mantles of Mars, Moon and Vesta by core formation', 'Scientific Reports 8, 7053'],
  [2018, 'Knibbe, Luginbühl, Stoevelaar, van der Plas, van Harlingen, Rai, Steenstra, van de Geer, van Westrenen', 'Calibration of a multi-anvil high-pressure apparatus to simulate planetary interior conditions', 'EPJ Techniques and Instrumentation 5'],
  [2017, 'Steenstra, Lin, Dankers, Rai, Berndt, Matveev, van Westrenen', 'The lunar core can be a major reservoir for volatile elements S, Se, Te and Sb', 'Scientific Reports 7, 14552'],
  [2017, 'Steenstra, Sitabi, Lin, Rai, Berndt, Matveev, Knibbe, van Westrenen', 'The effect of melt composition on metal-silicate partitioning of siderophile elements and constraints on core formation in the angrite parent body', 'Geochim. Cosmochim. Acta 212, 62–83'],
  [2017, 'Lin, Tronche, Steenstra, van Westrenen', 'Experimental constraints on the solidification of a nominally dry lunar magma ocean', 'Earth Planet. Sci. Lett. 471, 104–116'],
  [2017, 'Steenstra, Lin, Rai, Jansen, van Westrenen', 'Carbon as the dominant light element in the lunar core', 'American Mineralogist 102, 92–97'],
  [2016, 'Lin, Tronche, Steenstra, van Westrenen', 'Evidence for an early wet Moon from experimental crystallization of the lunar magma ocean', 'Nature Geoscience 10, 14–18'],
  [2016, 'Steenstra, Martin, McDonald, Paisarnsombat, Venturino, O’Hara, Calzada-Diaz, Bottoms, Leader, Klaus, van Westrenen, Needham, Kring', 'Analyses of robotic traverses and sample sites in the Schrödinger basin for the HERACLES human-assisted sample return mission concept', 'Adv. Space Res. 58, 1050–1065'],
  [2016, 'Steenstra, Rai, Knibbe, Lin, van Westrenen', 'New geochemical models of core formation in the Moon from metal–silicate partitioning of 15 siderophile elements', 'Earth Planet. Sci. Lett. 441, 1–9'],
  [2016, 'Steenstra, Knibbe, Rai, van Westrenen', 'Constraints on core formation in Vesta from metal–silicate partitioning of siderophile elements', 'Geochim. Cosmochim. Acta 177, 48–61'],
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

export const gallery = [
  { img: 'piston-cylinder-press.jpg', alt: instruments[0].alt, cap: 'End-loaded piston cylinder press' },
  { img: 'rheometer-frs1800.jpg', alt: instruments[1].alt, cap: 'Anton Paar FRS 1800 rheometer' },
  { img: 'gas-mixing-furnace.jpg', alt: instruments[3].alt, cap: 'Carbolite Gero gas-mixing furnace' },
  { img: 'wire-loop-samples.jpg', alt: 'A thin wire loop holding several small glassy beads', cap: 'Sample beads on a wire loop' },
  { img: 'run-product-bse.jpg', alt: 'Greyscale electron microscope image showing angular crystals in a fine-grained matrix', cap: 'Electron microscope image of a sample' },
];

export const funders = [
  'European Research Council (ERC Starting Grant VenusVolAtmos)',
  'Dutch Research Council NWO (M-Invest, XS and GO programmes)',
  'Dutch Research Agenda (NWA)',
  'Materials innovation institute (M2i)',
];
