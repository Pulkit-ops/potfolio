export interface MetricItem {
  id: string;
  value: string;
  accent: string;
  label: string;
  image?: string;
  marqueeText?: string;
  link?: string;
}

export const metricsData: MetricItem[] = [
  {
    id: "impressions",
    value: "85M",
    accent: "+",
    label: "Organic Video Impressions",
    image: "/assets/case-lifestyle.webp",
    marqueeText: "85M+ ORGANIC VIDEO IMPRESSIONS • VIRAL SPRINT • 100% ORGANIC",
    link: "#proven-results",
  },
  {
    id: "followers",
    value: "14M",
    accent: "+",
    label: "Followers Cultivated Across Feeds",
    image: "/assets/hero-subject.webp",
    marqueeText: "14M+ FOLLOWERS CULTIVATED ACROSS FEEDS • AUDIENCE ECOSYSTEM",
    link: "#proven-results",
  },
  {
    id: "roas",
    value: "4.8",
    accent: "X",
    label: "Average Campaign ROAS / Value",
    image: "/assets/case-audio.webp",
    marqueeText: "4.8X AVERAGE CAMPAIGN ROAS / VALUE • CONVERSION FUNNELS",
    link: "#capabilities",
  },
  {
    id: "series",
    value: "50",
    accent: "+",
    label: "High-Performing Viral Series",
    image: "/assets/case-beverage.webp",
    marqueeText: "50+ HIGH-PERFORMING VIRAL SERIES • THUMB-STOPPING HOOKS",
    link: "#proven-results",
  },
];

export const provenResultsGallery = [
  {
    image: "/assets/case-lifestyle.webp",
    text: "Vanguard • 38.2M Views",
  },
  {
    image: "/assets/case-audio.webp",
    text: "Aura Acoustics • 8.4M Reach",
  },
  {
    image: "/assets/case-beverage.webp",
    text: "Zing Energy • 120M+ Views",
  },
  {
    image: "/assets/case-techwear.jpg",
    text: "Aether Techwear • 480K Sprint",
  },
  {
    image: "/assets/case-chronograph.jpg",
    text: "Kinetik Chrono • 4.8X ROAS",
  },
];

export const socialLinks = [
  {
    label: "IG",
    name: "Instagram",
    handle: "@wtfpulkit",
    url: "https://www.instagram.com/wtfpulkit/",
    type: "instagram",
  },
  {
    label: "LI",
    name: "LinkedIn",
    handle: "Pulkit Maheshwari",
    url: "https://www.linkedin.com/in/maheshwari-pulkit30/",
    type: "linkedin",
  },
  {
    label: "Email",
    name: "Email",
    handle: "pulkitmaheshwari80@gmail.com",
    url: "mailto:pulkitmaheshwari80@gmail.com",
    type: "mail",
  },
  {
    label: "WA",
    name: "WhatsApp",
    handle: "+91 88550 49161",
    url: "https://wa.me/918855049161",
    type: "whatsapp",
  },
];

export const contactDetails = {
  email: "pulkitmaheshwari80@gmail.com",
  phone: "+91 8855049161",
  phoneDisplay: "+91 88550 49161",
  whatsappUrl: "https://wa.me/918855049161",
  instagramUrl: "https://www.instagram.com/wtfpulkit/",
  instagramHandle: "@wtfpulkit",
  linkedinUrl: "https://www.linkedin.com/in/maheshwari-pulkit30/",
  linkedinHandle: "Pulkit Maheshwari",
  availability: "Available for Select Sprints",
  location: "Mumbai / Remote Worldwide • IST (GMT+5:30)",
  status: "Available for Select Sprints",
};
