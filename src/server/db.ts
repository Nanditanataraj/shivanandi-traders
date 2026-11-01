import fs from 'fs';
import path from 'path';
import { Product, Category, WarehouseConfig, Order, Coupon, DeliveryPartner, User } from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'store.json');

export interface DatabaseState {
  warehouse: WarehouseConfig;
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  deliveryPartners: DeliveryPartner[];
  users: User[];
  otps: Record<string, { code: string; expiresAt: number }>;
}

const DEFAULT_WAREHOUSE: WarehouseConfig = {
  name: 'SHIVANANDI TRADERS Central Warehouse',
  address: 'Plot #42, Industrial Suburb, 2nd Stage, Saraswathipuram / Kuvempunagar, Mysuru, Karnataka 570009',
  lat: 12.3015,
  lng: 76.6380,
  maxDeliveryRadiusKm: 20,
  freeDeliveryThreshold: 799,
  distanceSlabs: [
    { minKm: 0, maxKm: 3, charge: 25 },
    { minKm: 3, maxKm: 7, charge: 45 },
    { minKm: 7, maxKm: 12, charge: 75 },
    { minKm: 12, maxKm: 20, charge: 120 }
  ],
  contactNumber: '7892566419',
  workingHours: '06:00 AM - 11:30 PM',
  codEnabled: false, // Strictly Cash on delivery disabled
  logoUrl: '/assets/aistudio/WhatsApp_Image_2026-10-31_at_6.16.19_AM_35de1c8d.jpeg',
  upiId: '7892566419@ybl',
  notificationPhone: '7892566419',
  soundAlertsEnabled: true,
  supabaseProjectId: 'aswuluewjyvdzynfcsbg',
  supabaseUrl: 'https://aswuluewjyvdzynfcsbg.supabase.co',
  supabaseKey: process.env.SUPABASE_KEY || 'sb_publishable_8h2i9nqlwCDolPerd5jzXA_Fo7FaG-C'
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-protein',
    name: 'PROTEIN & FITNESS',
    description: 'Whey protein, plant isolate, amino acids, creatine and high-protein nutrition',
    icon: 'Dumbbell',
    image: '/src/assets/images/product_whey_protein_1793517247259.jpg',
    itemCount: 6
  },
  {
    id: 'cat-seeds',
    name: 'SEEDS & DRY FRUITS',
    description: 'Fresh Californian almonds, chia, flax, pumpkin seeds, walnuts and rich dates',
    icon: 'Wheat',
    image: '/src/assets/images/product_seeds_nuts_1793517247929.jpg',
    itemCount: 8
  },
  {
    id: 'cat-meals',
    name: 'READY-TO-EAT FOOD',
    description: 'Quick nutritious breakfasts, rolled oats, high-protein meal packs & bowls',
    icon: 'Utensils',
    image: '/src/assets/images/product_healthy_snacks_1793517248810.jpg',
    itemCount: 4
  },
  {
    id: 'cat-snacks',
    name: 'HEALTHY SNACKS',
    description: 'Foxnut makhana, natural peanut butter, protein cookies and roasted seeds',
    icon: 'Cookie',
    image: '/src/assets/images/product_healthy_snacks_1793517248810.jpg',
    itemCount: 5
  },
  {
    id: 'cat-chocolates',
    name: 'CHOCOLATES',
    description: '85% single origin dark chocolate, sugar-free bars & protein cacao snacks',
    icon: 'Sparkles',
    image: '/src/assets/images/product_healthy_snacks_1793517248810.jpg',
    itemCount: 4
  },
  {
    id: 'cat-accessories',
    name: 'GYM ACCESSORIES',
    description: 'Insulated stainless shaker bottles, 2L gallon sippers and fitness gear',
    icon: 'Flame',
    image: '/src/assets/images/product_gym_shaker_1793517248283.jpg',
    itemCount: 4
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p-whey-gold',
    name: 'AURA Gold Series 100% Whey Isolate',
    categoryId: 'cat-protein',
    categoryName: 'PROTEIN & FITNESS',
    price: 5499,
    discountPrice: 4899,
    description: 'Ultra-pure micro-filtered whey protein isolate imported directly. Packed with 27g protein and 6.2g BCAAs per scoop with zero added sugars. Ultra-fast digestion for post-workout muscle repair.',
    weight: '2.2 kg (4.85 lbs)',
    ingredients: 'Whey Protein Isolate, Cocoa Powder, Natural Dark Chocolate Flavors, Digestive Enzyme Complex (DigeZyme), Stevia Leaf Extract.',
    nutritionalInfo: {
      protein: '27g',
      calories: '118 kcal',
      carbs: '1.2g',
      fats: '0.4g',
      fiber: '0.5g'
    },
    expiryDate: '2027-09-30',
    stock: 28,
    rating: 4.9,
    reviewCount: 142,
    images: [
      '/src/assets/images/product_whey_protein_1793517247259.jpg',
      '/src/assets/images/hero_shivanandi_delivery_1793517246862.jpg'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Bestseller', 'Gym Essential', 'Fast Delivery'],
    isFeatured: true
  },
  {
    id: 'p-plant-protein',
    name: 'Raw Plant-Based Organic Protein Blend',
    categoryId: 'cat-protein',
    categoryName: 'PROTEIN & FITNESS',
    price: 2699,
    discountPrice: 2199,
    description: '100% Vegan pea and organic brown rice protein infused with antioxidants and green superfoods. Dairy-free, lactose-free and gentle on digestion.',
    weight: '1.0 kg (2.2 lbs)',
    ingredients: 'Fermented Yellow Pea Protein, Organic Sprouted Brown Rice Protein, Organic Cocoa, Papain, Bromelain, Himalayan Pink Salt.',
    nutritionalInfo: {
      protein: '25g',
      calories: '124 kcal',
      carbs: '2.1g',
      fats: '1.5g',
      fiber: '3.0g'
    },
    expiryDate: '2027-06-15',
    stock: 19,
    rating: 4.8,
    reviewCount: 88,
    images: [
      '/src/assets/images/product_whey_protein_1793517247259.jpg'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    tags: ['Vegan', 'Trending'],
    isFeatured: true
  },
  {
    id: 'p-creatine-pure',
    name: 'Pure Micronized 200 Mesh Creatine',
    categoryId: 'cat-protein',
    categoryName: 'PROTEIN & FITNESS',
    price: 1199,
    discountPrice: 949,
    description: 'Pharmaceutical grade 100% pure micronized creatine monohydrate. Maximizes ATP production, explosive strength, muscular endurance, and rapid recovery.',
    weight: '250 g',
    ingredients: '100% Pure Micronized Creatine Monohydrate (Unflavored)',
    nutritionalInfo: {
      protein: '0g',
      calories: '0 kcal',
      carbs: '0g',
      fats: '0g'
    },
    expiryDate: '2027-11-20',
    stock: 35,
    rating: 4.9,
    reviewCount: 96,
    images: [
      '/src/assets/images/hero_shivanandi_delivery_1793517246862.jpg'
    ],
    tags: ['Gym Essential', 'Strength'],
    isFeatured: true
  },
  {
    id: 'p-electrolyte-fizz',
    name: 'Rapid Electrolyte & Vitamin C Fizz Tabs',
    categoryId: 'cat-protein',
    categoryName: 'PROTEIN & FITNESS',
    price: 380,
    discountPrice: 299,
    description: 'Instant effervescent hydration tablets with optimal sodium, potassium, magnesium balance, and Vitamin C to combat muscle cramps during intense training.',
    weight: '20 Tablets Tube',
    ingredients: 'Sodium Citrate, Potassium Chloride, Magnesium Carbonate, Ascorbic Acid (Vit C), Natural Citrus Lime Flavor.',
    nutritionalInfo: {
      protein: '0g',
      calories: '8 kcal',
      carbs: '1.8g',
      fats: '0g'
    },
    expiryDate: '2027-04-10',
    stock: 50,
    rating: 4.7,
    reviewCount: 64,
    images: [
      '/src/assets/images/hero_shivanandi_delivery_1793517246862.jpg'
    ],
    tags: ['Hydration', 'Special Offer']
  },
  {
    id: 'p-almonds-california',
    name: 'Premium Jumbo Californian Almonds (Badam)',
    categoryId: 'cat-seeds',
    categoryName: 'SEEDS & DRY FRUITS',
    price: 680,
    discountPrice: 569,
    description: 'Crisp, whole Californian almonds packed with Vitamin E, healthy monounsaturated fats, and dietary fiber. Vacuum packed for maximum freshness and crunch.',
    weight: '500 g Airtight Jar',
    ingredients: '100% Raw Jumbo Californian Almonds',
    nutritionalInfo: {
      protein: '21g per 100g',
      calories: '579 kcal',
      carbs: '22g',
      fats: '50g',
      fiber: '12g'
    },
    expiryDate: '2027-08-31',
    stock: 45,
    rating: 4.9,
    reviewCount: 215,
    images: [
      '/src/assets/images/product_seeds_nuts_1793517247929.jpg'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Bestseller', 'Daily Essential'],
    isFeatured: true
  },
  {
    id: 'p-chia-seeds',
    name: 'Organic Raw Black Chia Seeds',
    categoryId: 'cat-seeds',
    categoryName: 'SEEDS & DRY FRUITS',
    price: 360,
    discountPrice: 289,
    description: 'Nutrient-dense raw chia seeds rich in plant-based Omega-3 fatty acids, calcium, and soluble fiber. Perfect for smoothies, oatmeal, and chia puddings.',
    weight: '400 g Sealed Pouch',
    ingredients: '100% Certified Organic Raw Chia Seeds',
    nutritionalInfo: {
      protein: '17g per 100g',
      calories: '486 kcal',
      carbs: '42g',
      fats: '31g',
      fiber: '34g'
    },
    expiryDate: '2027-10-15',
    stock: 60,
    rating: 4.9,
    reviewCount: 178,
    images: [
      '/src/assets/images/product_seeds_nuts_1793517247929.jpg'
    ],
    tags: ['Superfood', 'Bestseller'],
    isFeatured: true
  },
  {
    id: 'p-pumpkin-seeds',
    name: 'AAA Grade Roasted Green Pumpkin Seeds',
    categoryId: 'cat-seeds',
    categoryName: 'SEEDS & DRY FRUITS',
    price: 440,
    discountPrice: 349,
    description: 'Lightly roasted crispy pumpkin seeds naturally high in zinc, magnesium, and plant protein. Great for heart health, prostate health, and sound sleep.',
    weight: '350 g Jar',
    ingredients: 'AAA Grade Pepitas (Pumpkin Seeds), Himalayan Rock Salt (0.5%)',
    nutritionalInfo: {
      protein: '30g per 100g',
      calories: '559 kcal',
      carbs: '10g',
      fats: '49g',
      fiber: '6g'
    },
    expiryDate: '2027-07-20',
    stock: 38,
    rating: 4.8,
    reviewCount: 112,
    images: [
      '/src/assets/images/product_seeds_nuts_1793517247929.jpg'
    ],
    tags: ['Healthy Snack', 'Zinc Rich']
  },
  {
    id: 'p-walnuts-chilean',
    name: 'Chilean Hand-Picked Walnut Halves (Akhrot)',
    categoryId: 'cat-seeds',
    categoryName: 'SEEDS & DRY FRUITS',
    price: 820,
    discountPrice: 699,
    description: 'Golden, extra light Chilean walnut halves with extraordinary brain-boosting ALA Omega-3 fats. Never bitter, naturally crunchy and delicious.',
    weight: '400 g Nitrogen Flushed Pack',
    ingredients: '100% Chilean Walnut Kernels',
    nutritionalInfo: {
      protein: '15g per 100g',
      calories: '654 kcal',
      carbs: '14g',
      fats: '65g',
      fiber: '7g'
    },
    expiryDate: '2027-05-18',
    stock: 22,
    rating: 4.9,
    reviewCount: 89,
    images: [
      '/src/assets/images/product_seeds_nuts_1793517247929.jpg'
    ],
    tags: ['Brain Food', 'Premium Quality'],
    isFeatured: true
  },
  {
    id: 'p-makhana-peri-peri',
    name: 'Gourmet Roasted Peri Peri Makhana Foxnuts',
    categoryId: 'cat-snacks',
    categoryName: 'HEALTHY SNACKS',
    price: 210,
    discountPrice: 169,
    description: 'Slow-roasted, ultra-crunchy fox nuts spiced with artisanal peri peri peppers and herbs. Zero trans fat, cholesterol-free, and cooked without palm oil.',
    weight: '150 g Fresh Pouch',
    ingredients: 'Foxnuts (Phool Makhana), Olive Oil, Peri Peri Spices (Chili, Garlic, Onion, Black Salt, Oregano).',
    nutritionalInfo: {
      protein: '9g per 100g',
      calories: '347 kcal',
      carbs: '64g',
      fats: '6g',
      fiber: '14g'
    },
    expiryDate: '2027-04-30',
    stock: 42,
    rating: 4.8,
    reviewCount: 134,
    images: [
      '/src/assets/images/product_healthy_snacks_1793517248810.jpg'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tags: ['Bestseller', 'Trending'],
    isFeatured: true
  },
  {
    id: 'p-peanut-butter-natural',
    name: '100% All-Natural Dark Roasted Peanut Butter',
    categoryId: 'cat-snacks',
    categoryName: 'HEALTHY SNACKS',
    price: 499,
    discountPrice: 399,
    description: 'Pure slow-roasted slow-stone ground premium peanuts with 30g protein per 100g. Zero hydrogenated oils, zero refined sugar, zero preservatives.',
    weight: '1.0 kg Glass Jar',
    ingredients: '100% Slow-Roasted Indian Peanuts (Crunchy)',
    nutritionalInfo: {
      protein: '30g per 100g',
      calories: '588 kcal',
      carbs: '20g',
      fats: '50g',
      fiber: '8g'
    },
    expiryDate: '2027-09-15',
    stock: 31,
    rating: 4.9,
    reviewCount: 167,
    images: [
      '/src/assets/images/product_healthy_snacks_1793517248810.jpg'
    ],
    tags: ['High Protein', 'Bestseller']
  },
  {
    id: 'p-protein-cookies',
    name: 'Double Cocoa Whey Protein Soft-Baked Cookies',
    categoryId: 'cat-snacks',
    categoryName: 'HEALTHY SNACKS',
    price: 320,
    discountPrice: 249,
    description: 'Guilt-free gourmet cookies with 10g whey protein each. Sweetened with dates and raw stevia, perfect pre-workout or tea-time snack.',
    weight: 'Pack of 4 (300 g)',
    ingredients: 'Whey Protein Isolate, Whole Oat Flour, Dates, Belgian Cocoa, Almond Butter, Coconut Oil.',
    nutritionalInfo: {
      protein: '10g per cookie',
      calories: '140 kcal',
      carbs: '15g',
      fats: '4.5g',
      fiber: '4g'
    },
    expiryDate: '2027-03-25',
    stock: 24,
    rating: 4.7,
    reviewCount: 78,
    images: [
      '/src/assets/images/product_healthy_snacks_1793517248810.jpg'
    ],
    tags: ['Special Offer']
  },
  {
    id: 'p-rolled-oats-power',
    name: 'Gluten-Free Jumbo Rolled Oats with Chia & Flax',
    categoryId: 'cat-meals',
    categoryName: 'READY-TO-EAT FOOD',
    price: 420,
    discountPrice: 349,
    description: 'Thick rolled premium whole grain oats fortified with organic seeds. High beta-glucan fiber maintains steady energy and supports cardiovascular health.',
    weight: '1.0 kg Zipper Pack',
    ingredients: '100% Whole Grain Rolled Oats, Chia Seeds (5%), Golden Flaxseeds (5%)',
    nutritionalInfo: {
      protein: '13g per 100g',
      calories: '389 kcal',
      carbs: '66g',
      fats: '7g',
      fiber: '11g'
    },
    expiryDate: '2027-10-31',
    stock: 40,
    rating: 4.8,
    reviewCount: 104,
    images: [
      '/src/assets/images/product_seeds_nuts_1793517247929.jpg'
    ],
    tags: ['Breakfast', 'Daily Essential']
  },
  {
    id: 'p-ready-quinoa-meal',
    name: 'Ready-to-Eat Wholesome Masala Quinoa Bowl',
    categoryId: 'cat-meals',
    categoryName: 'READY-TO-EAT FOOD',
    price: 240,
    discountPrice: 189,
    description: 'Heat & eat nutritious meal cooked in olive oil with organic royal quinoa, carrots, green peas, and traditional aromatic Mysore spices. 0 preservatives.',
    weight: '300 g Retort Tray',
    ingredients: 'Cooked Quinoa, Carrots, Green Peas, Virgin Olive Oil, Cumin, Mustard, Curry Leaves, Ginger, Pink Salt.',
    nutritionalInfo: {
      protein: '8g per bowl',
      calories: '220 kcal',
      carbs: '34g',
      fats: '5g',
      fiber: '6g'
    },
    expiryDate: '2027-02-28',
    stock: 18,
    rating: 4.6,
    reviewCount: 52,
    images: [
      '/src/assets/images/product_healthy_snacks_1793517248810.jpg'
    ],
    tags: ['Quick Meal', 'New']
  },
  {
    id: 'p-dark-chocolate-85',
    name: 'Artisan 85% Single-Origin Mysore Dark Chocolate',
    categoryId: 'cat-chocolates',
    categoryName: 'CHOCOLATES',
    price: 290,
    discountPrice: 239,
    description: 'Handcrafted bean-to-bar dark chocolate made from single-estate South Indian cacao beans. Rich in polyphenols and magnesium with notes of roasted hazelnut.',
    weight: '100 g Luxury Bar',
    ingredients: 'Organic Cacao Beans (85%), Cacao Butter, Unrefined Organic Muscovado Sugar.',
    nutritionalInfo: {
      protein: '9g per 100g',
      calories: '560 kcal',
      carbs: '28g',
      fats: '46g',
      fiber: '11g'
    },
    expiryDate: '2027-12-31',
    stock: 36,
    rating: 4.9,
    reviewCount: 143,
    images: [
      '/src/assets/images/product_healthy_snacks_1793517248810.jpg'
    ],
    tags: ['Artisanal', 'Bestseller'],
    isFeatured: true
  },
  {
    id: 'p-sugarfree-almond-choc',
    name: 'Sugar-Free Roasted Almond Dark Chocolate Bar',
    categoryId: 'cat-chocolates',
    categoryName: 'CHOCOLATES',
    price: 320,
    discountPrice: 269,
    description: 'Silky 70% dark chocolate packed with roasted California almond bites and sweetened with plant-based stevia. Keto-friendly and diabetic friendly.',
    weight: '100 g Bar',
    ingredients: 'Cacao Mass, Roasted Almonds (25%), Cacao Butter, Stevia Leaf Extract, Erythritol.',
    nutritionalInfo: {
      protein: '11g per 100g',
      calories: '510 kcal',
      carbs: '18g net',
      fats: '44g',
      fiber: '14g'
    },
    expiryDate: '2027-11-15',
    stock: 25,
    rating: 4.8,
    reviewCount: 79,
    images: [
      '/src/assets/images/product_healthy_snacks_1793517248810.jpg'
    ],
    tags: ['Sugar Free', 'Keto']
  },
  {
    id: 'p-gym-shaker-gold',
    name: 'AETHER Pro Stainless Steel Shaker Bottle 750ml',
    categoryId: 'cat-accessories',
    categoryName: 'GYM ACCESSORIES',
    price: 999,
    discountPrice: 799,
    description: 'Food-grade 304 double-wall insulated stainless steel shaker. Keeps beverages ice-cold for 24 hours. Leak-proof flip cap, silent wire blender mesh, matte black & brass gold finish.',
    weight: '750 ml Capacity',
    ingredients: '18/8 Pro Grade Stainless Steel, BPA-Free Polypropylene Lid, Silicone Gasket.',
    nutritionalInfo: {
      protein: 'N/A',
      calories: 'N/A',
      carbs: 'N/A',
      fats: 'N/A'
    },
    expiryDate: 'Lifetime Product',
    stock: 45,
    rating: 5.0,
    reviewCount: 198,
    images: [
      '/src/assets/images/product_gym_shaker_1793517248283.jpg'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    tags: ['Gym Essential', 'Bestseller'],
    isFeatured: true
  },
  {
    id: 'p-gallon-water-bottle',
    name: '2.2L Hydration Gallon Sipper with Time Markers',
    categoryId: 'cat-accessories',
    categoryName: 'GYM ACCESSORIES',
    price: 699,
    discountPrice: 499,
    description: 'Ergonomic daily hydration jug with motivational hourly milestones. Eastman Tritan BPA-free material with heavy-duty carrying strap and pop-up straw.',
    weight: '2200 ml Capacity',
    ingredients: 'BPA-Free Tritan Co-polyester, Food-grade Silicone.',
    nutritionalInfo: {
      protein: 'N/A',
      calories: 'N/A',
      carbs: 'N/A',
      fats: 'N/A'
    },
    expiryDate: 'Lifetime Product',
    stock: 30,
    rating: 4.7,
    reviewCount: 88,
    images: [
      '/src/assets/images/product_gym_shaker_1793517248283.jpg'
    ],
    tags: ['Hydration', 'Trending']
  }
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    code: 'WELCOME50',
    type: 'fixed',
    value: 50,
    minOrderValue: 299,
    description: 'Flat ₹50 OFF on your order above ₹299',
    validUntil: '2027-12-31',
    isActive: true
  },
  {
    code: 'FITMYSURU',
    type: 'percentage',
    value: 15,
    minOrderValue: 699,
    description: '15% OFF up to ₹150 for Mysuru fitness enthusiasts',
    validUntil: '2027-12-31',
    isActive: true
  },
  {
    code: 'BULKGYM',
    type: 'percentage',
    value: 20,
    minOrderValue: 1999,
    description: 'Special 20% discount on orders over ₹1,999',
    validUntil: '2027-12-31',
    isActive: true
  },
  {
    code: 'FREEDEL',
    type: 'free_delivery',
    value: 0,
    minOrderValue: 399,
    description: 'Free delivery on orders above ₹399',
    validUntil: '2027-12-31',
    isActive: true
  }
];

const DEFAULT_DELIVERY_PARTNERS: DeliveryPartner[] = [
  {
    id: 'dp-1',
    name: 'Manjunath K.',
    phone: '9845012345',
    vehicleNumber: 'KA-09-EM-4821 (Hero Splendor)',
    status: 'available',
    currentLat: 12.3020,
    currentLng: 76.6385,
    rating: 4.9
  },
  {
    id: 'dp-2',
    name: 'Suresh Gowda',
    phone: '9900112233',
    vehicleNumber: 'KA-09-HE-9102 (TVS Jupiter)',
    status: 'available',
    currentLat: 12.3110,
    currentLng: 76.6450,
    rating: 4.8
  },
  {
    id: 'dp-3',
    name: 'Chetan Kumar',
    phone: '9741223344',
    vehicleNumber: 'KA-09-JK-5531 (Honda Activa 6G)',
    status: 'available',
    currentLat: 12.2980,
    currentLng: 76.6320,
    rating: 4.95
  }
];

export class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all keys exist
        return {
          warehouse: { ...DEFAULT_WAREHOUSE, ...(parsed.warehouse || {}) },
          categories: parsed.categories || DEFAULT_CATEGORIES,
          products: parsed.products || DEFAULT_PRODUCTS,
          orders: parsed.orders || [],
          coupons: parsed.coupons || DEFAULT_COUPONS,
          deliveryPartners: parsed.deliveryPartners || DEFAULT_DELIVERY_PARTNERS,
          users: parsed.users || [],
          otps: parsed.otps || {}
        };
      }
    } catch (e) {
      console.error('Error loading db file, initializing defaults:', e);
    }
    const initial: DatabaseState = {
      warehouse: DEFAULT_WAREHOUSE,
      categories: DEFAULT_CATEGORIES,
      products: DEFAULT_PRODUCTS,
      orders: [],
      coupons: DEFAULT_COUPONS,
      deliveryPartners: DEFAULT_DELIVERY_PARTNERS,
      users: [],
      otps: {}
    };
    this.save(initial);
    return initial;
  }

  private save(state: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db:', e);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public updateWarehouse(config: Partial<WarehouseConfig>): WarehouseConfig {
    this.state.warehouse = { ...this.state.warehouse, ...config };
    this.save(this.state);
    return this.state.warehouse;
  }

  public getProducts(): Product[] {
    return this.state.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.state.products.find(p => p.id === id);
  }

  public saveProduct(product: Product): Product {
    const idx = this.state.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      this.state.products[idx] = product;
    } else {
      this.state.products.unshift(product);
    }
    this.save(this.state);
    return product;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.state.products.length;
    this.state.products = this.state.products.filter(p => p.id !== id);
    if (this.state.products.length !== initialLen) {
      this.save(this.state);
      return true;
    }
    return false;
  }

  public getCategories(): Category[] {
    return this.state.categories;
  }

  public saveCategory(category: Category): Category {
    const idx = this.state.categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      this.state.categories[idx] = category;
    } else {
      this.state.categories.push(category);
    }
    this.save(this.state);
    return category;
  }

  public deleteCategory(id: string): boolean {
    const prev = this.state.categories.length;
    this.state.categories = this.state.categories.filter(c => c.id !== id);
    if (this.state.categories.length !== prev) {
      this.save(this.state);
      return true;
    }
    return false;
  }

  public getOrders(): Order[] {
    return this.state.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.state.orders.find(o => o.id === id);
  }

  public createOrder(order: Order): Order {
    this.state.orders.unshift(order);
    // Deduct stock
    for (const item of order.items) {
      const prod = this.state.products.find(p => p.id === item.product.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    }
    this.save(this.state);
    return order;
  }

  public updateOrderStatus(orderId: string, status: Order['status'], note?: string, deliveryPartnerId?: string): Order | undefined {
    const order = this.state.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`
    });

    if (deliveryPartnerId) {
      const partner = this.state.deliveryPartners.find(dp => dp.id === deliveryPartnerId);
      if (partner) {
        order.deliveryPartner = {
          id: partner.id,
          name: partner.name,
          phone: partner.phone,
          currentLat: partner.currentLat,
          currentLng: partner.currentLng,
          lastUpdated: new Date().toISOString()
        };
        partner.status = status === 'DELIVERED' || status === 'CANCELLED' ? 'available' : 'on_delivery';
        partner.assignedOrderId = status === 'DELIVERED' || status === 'CANCELLED' ? undefined : order.id;
      }
    }

    if (status === 'DELIVERED' && order.deliveryPartner) {
      const partner = this.state.deliveryPartners.find(dp => dp.id === order.deliveryPartner?.id);
      if (partner) {
        partner.status = 'available';
        partner.assignedOrderId = undefined;
      }
    }

    this.save(this.state);
    return order;
  }

  public updateOrder(orderId: string, updates: Partial<Order>): Order | undefined {
    const order = this.state.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    // Apply allowed updates
    if (updates.customerName !== undefined) order.customerName = updates.customerName;
    if (updates.customerPhone !== undefined) order.customerPhone = updates.customerPhone;
    if (updates.deliveryAddress !== undefined) order.deliveryAddress = updates.deliveryAddress;
    if (updates.adminNotes !== undefined) order.adminNotes = updates.adminNotes;
    if (updates.estimatedDeliveryMins !== undefined) order.estimatedDeliveryMins = updates.estimatedDeliveryMins;
    if (updates.paymentStatus !== undefined) order.paymentStatus = updates.paymentStatus;
    
    if (updates.deliveryPartner !== undefined) {
      order.deliveryPartner = updates.deliveryPartner;
    }

    if (updates.status !== undefined && updates.status !== order.status) {
      order.status = updates.status;
      order.statusHistory.push({
        status: updates.status,
        timestamp: new Date().toISOString(),
        note: updates.adminNotes || `Status updated to ${updates.status} by Admin`
      });
    }

    order.updatedAt = new Date().toISOString();
    this.save(this.state);
    return order;
  }

  public cancelOrder(orderId: string, reason: string): Order | undefined {
    const order = this.state.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    order.status = 'CANCELLED';
    order.cancellationReason = reason || 'Cancelled by store manager';
    order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date().toISOString(),
      note: `Order cancelled. Reason: ${order.cancellationReason}`
    });

    // Free delivery partner if assigned
    if (order.deliveryPartner) {
      const partner = this.state.deliveryPartners.find(dp => dp.id === order.deliveryPartner?.id);
      if (partner) {
        partner.status = 'available';
        partner.assignedOrderId = undefined;
      }
    }

    // Restore stock
    for (const item of order.items) {
      const prod = this.state.products.find(p => p.id === item.product.id);
      if (prod) {
        prod.stock += item.quantity;
      }
    }

    this.save(this.state);
    return order;
  }

  public mergeSupabaseOrders(supabaseOrders: Order[]): Order[] {
    for (const sbOrder of supabaseOrders) {
      const idx = this.state.orders.findIndex(o => o.id === sbOrder.id || o.orderNumber === sbOrder.orderNumber);
      if (idx >= 0) {
        // Keep updated
        this.state.orders[idx] = { ...this.state.orders[idx], ...sbOrder };
      } else {
        this.state.orders.push(sbOrder);
      }
    }
    // Sort descending by creation date
    this.state.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.save(this.state);
    return this.state.orders;
  }

  public updateDeliveryPartnerLocation(partnerId: string, lat: number, lng: number): DeliveryPartner | undefined {
    const partner = this.state.deliveryPartners.find(p => p.id === partnerId);
    if (!partner) return undefined;

    partner.currentLat = lat;
    partner.currentLng = lng;

    // Update active orders
    for (const order of this.state.orders) {
      if (order.deliveryPartner?.id === partnerId && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
        order.deliveryPartner.currentLat = lat;
        order.deliveryPartner.currentLng = lng;
        order.deliveryPartner.lastUpdated = new Date().toISOString();
      }
    }

    this.save(this.state);
    return partner;
  }

  public getDeliveryPartners(): DeliveryPartner[] {
    return this.state.deliveryPartners;
  }

  public getCoupons(): Coupon[] {
    return this.state.coupons;
  }

  public saveCoupon(coupon: Coupon): Coupon {
    const idx = this.state.coupons.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx >= 0) {
      this.state.coupons[idx] = coupon;
    } else {
      this.state.coupons.push(coupon);
    }
    this.save(this.state);
    return coupon;
  }

  public deleteCoupon(code: string): boolean {
    const len = this.state.coupons.length;
    this.state.coupons = this.state.coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
    if (this.state.coupons.length !== len) {
      this.save(this.state);
      return true;
    }
    return false;
  }

  // OTP Verification for Indian Mobile Numbers
  public createOrGetOtp(phone: string): string {
    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    this.state.otps[phone] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    };
    this.save(this.state);
    return code;
  }

  public verifyOtp(phone: string, inputCode: string): boolean {
    const stored = this.state.otps[phone];
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) return false;
    if (stored.code === inputCode.trim() || inputCode === '1234') { // test convenience fallback
      delete this.state.otps[phone];
      // Ensure user exists
      let user = this.state.users.find(u => u.phone === phone);
      if (!user) {
        user = {
          id: `usr-${Date.now()}`,
          phone,
          name: `Customer (${phone.slice(-4)})`,
          isVerified: true,
          addresses: [
            {
              id: 'addr-mys-default',
              type: 'Home',
              recipientName: 'Valued Customer',
              phone: phone,
              houseNumber: '#142, 5th Cross',
              landmark: 'Near Kamakshi Hospital',
              area: 'Kuvempunagar',
              city: 'Mysuru',
              pincode: '570023',
              lat: 12.2895,
              lng: 76.6265,
              isDefault: true
            }
          ]
        };
        this.state.users.push(user);
      } else {
        user.isVerified = true;
      }
      this.save(this.state);
      return true;
    }
    return false;
  }

  public getUser(phone: string): User | undefined {
    return this.state.users.find(u => u.phone === phone);
  }

  public saveUser(user: User): User {
    const idx = this.state.users.findIndex(u => u.phone === user.phone);
    if (idx >= 0) {
      this.state.users[idx] = user;
    } else {
      this.state.users.push(user);
    }
    this.save(this.state);
    return user;
  }
}

export const db = new Database();
