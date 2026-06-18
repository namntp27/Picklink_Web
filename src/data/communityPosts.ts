export type CommunityComment = {
  id: string;
  authorName: string;
  avatar: string;
  level: string;
  createdAt: string;
  content: string;
  likes: number;
  replies?: CommunityComment[];
};

export type CommunityPost = {
  id: string;
  authorName: string;
  avatar: string;
  level: string;
  location: string;
  createdAt: string;
  title: string;
  content: string;
  image?: string;
  tags: string[];
  court?: string;
  lookingFor?: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  saved: boolean;
  commentList: CommunityComment[];
};

export const currentCommunityUser = {
  name: 'Court Leader',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
  level: '4.5',
  location: 'Cầu Giấy, Hà Nội',
};

export const communityPosts: CommunityPost[] = [
  {
    id: 'tim-dong-doi-cau-giay-toi-nay',
    authorName: 'Trần Văn Nam',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026703d',
    level: '3.5',
    location: 'Cầu Giấy, Hà Nội',
    createdAt: '2 giờ trước',
    title: 'Tìm đồng đội chơi tối nay ở Cầu Giấy',
    content:
      'Tìm đồng đội chơi tối nay ở sân Cầu Giấy. Mình đang cần 2 slot đánh đôi, trình độ từ 3.0 - 4.0. Ai rảnh nhắn mình nhé, ưu tiên bạn có thể đến trước 18:15 để khởi động.',
    tags: ['Tìm đồng đội', 'Đánh đôi', 'Cầu Giấy'],
    court: 'Sân Pickleball Cầu Giấy',
    lookingFor: 'Cần 2 người chơi trình 3.0 - 4.0',
    likes: 28,
    comments: 7,
    shares: 2,
    liked: false,
    saved: false,
    commentList: [
      {
        id: 'comment-nam-1',
        authorName: 'Hoàng Minh',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
        level: '4.0',
        createdAt: '1 giờ trước',
        content: 'Mình tham gia được một slot, khoảng 18:10 có mặt ở sân.',
        likes: 4,
      },
      {
        id: 'comment-nam-2',
        authorName: 'Mai Phương',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
        level: '3.5',
        createdAt: '42 phút trước',
        content: 'Còn slot không bạn? Mình đánh đôi ổn, có thể ghép với bạn nữ hoặc nam đều được.',
        likes: 3,
        replies: [
          {
            id: 'reply-nam-1',
            authorName: 'Trần Văn Nam',
            avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026703d',
            level: '3.5',
            createdAt: '35 phút trước',
            content: 'Còn nhé, mình giữ cho bạn một slot.',
            likes: 2,
          },
        ],
      },
      {
        id: 'comment-nam-3',
        authorName: 'Lê Thu Hà',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026702d',
        level: '4.0',
        createdAt: '20 phút trước',
        content: 'Nếu thiếu người cuối thì nhắn mình, mình gần sân nên qua nhanh được.',
        likes: 1,
      },
    ],
  },
  {
    id: 'khoe-vot-moi-cuoi-tuan',
    authorName: 'Lê Thu Hà',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026702d',
    level: '4.0',
    location: 'Nam Từ Liêm, Hà Nội',
    createdAt: '6 giờ trước',
    title: 'Khoe vợt mới cho giải cuối tuần',
    content:
      'Khoe vợt mới mua. Cảm giác kiểm soát bóng tốt hơn hẳn, nhất là các pha dink sát lưới. Sẵn sàng cho giải cuối tuần này, ai đã dùng dòng này rồi cho mình xin thêm mẹo setup grip nhé.',
    image: 'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1470&auto=format&fit=crop',
    tags: ['Thiết bị', 'Review vợt', 'Giải đấu'],
    court: 'PickleHub Mỹ Đình',
    likes: 42,
    comments: 12,
    shares: 3,
    liked: true,
    saved: true,
    commentList: [
      {
        id: 'comment-ha-1',
        authorName: 'Nguyễn Minh Anh',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026711d',
        level: '3.5',
        createdAt: '5 giờ trước',
        content: 'Grip này nên quấn thêm một lớp mỏng, đánh lâu đỡ trơn hơn.',
        likes: 6,
      },
      {
        id: 'comment-ha-2',
        authorName: 'Đỗ Lan Anh',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026712d',
        level: '4.5',
        createdAt: '3 giờ trước',
        content: 'Mình cũng đang dùng, hợp đánh kiểm soát nhưng smash cần thêm chút lực cổ tay.',
        likes: 5,
      },
    ],
  },
  {
    id: 'kinh-nghiem-giao-bong-xoay',
    authorName: 'Hoàng Minh',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    level: '5.0',
    location: 'Ba Đình, Hà Nội',
    createdAt: '1 ngày trước',
    title: 'Kinh nghiệm giao bóng xoáy ổn định hơn',
    content:
      'Mình thử giữ cổ tay mềm hơn và để điểm chạm bóng thấp hơn một chút, tỷ lệ giao bóng vào sân tăng rõ. Ai đang tập spin serve có thể thử bài 20 quả mỗi set, ghi lại lỗi theo hướng bóng để chỉnh nhanh.',
    image: 'https://images.unsplash.com/photo-1642501518638-6f9d6e40496d?q=80&w=1470&auto=format&fit=crop',
    tags: ['Kỹ thuật', 'Giao bóng', 'Tập luyện'],
    likes: 65,
    comments: 18,
    shares: 9,
    liked: false,
    saved: false,
    commentList: [
      {
        id: 'comment-minh-1',
        authorName: 'Trần Quốc Bảo',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026709d',
        level: '3.0',
        createdAt: '22 giờ trước',
        content: 'Bạn có video góc quay ngang không? Mình hay bị lỗi bóng cao quá.',
        likes: 2,
      },
    ],
  },
];

export const trendingTopics = [
  {
    category: 'Giải đấu Hà Nội Mở Rộng',
    title: 'Đăng ký tham gia ngay',
    posts: '1.2k bài viết',
  },
  {
    category: 'Thiết bị & dụng cụ',
    title: 'Review vợt Joola Ben Johns',
    posts: '850 bài viết',
  },
  {
    category: 'Hướng dẫn kỹ thuật',
    title: 'Cách giao bóng xoáy',
    posts: '640 bài viết',
  },
];

export const activeCommunityPlayers = [
  {
    name: 'Hoàng Minh',
    level: '5.0',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
  },
  {
    name: 'Mai Phương',
    level: '4.0',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
  },
  {
    name: 'Đỗ Lan Anh',
    level: '4.5',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026712d',
  },
];

export const getCommunityPostById = (id?: string) => {
  if (!id) {
    return communityPosts[0];
  }

  return communityPosts.find((post) => post.id === id) ?? communityPosts[0];
};
