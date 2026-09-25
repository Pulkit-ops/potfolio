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
    value: "2.5M",
    accent: "+",
    label: "Organic Video Impressions",
    image: "/assets/camera-sunset.jpg",
    marqueeText: "2.5M+ ORGANIC VIDEO IMPRESSIONS • VIRAL SPRINT • 100% ORGANIC",
    link: "#proven-results",
  },
  {
    id: "followers",
    value: "87K",
    accent: "",
    label: "Followers Cultivated Across Feeds",
    image: "/assets/about/pulkit-portrait.jpeg",
    marqueeText: "87K FOLLOWERS CULTIVATED ACROSS FEEDS • AUDIENCE ECOSYSTEM",
    link: "#proven-results",
  },
  {
    id: "roas",
    value: "4.8",
    accent: "X",
    label: "Average Campaign ROAS / Value",
    image: "/assets/case-marketing-billboard.jpg",
    marqueeText: "4.8X AVERAGE CAMPAIGN ROAS / VALUE • CONVERSION FUNNELS",
    link: "#capabilities",
  },
  {
    id: "series",
    value: "5",
    accent: "+",
    label: "High-Performing Viral Series",
    image: "/assets/case-crisis-phone.jpg",
    marqueeText: "5+ HIGH-PERFORMING VIRAL SERIES • THUMB-STOPPING HOOKS",
    link: "#proven-results",
  },
];

export const provenResultsGallery = [
  {
    image: "/assets/case-vyom-interiors.webp",
    text: "Vyom Interiors • 610K Views",
  },
  {
    image: "/assets/case-bucket-list-adventure.webp",
    text: "Bucket List Adventure • 140K Views",
  },
  {
    image: "/assets/case-ayrak-care.webp",
    text: "Ayrak Care • 4.4K Views",
  },
  {
    image: "/assets/case-avitech-automation.webp",
    text: "Avitech Automation • 1.4K Views",
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
