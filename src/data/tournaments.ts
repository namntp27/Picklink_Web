export type TournamentStatus = 'open' | 'upcoming' | 'closed' | 'finished';
export type RegistrationStatus = 'confirmed' | 'pending' | 'waitlist' | 'cancelled';

export type TournamentTeam = {
  id: string;
  name: string;
  level: string;
  area: string;
  status: 'approved' | 'pending' | 'waitlist';
};

export type TournamentRegistration = {
  teamName: string;
  partnerName: string;
  division: string;
  status: RegistrationStatus;
  paid: boolean;
  registeredAt: string;
  checkInCode: string;
  seed?: number;
};

export type TournamentDetail = {
  id: string;
  title: string;
  status: TournamentStatus;
  image: string;
  city: string;
  venue: string;
  address: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  format: string;
  bracket: string;
  level: string;
  divisions: string[];
  capacity: number;
  registered: number;
  entryFee: number;
  prizePool: number;
  organizer: string;
  organizerPhone: string;
  description: string;
  rules: string[];
  schedule: Array<{
    time: string;
    title: string;
    description: string;
  }>;
  prizes: Array<{
    rank: string;
    reward: string;
  }>;
  teams: TournamentTeam[];
  myRegistration?: TournamentRegistration;
};

export const tournaments: TournamentDetail[] = [
  {
    id: 'summer-pickleball-2026',
    title: 'Giải Pickleball Mùa Hè 2026',
    status: 'open',
    image: 'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1600&auto=format&fit=crop',
    city: 'Hà Nội',
    venue: 'Picklink Cầu Giấy',
    address: 'Số 1 Duy Tân, Phường Cầu Giấy, Hà Nội',
    startDate: '2026-07-15',
    endDate: '2026-07-16',
    registrationDeadline: '2026-07-10',
    format: 'Đôi nam nữ',
    bracket: 'Vòng bảng + loại trực tiếp',
    level: '3.0 - 4.5',
    divisions: ['Đôi nam nữ 3.0', 'Đôi nam nữ 3.5', 'Đôi nam nữ 4.0+'],
    capacity: 40,
    registered: 32,
    entryFee: 500000,
    prizePool: 17000000,
    organizer: 'Picklink Tournament Team',
    organizerPhone: '0901 234 567',
    description:
      'Ngày hội Pickleball mùa hè dành cho người chơi phong trào và bán chuyên tại Hà Nội. Giải có chia bảng theo trình độ, điều phối trọng tài, livestream bán kết và chung kết.',
    rules: [
      'Mỗi đội gồm 2 vận động viên, đăng ký đúng hạng trình độ.',
      'Thi đấu 1 set đến 11 điểm ở vòng bảng, thắng cách biệt 2 điểm.',
      'Vòng loại trực tiếp thi đấu 1 set đến 15 điểm, đổi sân khi một đội đạt 8 điểm.',
      'Ban tổ chức cung cấp bóng thi đấu đạt chuẩn, vận động viên tự chuẩn bị vợt.',
    ],
    schedule: [
      { time: '07:00 - 07:45', title: 'Check-in vận động viên', description: 'Nhận áo thi đấu, mã đội và lịch sân.' },
      { time: '08:00 - 11:30', title: 'Vòng bảng', description: 'Các bảng thi đấu song song trên 6 sân.' },
      { time: '14:00 - 17:30', title: 'Tứ kết và bán kết', description: 'Áp dụng luật đổi sân và timeout chính thức.' },
      { time: '18:00 - 19:00', title: 'Chung kết và trao giải', description: 'Livestream trên kênh cộng đồng Picklink.' },
    ],
    prizes: [
      { rank: 'Giải nhất', reward: '10.000.000 VNĐ + cúp vô địch' },
      { rank: 'Giải nhì', reward: '5.000.000 VNĐ + huy chương' },
      { rank: 'Đồng hạng ba', reward: '2.000.000 VNĐ + quà tài trợ' },
    ],
    teams: [
      { id: 'team-01', name: 'Hà Nội Aces', level: '4.0 - 4.5', area: 'Cầu Giấy', status: 'approved' },
      { id: 'team-02', name: 'Pickle Power', level: '3.5 - 4.0', area: 'Nam Từ Liêm', status: 'approved' },
      { id: 'team-03', name: 'Saigon Smashers', level: '4.0+', area: 'Quận 7', status: 'pending' },
      { id: 'team-04', name: 'Dink Masters', level: '3.0 - 3.5', area: 'Ba Đình', status: 'approved' },
    ],
    myRegistration: {
      teamName: 'Court Leader Duo',
      partnerName: 'Linh Nguyễn',
      division: 'Đôi nam nữ 3.5',
      status: 'confirmed',
      paid: true,
      registeredAt: '2026-06-18T09:20:00',
      checkInCode: 'PKL-SUMMER-024',
      seed: 8,
    },
  },
  {
    id: 'picklink-open-cup',
    title: 'Picklink Open Cup',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=1600&auto=format&fit=crop',
    city: 'TP.HCM',
    venue: 'Pickleball Arena Quận 7',
    address: 'Khu thể thao Nam Sài Gòn, Quận 7, TP.HCM',
    startDate: '2026-08-20',
    endDate: '2026-08-21',
    registrationDeadline: '2026-08-12',
    format: 'Đôi nam / đôi nữ',
    bracket: 'Swiss 4 vòng + playoff',
    level: '2.5 - 4.0',
    divisions: ['Đôi nam 3.0', 'Đôi nữ 3.0', 'Đôi nam 4.0'],
    capacity: 24,
    registered: 12,
    entryFee: 300000,
    prizePool: 9000000,
    organizer: 'Picklink South',
    organizerPhone: '0918 888 222',
    description:
      'Giải mở rộng tại TP.HCM theo thể thức Swiss, phù hợp người chơi muốn trải nghiệm nhiều trận và tích lũy điểm xếp hạng cộng đồng.',
    rules: [
      'Mỗi đội được thi đấu tối thiểu 4 trận Swiss.',
      'Điểm xếp hạng dựa trên số trận thắng, hiệu số điểm và đối đầu trực tiếp.',
      'Đội vắng mặt quá 10 phút bị xử thua trận tương ứng.',
    ],
    schedule: [
      { time: '07:30 - 08:00', title: 'Bốc thăm Swiss', description: 'Công bố lịch vòng 1 và quy tắc tính điểm.' },
      { time: '08:00 - 15:00', title: 'Swiss 4 vòng', description: 'Các đội thi đấu theo điểm tích lũy.' },
      { time: '16:00 - 18:00', title: 'Playoff', description: 'Top 4 mỗi hạng vào bán kết và chung kết.' },
    ],
    prizes: [
      { rank: 'Giải nhất mỗi hạng', reward: '3.000.000 VNĐ + cúp' },
      { rank: 'Giải nhì mỗi hạng', reward: '1.500.000 VNĐ + huy chương' },
      { rank: 'Giải phong cách', reward: 'Voucher sân 1.000.000 VNĐ' },
    ],
    teams: [
      { id: 'team-11', name: 'Saigon Spin', level: '3.0', area: 'Quận 7', status: 'approved' },
      { id: 'team-12', name: 'D7 Picklers', level: '3.5', area: 'Quận 7', status: 'approved' },
      { id: 'team-13', name: 'Net Rush', level: '4.0', area: 'Thủ Đức', status: 'pending' },
    ],
    myRegistration: {
      teamName: 'Cầu Giấy Travelers',
      partnerName: 'Tuấn Trần',
      division: 'Đôi nam 4.0',
      status: 'pending',
      paid: false,
      registeredAt: '2026-06-17T14:05:00',
      checkInCode: 'PKL-OPEN-PENDING',
    },
  },
  {
    id: 'weekend-ladder-may',
    title: 'Weekend Ladder Tournament',
    status: 'finished',
    image: 'https://images.unsplash.com/photo-1642501518638-6f9d6e40496d?q=80&w=1600&auto=format&fit=crop',
    city: 'Hà Nội',
    venue: 'PickleHub Mỹ Đình',
    address: 'KĐT Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
    startDate: '2026-05-01',
    endDate: '2026-05-01',
    registrationDeadline: '2026-04-27',
    format: 'Ladder cá nhân',
    bracket: 'Round robin theo sân',
    level: '2.5 - 4.0',
    divisions: ['Cá nhân 2.5', 'Cá nhân 3.5', 'Cá nhân 4.0'],
    capacity: 36,
    registered: 36,
    entryFee: 200000,
    prizePool: 5000000,
    organizer: 'PickleHub Mỹ Đình',
    organizerPhone: '0919 858 563',
    description:
      'Giải ladder cuối tuần đã hoàn thành, dùng kết quả để cập nhật bảng xếp hạng cộng đồng tháng 5.',
    rules: [
      'Người chơi đổi cặp sau mỗi vòng theo điểm xếp hạng.',
      'Mỗi vòng thi đấu 12 phút, đội dẫn điểm khi hết giờ thắng trận.',
      'Điểm cá nhân cộng dồn từ kết quả từng trận.',
    ],
    schedule: [
      { time: '08:00 - 08:30', title: 'Check-in', description: 'Xác nhận nhóm trình độ.' },
      { time: '08:30 - 11:30', title: 'Ladder 5 vòng', description: 'Ghép cặp tự động sau từng vòng.' },
      { time: '11:45 - 12:00', title: 'Trao giải', description: 'Công bố top 3 từng hạng.' },
    ],
    prizes: [
      { rank: 'Top 1', reward: '2.000.000 VNĐ' },
      { rank: 'Top 2', reward: '1.000.000 VNĐ' },
      { rank: 'Top 3', reward: '500.000 VNĐ' },
    ],
    teams: [
      { id: 'team-21', name: 'Hoàng Minh', level: '4.0', area: 'Ba Đình', status: 'approved' },
      { id: 'team-22', name: 'Lê Thu Hà', level: '3.5', area: 'Nam Từ Liêm', status: 'approved' },
      { id: 'team-23', name: 'Đỗ Lan Anh', level: '4.0', area: 'Hoàn Kiếm', status: 'approved' },
    ],
    myRegistration: {
      teamName: 'Court Leader',
      partnerName: 'Ghép cặp tự động',
      division: 'Cá nhân 3.5',
      status: 'confirmed',
      paid: true,
      registeredAt: '2026-04-20T18:30:00',
      checkInCode: 'PKL-LADDER-112',
      seed: 5,
    },
  },
];

export const getTournamentById = (id?: string) => {
  if (!id) {
    return tournaments[0];
  }

  return tournaments.find((tournament) => tournament.id === id) ?? tournaments[0];
};

export const getMyTournamentRegistrations = () => tournaments.filter((tournament) => Boolean(tournament.myRegistration));

export const formatTournamentCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export const formatTournamentDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

export const formatTournamentDateTime = (dateTime: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateTime));
