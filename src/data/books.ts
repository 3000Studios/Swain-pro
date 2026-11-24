/**
 * 3000 Studios Press catalog, copied from the 3000studios.vip repo
 * (apps/web/src/data/storeBooks.ts at a611d34, 2026-11-24) so swain.pro shows
 * the same shelf. That list was read from the Payhip store
 * (payhip.com/3000Studios) on 2026-11-18. Every title is $9.99 and checks out
 * on its own Payhip product page; covers are the store's own product images.
 * Keep in sync with 3000studios.vip when titles are added.
 */

export type ShelfId =
  | 'fiction'
  | 'mystery'
  | 'kitchen'
  | 'creator'
  | 'openme'
  | 'fortune'
  | 'reference'
  | 'exam';

export interface StoreBook {
  title: string;
  cat: ShelfId;
  /** Payhip product page — the real checkout for this title. */
  url: string;
  /** Payhip S3 object key for the cover. */
  cover: string;
}

export const SHELVES: { id: ShelfId; label: string; blurb: string }[] = [
  { id: 'fiction', label: 'Fantasy & Sci-Fi', blurb: 'Epic fantasy, space opera and speculative novels.' },
  { id: 'mystery', label: 'Mystery', blurb: 'Fair-play mysteries with every clue in plain sight.' },
  { id: 'kitchen', label: 'Holiday Kitchen', blurb: 'Christmas cookbooks and edible gifts.' },
  { id: 'openme', label: 'Open Me Series', blurb: 'Interactive gift books for every room of the house.' },
  { id: 'creator', label: 'Creator Playbooks', blurb: 'Grow a channel and compound your content.' },
  { id: 'reference', label: 'Reference Shelf 2027', blurb: 'Almanac, atlas, dictionary and study references.' },
  { id: 'fortune', label: '365 Days of Fortune', blurb: 'A daily guide for every sign of 2026.' },
  { id: 'exam', label: 'Exam Prep', blurb: 'Certification and licensing exam guides.' },
];

export const STORE_PRICE = '$9.99';

/** Payhip's own image CDN; `width` picks the delivered size (default is the
 *  store's 750px). Thumbnails ask for less so a phone never downloads
 *  poster-size covers for a 150px card. */
export const coverUrl = (b: StoreBook, width = 750) =>
  `https://payhip.com/cdn-cgi/image/format=auto,width=${width}/https://pe56d.s3.amazonaws.com/${b.cover}`;

export const STORE_BOOKS: StoreBook[] = [
  {"title": "The Foxglove Armistice", "cat": "fiction", "url": "https://payhip.com/b/iDGNg", "cover": "o_1k6jbhq144cn51rfgh14sdic11f.jpg"},
  {"title": "The Ember Cartographer", "cat": "fiction", "url": "https://payhip.com/b/9C7Hx", "cover": "o_1k6jbfh2i1eih1mg13m3ed9vgh1f.jpg"},
  {"title": "The Last Train to Larkspur Hollow", "cat": "mystery", "url": "https://payhip.com/b/qK3jp", "cover": "o_1k6jbjpjj6gkdak1t57b6219kp1f.jpg"},
  {"title": "Hidden in Plain Sight", "cat": "mystery", "url": "https://payhip.com/b/ye2JZ", "cover": "o_1k6jbnrjdrvd127k14retqo3bt1f.jpg"},
  {"title": "The Collector's Marginalia", "cat": "mystery", "url": "https://payhip.com/b/lZ5cu", "cover": "o_1k6jbln891ktf1fb49j55d81nr81f.jpg"},
  {"title": "The Twelve Cookies of Christmas", "cat": "kitchen", "url": "https://payhip.com/b/OVRKl", "cover": "o_1k6jb81bc1v4rbbn1487tct1f201f.jpg"},
  {"title": "Compounding Content", "cat": "creator", "url": "https://payhip.com/b/PNoCf", "cover": "o_1k6jbre2p2231ust11qm8kh1ds1f.jpg"},
  {"title": "Grow the Channel", "cat": "creator", "url": "https://payhip.com/b/1dDVW", "cover": "o_1k6jbpnbep2q1bik12bc2r9mbl1f.jpg"},
  {"title": "Certified Welding Inspector Exam Prep (AWS CWI)", "cat": "exam", "url": "https://payhip.com/b/owzji", "cover": "o_1k7nh3uh01rr53mqk4s1jio1n421f.jpg"},
  {"title": "Sterile Processing Technician Exam Prep (HSPA CRCST)", "cat": "exam", "url": "https://payhip.com/b/c38Gm", "cover": "o_1k7ngvvvf7qsjon29hc341jtm1f.jpg"},
  {"title": "Certified Surgical Technologist Exam Prep (NBSTSA CST)", "cat": "exam", "url": "https://payhip.com/b/jZ63n", "cover": "o_1k7ngrkj4ejhims1566120asmh1f.jpg"},
  {"title": "NATE HVAC Certification Exam Prep", "cat": "exam", "url": "https://payhip.com/b/GjD1H", "cover": "o_1k7nglpnlopf17o8100sjuf17dq1f.jpg"},
  {"title": "Journeyman Plumber Exam Prep — IPC & UPC", "cat": "exam", "url": "https://payhip.com/b/zuYiK", "cover": "o_1k7kuiid878ee5u8ig5po5801f.jpg"},
  {"title": "Journeyman Electrician Exam Prep — Calculations & Code Review", "cat": "exam", "url": "https://payhip.com/b/HEap0", "cover": "o_1k7kufhlb2ormgmbeh1glbfm1f.jpg"},
  {"title": "Cosmetology State Board Exam Prep", "cat": "exam", "url": "https://payhip.com/b/EFnRc", "cover": "o_1k7kucj0jju4tqo1de71q7kvlh1f.jpg"},
  {"title": "Massage Therapy MBLEx Exam Prep", "cat": "exam", "url": "https://payhip.com/b/e8I4k", "cover": "o_1k7ku7pnul32tbh1bbt17521srf1f.jpg"},
  {"title": "Certified Dietary Manager Exam Prep (CBDM CDM, CFPP)", "cat": "exam", "url": "https://payhip.com/b/txNFB", "cover": "o_1k7ic713q679riehmdj145341f.jpg"},
  {"title": "Certified Energy Manager Exam Prep (AEE CEM)", "cat": "exam", "url": "https://payhip.com/b/giz03", "cover": "o_1k7ic4ijvhv0log1v9j9ut1j8q1f.jpg"},
  {"title": "PHR Exam Prep (HRCI Professional in Human Resources)", "cat": "exam", "url": "https://payhip.com/b/EiuTq", "cover": "o_1k7ic1o741pq71ljlccj1u881df1f.jpg"},
  {"title": "Certified Fire Protection Specialist Exam Prep (NFPA CFPS)", "cat": "exam", "url": "https://payhip.com/b/JcC9U", "cover": "o_1k7ibtcdj11lra7b1761u4v1cat1f.jpg"},
  {"title": "LEED v5 Green Associate Exam Prep (GBCI)", "cat": "exam", "url": "https://payhip.com/b/MUnZI", "cover": "o_1k7fpjd5118tftv51j6d1hqelee1f.jpg"},
  {"title": "Praxis Core Exam Prep (ETS Praxis)", "cat": "exam", "url": "https://payhip.com/b/6Yl4c", "cover": "o_1k7fpff055941he91k631daq7rg1f.jpg"},
  {"title": "Aircraft Dispatcher Exam Prep (FAA ADX)", "cat": "exam", "url": "https://payhip.com/b/NYbC7", "cover": "o_1k7fpc5811m2s1gnudji1ivk6dj1f.jpg"},
  {"title": "Healthcare Quality Exam Prep (NAHQ CPHQ)", "cat": "exam", "url": "https://payhip.com/b/4w9QH", "cover": "o_1k7d75vmd1dkgr4nsk6dvhv91f.jpg"},
  {"title": "Certified Ophthalmic Assistant Exam Prep (IJCAHPO COA)", "cat": "exam", "url": "https://payhip.com/b/n690f", "cover": "o_1k7d72l181utf1abqnvu13km1m8c1f.jpg"},
  {"title": "Dental Hygiene Exam Prep (NBDHE)", "cat": "exam", "url": "https://payhip.com/b/d3mxF", "cover": "o_1k7d6ucjm14k8ldm1vr01oi9rfu1f.jpg"},
  {"title": "The Night Bakery of Bramblewick", "cat": "fiction", "url": "https://payhip.com/b/1uvmp", "cover": "o_1k7836i3a1eo81ht114795qd1hd61k.jpg"},
  {"title": "What We Fix in Orbit", "cat": "fiction", "url": "https://payhip.com/b/psD4x", "cover": "o_1k782rob786a1jmm10g918pk17k91k.jpg"},
  {"title": "The Face You Borrowed", "cat": "fiction", "url": "https://payhip.com/b/oDYyS", "cover": "o_1k7829dni18nn1p521b3b1i3214tf1k.jpg"},
  {"title": "Oathbound to the Drowned King", "cat": "fiction", "url": "https://payhip.com/b/74zAX", "cover": "o_1k73pgedu1nng1mi51p801kmk2kk1f.jpg"},
  {"title": "War of the Glass Beasts", "cat": "fiction", "url": "https://payhip.com/b/bmFd6", "cover": "o_1k73pdr9h1lc1bc5d2f1g8sftm1f.jpg"},
  {"title": "Thistledown and Iron", "cat": "fiction", "url": "https://payhip.com/b/BL1vx", "cover": "o_1k73pbkj51jgu2l1104818v7iug1f.jpg"},
  {"title": "The Ninth Bell of Aurelith", "cat": "fiction", "url": "https://payhip.com/b/tr2PB", "cover": "o_1k73p9gdbkdc887od81v9ruas1f.jpg"},
  {"title": "The River That Returns the Dead", "cat": "fiction", "url": "https://payhip.com/b/VfynW", "cover": "o_1k73p7hgi13m11a66kn91i9fnql1f.jpg"},
  {"title": "The Salt Road Witches", "cat": "fiction", "url": "https://payhip.com/b/6QezL", "cover": "o_1k73p5redii2q0sshn63m17td1f.jpg"},
  {"title": "Presents You Can Eat", "cat": "kitchen", "url": "https://payhip.com/b/ABRd8", "cover": "o_1k73p41vp4i15h11q67fmf1pb11f.jpg"},
  {"title": "The Slow-Cooker Christmas", "cat": "kitchen", "url": "https://payhip.com/b/jRIfT", "cover": "o_1k73p27t710fndaj7rd4jfjj51f.jpg"},
  {"title": "The Make-Ahead Christmas Breakfast Book", "cat": "kitchen", "url": "https://payhip.com/b/oA9ln", "cover": "o_1k73p013c8h1c2nk111itd12pf1f.jpg"},
  {"title": "A Georgia Christmas Kitchen", "cat": "kitchen", "url": "https://payhip.com/b/mCiEN", "cover": "o_1k73oqtdd1aq8rr0164oba985m1f.jpg"},
  {"title": "The Last Broadcast Before Morning", "cat": "fiction", "url": "https://payhip.com/b/JVh6O", "cover": "o_1k6v4gi8lte8j5em8q1n2j1hnk1f.png"},
  {"title": "The City That Rented the Sky", "cat": "fiction", "url": "https://payhip.com/b/m9sbB", "cover": "o_1k6v2gefb1f951ne41r461o221nti1f.png"},
  {"title": "All My Lives, One Winner", "cat": "fiction", "url": "https://payhip.com/b/sf5SA", "cover": "o_1k6v0ucmk1rkp1apl1avhblb1m2d1f.png"},
  {"title": "The Funeral Fleet of Proxima", "cat": "fiction", "url": "https://payhip.com/b/Q0RmT", "cover": "o_1k6uuqo7t960kp41d211u7u8b91f.png"},
  {"title": "The Millionth Citizen", "cat": "fiction", "url": "https://payhip.com/b/VgfO6", "cover": "o_1k6usv7vg1o5ejrvcke1715144t1f.png"},
  {"title": "The Algorithm That Prayed", "cat": "fiction", "url": "https://payhip.com/b/v8zuC", "cover": "o_1k6ur3js51l1dq9q1uf51r1p1r4e1f.png"},
  {"title": "The Last Cartographer of Europa", "cat": "fiction", "url": "https://payhip.com/b/smZE9", "cover": "o_1k6upnngm2sd9mvd6c1fb41ust1f.png"},
  {"title": "The Human Replacement Index", "cat": "fiction", "url": "https://payhip.com/b/h0JTc", "cover": "o_1k6uo3bf01utcrn6ecl1arspd41f.png"},
  {"title": "A Choir of Dead Satellites", "cat": "fiction", "url": "https://payhip.com/b/moHrj", "cover": "o_1k6umqebu1to4onqv614gb1jrd1f.png"},
  {"title": "The Price of Remembering Mars", "cat": "fiction", "url": "https://payhip.com/b/VUgRh", "cover": "o_1k6uli8ia3bd1hfu12tkl1d1acn1f.png"},
  {"title": "Open Me: Home for the Holidays", "cat": "openme", "url": "https://payhip.com/b/gn591", "cover": "o_1k6uja0cs13kmvo98lrph2qrl1f.png"},
  {"title": "Emberhall: The Hollow Crown", "cat": "fiction", "url": "https://payhip.com/b/Gt5av", "cover": "o_1k6ud7ei41q1p17pg1fva1qsb1vso1f.png"},
  {"title": "Almanac 2027", "cat": "reference", "url": "https://payhip.com/b/dRmB7", "cover": "o_1k6ubn13n1c4b1ok11a6b1t85bn71f.png"},
  {"title": "The Emergency Handbook", "cat": "reference", "url": "https://payhip.com/b/oR1IW", "cover": "o_1k6uau7af1f31bpjpql1cj7041f.png"},
  {"title": "Atlas 2027", "cat": "reference", "url": "https://payhip.com/b/boY7c", "cover": "o_1k6u9t1ai1om07e31jdrl7ufdj1f.png"},
  {"title": "Math 2027", "cat": "reference", "url": "https://payhip.com/b/H9W2L", "cover": "o_1k6u9hijes5l11pjqsb133e193d1f.png"},
  {"title": "Emberhall: The Drowned Library", "cat": "fiction", "url": "https://payhip.com/b/Qu8gX", "cover": "o_1k6u91qg15bs1mvk1u801kf31c9s1f.png"},
  {"title": "Emberhall: The First Flame", "cat": "fiction", "url": "https://payhip.com/b/t9MTE", "cover": "o_1k6u8tge21p5s6j9101rlsm2b1f.png"},
  {"title": "Open Me: Closets and Skeletons", "cat": "openme", "url": "https://payhip.com/b/CJf30", "cover": "o_1k6u8fsrk1eoa14dngb3hhu36m1f.png"},
  {"title": "Science 2027", "cat": "reference", "url": "https://payhip.com/b/ldqKP", "cover": "o_1k6u7me8v1igeptn1mhdqag17fp1f.png"},
  {"title": "Open Me: The Porch", "cat": "openme", "url": "https://payhip.com/b/LhA0a", "cover": "o_1k6u4mjnm1ui8kim1iio508n5s1f.png"},
  {"title": "History 2027", "cat": "reference", "url": "https://payhip.com/b/hZ2sH", "cover": "o_1k6u7h5j3pke1mnk2iv8lb1dff1f.png"},
  {"title": "The Fastest Guide to Getting Your Real Estate License — All 50 States", "cat": "exam", "url": "https://payhip.com/b/HtqAw", "cover": "o_1k6u780lj1tds1h201psi14p1omt1f.png"},
  {"title": "Thesaurus 2027", "cat": "reference", "url": "https://payhip.com/b/xcAsn", "cover": "o_1k6u71sddlg845d2kc1vrp18s11f.png"},
  {"title": "Dictionary 2027", "cat": "reference", "url": "https://payhip.com/b/ItU2o", "cover": "o_1k6u67urh1g6qs5c6gu10do1h4r1f.png"},
  {"title": "Open Me: The Mailbox", "cat": "openme", "url": "https://payhip.com/b/R5tE1", "cover": "o_1k6u2o2uo1sicde816eb18c01nak1f.png"},
  {"title": "Open Me: Open House", "cat": "openme", "url": "https://payhip.com/b/y7uwo", "cover": "o_1k6u2fq2jrad8rh10r71ugh16tr1f.png"},
  {"title": "Open Me: Upstairs Downstairs", "cat": "openme", "url": "https://payhip.com/b/29yGw", "cover": "o_1k6ttfecqrm02su18643shkr11f.png"},
  {"title": "Open Me: The Fridge Door", "cat": "openme", "url": "https://payhip.com/b/Dfk2O", "cover": "o_1k6tsbd2db7688p1b8ee6e23l1f.jpg"},
  {"title": "Open Me: Keys Under the Mat", "cat": "openme", "url": "https://payhip.com/b/f4xIY", "cover": "o_1k6tqr32daso366vsog9cta61f.jpg"},
  {"title": "Open Me: The Nightstand Book", "cat": "openme", "url": "https://payhip.com/b/TLSkl", "cover": "o_1k6tpbuml1vdneae1s5q11ifr91f.jpg"},
  {"title": "Open Me: Basement Tapes", "cat": "openme", "url": "https://payhip.com/b/0GZv4", "cover": "o_1k6tnss6517j39601ka319p4mlj1f.jpg"},
  {"title": "Open Me: The Garage Sale", "cat": "openme", "url": "https://payhip.com/b/K6CE0", "cover": "o_1k6tmf8f51s34v0srts1u8k12sk1f.jpg"},
  {"title": "Open Me: Company's Coming", "cat": "openme", "url": "https://payhip.com/b/ZqBAt", "cover": "o_1k6tkuqpnnmbel8tmf1eah9nt1f.jpg"},
  {"title": "Open Me: A Room for That", "cat": "openme", "url": "https://payhip.com/b/agpmq", "cover": "o_1k6tjt9eg1lspjiavd01fg1a401f.jpg"},
  {"title": "Open Me: The Junk Drawer", "cat": "openme", "url": "https://payhip.com/b/pwuTU", "cover": "o_1k6tij5frodr6cgkci6uoua1f.jpg"},
  {"title": "Open Me If You Dare", "cat": "openme", "url": "https://payhip.com/b/nMRHL", "cover": "o_1k6th9q43dee1ihiaeb1hvgfpt1f.jpg"},
  {"title": "Open Me at Christmas", "cat": "openme", "url": "https://payhip.com/b/Qovhd", "cover": "o_1k6tg7pvgsk71qudquq1ma15tt1f.jpg"},
  {"title": "Open Me: The Money Edition", "cat": "openme", "url": "https://payhip.com/b/tHnU7", "cover": "o_1k6tf3s1rtebbdg1jvr18sm1ibt1f.jpg"},
  {"title": "Open Me After Midnight", "cat": "openme", "url": "https://payhip.com/b/VXHmJ", "cover": "o_1k6taq1efkfit1roduk314t01f.jpg"},
  {"title": "365 Days of Fortune: Aquarius 2026", "cat": "fortune", "url": "https://payhip.com/b/5wdh0", "cover": "o_1k6t3q3kf1ohaoaduvp1ugc8qp1f.png"},
  {"title": "365 Days of Fortune: Capricorn 2026", "cat": "fortune", "url": "https://payhip.com/b/2eBS7", "cover": "o_1k6t3ojsq1mg713551v4k2bn8bc1f.png"},
  {"title": "365 Days of Fortune: Sagittarius 2026", "cat": "fortune", "url": "https://payhip.com/b/X53vu", "cover": "o_1k6t3muskmh8u2g1ekg1dv31doh1f.png"},
  {"title": "365 Days of Fortune: Scorpio 2026", "cat": "fortune", "url": "https://payhip.com/b/pQhD4", "cover": "o_1k6t3ldsl1megdv4rdqt9i1h5l1f.png"},
  {"title": "365 Days of Fortune: Libra 2026", "cat": "fortune", "url": "https://payhip.com/b/GYlIc", "cover": "o_1k6t3j9qffh34n2ud31lbf11121f.png"},
  {"title": "365 Days of Fortune: Virgo 2026", "cat": "fortune", "url": "https://payhip.com/b/63mOz", "cover": "o_1k6t3hlv2148j1b221ngj1fn61i1b1f.png"},
  {"title": "365 Days of Fortune: Leo 2026", "cat": "fortune", "url": "https://payhip.com/b/jNvtL", "cover": "o_1k6t3frqgmcd1rln13uguls1cu91f.png"},
  {"title": "365 Days of Fortune: Cancer 2026", "cat": "fortune", "url": "https://payhip.com/b/kne0X", "cover": "o_1k6t3dvvv8qslhe1jha2177qa1f.png"},
  {"title": "365 Days of Fortune: Gemini 2026", "cat": "fortune", "url": "https://payhip.com/b/CbJwS", "cover": "o_1k6t340vo16l4c49tnvsv3401f.png"},
  {"title": "365 Days of Fortune: Taurus 2026", "cat": "fortune", "url": "https://payhip.com/b/hpk7n", "cover": "o_1k6t31t1q16gidbl1ssr88o1j0b1f.png"},
  {"title": "365 Days of Fortune: Aries 2026", "cat": "fortune", "url": "https://payhip.com/b/1XQR7", "cover": "o_1k6t30b96105omlr1l5e3qd1bea1f.png"},
  {"title": "365 Days of Fortune: Pisces 2026", "cat": "fortune", "url": "https://payhip.com/b/sNvgH", "cover": "o_1k6t2ub5m1vcq17uh1jcv1o6aa171f.png"},
  {"title": "Open Me Again: Even More Everything", "cat": "openme", "url": "https://payhip.com/b/63dQi", "cover": "o_1k6t0sgas1v5v12661gn716u4hh41f.jpg"},
  {"title": "Open Me: The Book of Everything", "cat": "openme", "url": "https://payhip.com/b/ytKc6", "cover": "o_1k6sur48tmtl1su3rp1ps9ioi1f.png"},
];

export const booksOnShelf = (id: ShelfId) => STORE_BOOKS.filter((b) => b.cat === id);
