export interface ServiceDetailedItem {
  id: string;
  number: string;
  indexLabel: string;
  title: string;
  headline: string;
  tagline: string;
  personalityKicker: string;
  deliverables: string[];
  image: string;
  imageAlt: string;
  badge: string;
  counter: string;
}

export const servicesDetailedData: ServiceDetailedItem[] = [
  {
    id: "make-people-stop",
    number: "01",
    indexLabel: "MAKE PEOPLE STOP",
    title: "SHORT-FORM VIDEO",
    headline: "MAKE PEOPLE STOP.",
    tagline:
      "Reels, Shorts and TikToks built around the first few seconds — because if nobody stops their thumb, the rest of the video doesn't really matter. We script, shoot, and edit high-retention video that feels native to the platform.",
    personalityKicker: "Good lighting helps. A good idea helps more.",
    deliverables: [
      "Thumb-stopping hooks & open loops",
      "Concepts & full scriptwriting",
      "Hands-on shooting & direction",
      "Dynamic pacing & color grading",
      "Sound design & viral audio curation",
      "Kinetic subtitles & motion text",
      "Weekly platform trend dissection",
    ],
    image: "/assets/camera-sunset.jpg",
    imageAlt: "High-retention short-form video shooting and camera production",
    badge: "VIRAL CORE",
    counter: "01 / 04",
  },
  {
    id: "keep-them-around",
    number: "02",
    indexLabel: "KEEP THEM AROUND",
    title: "SOCIAL MANAGEMENT",
    headline: "KEEP THEM AROUND.",
    tagline:
      "Posting consistently is the easy part. The real work is figuring out what your audience actually cares to watch, then giving them a genuine reason to come back tomorrow instead of scrolling past.",
    personalityKicker: "Yes, we can make a content calendar. No, it doesn't have to be boring.",
    deliverables: [
      "Audience-first content roadmaps",
      "Daily publishing & platform scheduling",
      "Engaged community & DM conversation",
      "Hook-driven copywriting & captions",
      "Retention & drop-off analytics audit",
      "Fast feedback loop & iteration sprints",
    ],
    image: "/assets/case-marketing-billboard.jpg",
    imageAlt: "Posting is not Marketing billboard social management campaign",
    badge: "GROWTH ENGINE",
    counter: "02 / 04",
  },
  {
    id: "make-it-look-like-you",
    number: "03",
    indexLabel: "MAKE IT LOOK LIKE YOU",
    title: "CREATIVE DIRECTION",
    headline: "MAKE IT LOOK LIKE YOU.",
    tagline:
      "Good content gets fleeting attention. Recognisable content gets remembered. We give your channels an unmistakable visual signature that feels like a polished editorial publication, not a generic Canva template.",
    personalityKicker: "Trends are useful. Building your entire personality around them isn't.",
    deliverables: [
      "Visual identity & feed guidelines",
      "Set, lighting & photography direction",
      "Bespoke carousel template systems",
      "Signature typography & color rules",
      "Campaign concept decks & moodboards",
      "Cover art, thumbnails & profile polish",
    ],
    image: "/assets/case-marlboro-fries.jpg",
    imageAlt: "Subversive editorial creative direction and brand signature",
    badge: "BRAND SIGNATURE",
    counter: "03 / 04",
  },
  {
    id: "the-whole-thing",
    number: "04",
    indexLabel: "THE WHOLE THING",
    title: "FULL SOCIAL PRESENCE",
    headline: "THE WHOLE THING.",
    tagline:
      "For brands and founders who don't just need someone to press publish — they need an obsessed creative partner to think through the ideas, direct the production, and own the day-to-day presence from start to finish.",
    personalityKicker: "Think of it as having an in-house creative director without the corporate fluff.",
    deliverables: [
      "End-to-end multi-platform strategy",
      "Monthly batch shooting & video sprints",
      "Full daily channel management",
      "Creative direction & art supervision",
      "Active community nurturing",
      "Conversion & bio funnel architecture",
      "Direct weekly founder access & reviews",
    ],
    image: "/assets/case-crisis-phone.jpg",
    imageAlt: "For creative crisis only red telephone partnership showcase",
    badge: "ALL-IN PARTNERSHIP",
    counter: "04 / 04",
  },
];
