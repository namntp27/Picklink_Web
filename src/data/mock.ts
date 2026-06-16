import { Court, Tournament, Club } from '../types';

export const featuredCourts: Court[] = [
  {
    id: '1',
    name: 'Trung tâm Pickleball Trung tâm',
    image: 'https://images.unsplash.com/photo-1628178120612-4aa4f43de9c6?auto=format&fit=crop&q=80&w=800',
    location: 'Quận 1, Hà Nội',
    price: 15,
    rating: 4.8,
    reviews: 124,
    features: ['Trong nhà', 'Cửa hàng', 'Cà phê'],
  },
  {
    id: '2',
    name: 'Sân Pickleball Ven Sông',
    image: 'https://images.unsplash.com/photo-1662991873138-0c675c928821?auto=format&fit=crop&q=80&w=800',
    location: 'Quận 2, Hà Nội',
    price: 12,
    rating: 4.5,
    reviews: 89,
    features: ['Ngoài trời', 'Đèn chiếu sáng', 'Bãi đỗ xe miễn phí'],
  },
  {
    id: '3',
    name: 'Câu Lạc Bộ Thể Thao Elite',
    image: 'https://images.unsplash.com/photo-1596707328904-4f0ece4fb8c7?auto=format&fit=crop&q=80&w=800',
    location: 'Quận 3, Hà Nội',
    price: 20,
    rating: 4.9,
    reviews: 256,
    features: ['Trong nhà', 'Máy lạnh', 'Phòng thay đồ'],
  },
];

export const upcomingTournaments: Tournament[] = [
  {
    id: '1',
    title: 'Giải Mùa Hè Smash 2024',
    date: '15 Thg 8 - 17 Thg 8, 2024',
    location: 'Trung tâm Quận 1',
    prize: '$5,000',
    participants: 45,
    maxParticipants: 64,
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&q=80&w=800',
    status: 'upcoming',
  },
  {
    id: '2',
    title: 'Giải Cho Người Mới Bắt Đầu',
    date: '01 Thg 9, 2024',
    location: 'Sân Ven Sông',
    prize: '$1,000',
    participants: 28,
    maxParticipants: 32,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=800',
    status: 'upcoming',
  },
];

export const activeClubs: Club[] = [
  {
    id: '1',
    name: 'Hà Nội Pickleball Masters',
    location: 'Nhiều địa điểm',
    members: 156,
    description: 'Cộng đồng gồm những người chơi có kinh nghiệm muốn cải thiện kỹ năng và thi đấu.',
    image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '2',
    name: 'Câu Lạc Bộ Cuối Tuần',
    location: 'Quận 2 & Quận 7',
    members: 89,
    description: 'Nhóm chơi giải trí chủ yếu vào các dịp cuối tuần. Hoan nghênh mọi trình độ!',
    image: 'https://images.unsplash.com/photo-1517454992576-9d33b8695079?auto=format&fit=crop&q=80&w=800',
  },
];
