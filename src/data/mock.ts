import { Court, Club } from '../types';

export const featuredCourts: Court[] = [
  {
    id: '1',
    name: 'Trung tÃ¢m Pickleball Trung tÃ¢m',
    image: 'https://images.unsplash.com/photo-1628178120612-4aa4f43de9c6?auto=format&fit=crop&q=80&w=800',
    location: 'Quáº­n 1, HÃ  Ná»™i',
    price: 15,
    rating: 4.8,
    reviews: 124,
    features: ['Trong nhÃ ', 'Cá»­a hÃ ng', 'CÃ  phÃª'],
  },
  {
    id: '2',
    name: 'SÃ¢n Pickleball Ven SÃ´ng',
    image: 'https://images.unsplash.com/photo-1662991873138-0c675c928821?auto=format&fit=crop&q=80&w=800',
    location: 'Quáº­n 2, HÃ  Ná»™i',
    price: 12,
    rating: 4.5,
    reviews: 89,
    features: ['NgoÃ i trá»i', 'ÄÃ¨n chiáº¿u sÃ¡ng', 'BÃ£i Ä‘á»— xe miá»…n phÃ­'],
  },
  {
    id: '3',
    name: 'CÃ¢u Láº¡c Bá»™ Thá»ƒ Thao Elite',
    image: 'https://images.unsplash.com/photo-1596707328904-4f0ece4fb8c7?auto=format&fit=crop&q=80&w=800',
    location: 'Quáº­n 3, HÃ  Ná»™i',
    price: 20,
    rating: 4.9,
    reviews: 256,
    features: ['Trong nhÃ ', 'MÃ¡y láº¡nh', 'PhÃ²ng thay Ä‘á»“'],
  },
];


export const activeClubs: Club[] = [
  {
    id: '1',
    name: 'HÃ  Ná»™i Pickleball Masters',
    location: 'Nhiá»u Ä‘á»‹a Ä‘iá»ƒm',
    members: 156,
    description: 'Cá»™ng Ä‘á»“ng gá»“m nhá»¯ng ngÆ°á»i chÆ¡i cÃ³ kinh nghiá»‡m muá»‘n cáº£i thiá»‡n ká»¹ nÄƒng vÃ  thi Ä‘áº¥u.',
    image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '2',
    name: 'CÃ¢u Láº¡c Bá»™ Cuá»‘i Tuáº§n',
    location: 'Quáº­n 2 & Quáº­n 7',
    members: 89,
    description: 'NhÃ³m chÆ¡i giáº£i trÃ­ chá»§ yáº¿u vÃ o cÃ¡c dá»‹p cuá»‘i tuáº§n. Hoan nghÃªnh má»i trÃ¬nh Ä‘á»™!',
    image: 'https://images.unsplash.com/photo-1517454992576-9d33b8695079?auto=format&fit=crop&q=80&w=800',
  },
];
