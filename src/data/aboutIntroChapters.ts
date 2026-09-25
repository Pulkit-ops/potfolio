export interface IntroChapter {
  id: string;
  chapterNum: string;
  eyebrow?: string;
  headlineLines: string[];
  supporting?: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
  transitionType?:
    | "horizontal-wipe"
    | "diagonal-wipe"
    | "vertical-reveal"
    | "scale-fade"
    | "parallax-slide";
}

export const aboutIntroChapters: IntroChapter[] = [
  {
    id: "who-am-i",
    chapterNum: "01",
    headlineLines: ["HI", "I'M PULKIT", "MAHESHWARI."],
    image: "/assets/about/pulkit-portrait.jpeg",
    imageAlt: "Portrait of Pulkit Maheshwari",
    transitionType: "scale-fade",
  },
  {
    id: "experience",
    chapterNum: "02",
    headlineLines: ["I'VE BEEN DOING", "SOCIAL FOR 2+ YEARS."],
    supporting:
      "Dissecting feed algorithms, testing hooks before breakfast, and figuring out what makes someone actually stop their thumb. 2+ years of turning offhand ideas into content people genuinely share.",
    image: "/assets/about/cat-camera.jpg",
    imageAlt: "Behind the camera production work",
    transitionType: "horizontal-wipe",
  },
  {
    id: "craft",
    chapterNum: "03",
    headlineLines: ["I LIKE MAKING", "THINGS."],
    supporting:
      "Video, photography, shooting, editing, creative direction. If there's a camera and a timeline involved, I'm probably already interested. Craft matters.",
    image: "/assets/about/desk-setup.jpg",
    imageAlt: "Personal creative workstation with dual monitors and ambient lighting",
    imagePosition: "object-[center_60%]",
    transitionType: "diagonal-wipe",
  },
  {
    id: "off-the-clock",
    chapterNum: "04",
    headlineLines: ["WHEN I'M NOT", "WORKING..."],
    supporting:
      "Bikes, cars, open highways, sudden road trips, tattoos, clothes, and any excuse to pack a bag and disappear for a few days. The best ideas happen out in the world.",
    image: "/assets/about/bike-road.jpg",
    imageAlt: "Motorcycle journey on scenic mountain pass in the mist",
    imagePosition: "object-[center_65%]",
    transitionType: "parallax-slide",
  },
];
