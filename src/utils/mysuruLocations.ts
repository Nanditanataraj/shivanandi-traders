export interface MysuruLocation {
  name: string;
  area: string;
  pincode: string;
  lat: number;
  lng: number;
  isPopular?: boolean;
}

export const MYSURU_POPULAR_LOCATIONS: MysuruLocation[] = [
  {
    name: 'Kuvempunagar',
    area: 'Complex & Kamakshi Hospital Road',
    pincode: '570023',
    lat: 12.2895,
    lng: 76.6265,
    isPopular: true
  },
  {
    name: 'Saraswathipuram',
    area: 'Near Maruthi Temple & Fire Brigade',
    pincode: '570009',
    lat: 12.3025,
    lng: 76.6360,
    isPopular: true
  },
  {
    name: 'Gokulam 3rd Stage',
    area: 'Yoga Hub & Contour Road',
    pincode: '570002',
    lat: 12.3275,
    lng: 76.6280,
    isPopular: true
  },
  {
    name: 'Jayalakshmipuram',
    area: 'Kalidasa Road / Temple Bell',
    pincode: '570012',
    lat: 12.3200,
    lng: 76.6350,
    isPopular: true
  },
  {
    name: 'Vijayanagar 2nd Stage',
    area: 'Water Tank Circle & High Tension Road',
    pincode: '570017',
    lat: 12.3360,
    lng: 76.6110,
    isPopular: true
  },
  {
    name: 'V.V. Mohalla',
    area: 'Vani Vilas Market & Temple Road',
    pincode: '570002',
    lat: 12.3160,
    lng: 76.6430,
    isPopular: true
  },
  {
    name: 'Ramakrishna Nagar',
    area: 'E & F Block, Ring Road',
    pincode: '570022',
    lat: 12.2790,
    lng: 76.6190,
    isPopular: true
  },
  {
    name: 'Dattagalli / Kanakadasa Nagar',
    area: 'Ring Road Junction',
    pincode: '570022',
    lat: 12.2830,
    lng: 76.6080,
    isPopular: true
  },
  {
    name: 'Hebbal 1st Stage',
    area: 'Infosys & L&T Industrial Area',
    pincode: '570016',
    lat: 12.3580,
    lng: 76.6020,
    isPopular: true
  },
  {
    name: 'Chamundi Hill Foothills',
    area: 'Tawrekere & JSS College Circle',
    pincode: '570010',
    lat: 12.2920,
    lng: 76.6710,
    isPopular: false
  },
  {
    name: 'Yadavagiri',
    area: 'Akashavani & Railway Colony',
    pincode: '570020',
    lat: 12.3240,
    lng: 76.6480,
    isPopular: false
  },
  {
    name: 'Bannimantap',
    area: 'Torch Light Parade Ground',
    pincode: '570015',
    lat: 12.3390,
    lng: 76.6540,
    isPopular: false
  },
  {
    name: 'Bogadi 2nd Stage',
    area: 'Nirmithi Kendra & Ring Road',
    pincode: '570026',
    lat: 12.3020,
    lng: 76.5950,
    isPopular: false
  },
  {
    name: 'Nanjangud Highway Outer',
    area: 'Kadakola Industrial Area (15 km)',
    pincode: '571311',
    lat: 12.1850,
    lng: 76.6710,
    isPopular: false
  }
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
