import iptvImg from "@/assets/iptv.jpg";
import dishImg from "@/assets/dish.jpg";
import cctvImg from "@/assets/cctv.jpg";

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: "iptv" | "dish" | "cctv" | "services";
  rating: number;
  sold: number;
  badge?: string;
  freeShipping?: boolean;
  description: string;
  features: string[];
  brand: string;
  stock: number;
};

export const PRODUCTS: Product[] = [
  // IPTV
  { id: "mag-524", name: "MAG 524 4K IPTV Box with Wi-Fi 6", price: 199, oldPrice: 320, image: iptvImg, category: "iptv", rating: 5, sold: 1240, freeShipping: true, brand: "Infomir", stock: 25,
    description: "Premium 4K IPTV streaming box with Wi-Fi 6, dual HDMI, and lightning fast performance.",
    features: ["4K HDR support", "Wi-Fi 6 dual band", "HDMI 2.1", "1 year warranty"] },
  { id: "formuler-z11", name: "Formuler Z11 Pro Android IPTV", price: 349, oldPrice: 499, image: iptvImg, category: "iptv", rating: 5, sold: 2100, badge: "Best Seller", freeShipping: true, brand: "Formuler", stock: 18,
    description: "Android 11 IPTV box with backlit remote and premium build.",
    features: ["Android 11", "MYTVOnline 3", "Backlit remote", "Bluetooth 5.0"] },
  { id: "xtream-mini", name: "Xtream Mini IPTV Box Full HD", price: 119, oldPrice: 180, image: iptvImg, category: "iptv", rating: 4, sold: 510, freeShipping: true, brand: "Xtream", stock: 40,
    description: "Budget-friendly Full HD IPTV box with easy setup.",
    features: ["Full HD 1080p", "Wi-Fi enabled", "Simple UI", "USB recording"] },
  { id: "iptv-12m", name: "IPTV Premium Subscription 12 Months 500+ Ch", price: 299, oldPrice: 450, image: iptvImg, category: "iptv", rating: 5, sold: 3200, badge: "Top", freeShipping: true, brand: "VIP STAR", stock: 999,
    description: "12 months premium IPTV subscription with 500+ live channels and VOD.",
    features: ["500+ channels", "4K & HD", "VOD library", "2 device support"] },
  { id: "remote-iptv", name: "Backlit Universal Remote for IPTV Boxes", price: 35, oldPrice: 55, image: iptvImg, category: "iptv", rating: 4, sold: 530, brand: "Generic", stock: 60,
    description: "Universal backlit remote compatible with most IPTV boxes.",
    features: ["Backlit keys", "Universal", "Long range IR", "AAA batteries"] },

  // Dish
  { id: "dish-6ft", name: "Solid 6ft Satellite Dish + LNB Kit", price: 159, oldPrice: 240, image: dishImg, category: "dish", rating: 4, sold: 420, brand: "Solid", stock: 12,
    description: "Heavy-duty 6ft satellite dish with universal LNB included.",
    features: ["6ft diameter", "Galvanized steel", "Universal LNB", "Mounting kit"] },
  { id: "receiver-4k", name: "4K UHD Satellite Receiver with Wi-Fi & YouTube", price: 220, oldPrice: 320, image: dishImg, category: "dish", rating: 5, sold: 380, freeShipping: true, brand: "Starsat", stock: 22,
    description: "4K satellite receiver with built-in Wi-Fi, YouTube, and IPTV support.",
    features: ["4K UHD", "Wi-Fi built in", "YouTube app", "USB record"] },
  { id: "lnb-ku", name: "Ku-Band Universal LNB", price: 29, oldPrice: 45, image: dishImg, category: "dish", rating: 4, sold: 660, brand: "Inverto", stock: 80,
    description: "Universal Ku-band LNB with low noise figure.",
    features: ["0.1 dB noise", "Universal", "Weatherproof", "F-connector"] },
  { id: "coax-100ft", name: "Premium Coaxial Cable 100ft Copper Core", price: 49, oldPrice: 75, image: dishImg, category: "dish", rating: 4, sold: 720, brand: "Belden", stock: 50,
    description: "Premium RG6 coaxial cable, 100ft pure copper core.",
    features: ["Pure copper", "100ft length", "Weather sealed", "F connectors"] },
  { id: "dish-mount", name: "Universal Dish Mount Kit Heavy Duty", price: 25, oldPrice: 40, image: dishImg, category: "dish", rating: 4, sold: 1100, freeShipping: true, brand: "Generic", stock: 100,
    description: "Heavy-duty universal mount kit for satellite dishes.",
    features: ["Galvanized", "Universal", "Wall/pole mount", "All hardware included"] },
  { id: "receiver-hd-pro", name: "HD Satellite Receiver Pro with USB Record", price: 89, oldPrice: 130, image: dishImg, category: "dish", rating: 4, sold: 640, brand: "Starsat", stock: 35,
    description: "HD satellite receiver with USB recording and PVR.",
    features: ["1080p HD", "USB PVR", "EPG support", "Parental control"] },

  // CCTV
  { id: "hik-dome-2mp", name: "Hikvision 2MP Dome CCTV Camera", price: 99, oldPrice: 150, image: cctvImg, category: "cctv", rating: 5, sold: 850, badge: "Hot", brand: "Hikvision", stock: 30,
    description: "Hikvision 2MP indoor dome camera with night vision.",
    features: ["2MP 1080p", "20m IR night vision", "IP67 weather", "POE support"] },
  { id: "wifi-cam-1080", name: "WiFi Smart Security Camera 1080p", price: 79, oldPrice: 119, image: cctvImg, category: "cctv", rating: 4, sold: 1530, freeShipping: true, brand: "Tapo", stock: 45,
    description: "WiFi indoor smart camera with mobile app.",
    features: ["1080p Full HD", "Mobile app", "Motion detection", "2-way audio"] },
  { id: "dahua-bullet-4mp", name: "Dahua 4MP Bullet Outdoor Color Night Vision", price: 145, oldPrice: 210, image: cctvImg, category: "cctv", rating: 5, sold: 290, brand: "Dahua", stock: 20,
    description: "Outdoor 4MP color night vision bullet camera.",
    features: ["4MP resolution", "Full color night", "IP67", "30m range"] },
  { id: "nvr-16ch", name: "16-Channel NVR with Cloud Backup", price: 399, oldPrice: 560, image: cctvImg, category: "cctv", rating: 5, sold: 95, brand: "Hikvision", stock: 8,
    description: "16-channel NVR with cloud backup and 8TB HDD support.",
    features: ["16 channels", "8TB HDD support", "Cloud backup", "H.265+"] },
  { id: "cctv-combo-4", name: "4 Camera CCTV Combo Package + Installation", price: 599, oldPrice: 850, image: cctvImg, category: "cctv", rating: 5, sold: 180, badge: "Combo", brand: "VIP STAR", stock: 15,
    description: "Complete 4-camera CCTV combo with NVR, cables, and free installation.",
    features: ["4 cameras", "4ch NVR + 1TB HDD", "Free installation", "1 year warranty"] },
  { id: "dvr-8ch", name: "8-Channel DVR with 1TB HDD Slot", price: 229, oldPrice: 330, image: cctvImg, category: "cctv", rating: 4, sold: 410, brand: "Hikvision", stock: 12,
    description: "8-channel DVR with HDD slot, mobile access.",
    features: ["8 channels", "1TB HDD slot", "Mobile remote", "HDMI output"] },
  { id: "wifi-cam-pt", name: "Wireless Indoor Pan Tilt Smart Camera", price: 109, oldPrice: 160, image: cctvImg, category: "cctv", rating: 5, sold: 870, freeShipping: true, brand: "Tapo", stock: 28,
    description: "360° pan-tilt indoor camera with auto-tracking.",
    features: ["360° pan/tilt", "Auto tracking", "Night vision", "MicroSD up to 256GB"] },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
export const getProductsByCategory = (cat: Product["category"]) => PRODUCTS.filter((p) => p.category === cat);
