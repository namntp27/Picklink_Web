import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileText,
  Flag,
  LandPlot,
  LayoutDashboard,
  Lock,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trophy,
  Unlock,
  UserCheck,
  Users,
  UsersRound,
  XCircle,
} from 'lucide-react';

type AdminSectionId =
  | 'overview'
  | 'users'
  | 'courts'
  | 'clubs'
  | 'bookings'
  | 'reports'
  | 'posts'
  | 'reviews'
  | 'tournaments'
  | 'transactions'
  | 'settings';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type AdminStat = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

type AdminRow = {
  id: string;
  cells: string[];
  status: string;
  statusTone: Tone;
  filters: string[];
  actions: string[];
  note?: string;
};

type QueueItem = {
  label: string;
  value: string;
  tone: Tone;
};

type AdminConfig = {
  id: AdminSectionId;
  title: string;
  eyebrow: string;
  description: string;
  primaryAction: string;
  searchPlaceholder: string;
  filters: string[];
  stats: AdminStat[];
  columns: string[];
  rows: AdminRow[];
  queueTitle: string;
  queues: QueueItem[];
};

type SettingGroup = {
  title: string;
  description: string;
  items: Array<{
    label: string;
    helper: string;
    value: string;
    enabled?: boolean;
  }>;
};

const adminNavItems: Array<{
  id: AdminSectionId;
  label: string;
  to: string;
  icon: LucideIcon;
}> = [
  { id: 'overview', label: 'Tổng quan', to: '/admin', icon: LayoutDashboard },
  { id: 'users', label: 'Người dùng', to: '/admin/users', icon: Users },
  { id: 'courts', label: 'Sân', to: '/admin/courts', icon: LandPlot },
  { id: 'clubs', label: 'CLB', to: '/admin/clubs', icon: UsersRound },
  { id: 'bookings', label: 'Booking', to: '/admin/bookings', icon: CalendarCheck },
  { id: 'reports', label: 'Báo cáo', to: '/admin/reports', icon: Flag },
  { id: 'posts', label: 'Bài viết', to: '/admin/posts', icon: FileText },
  { id: 'reviews', label: 'Đánh giá', to: '/admin/reviews', icon: Star },
  { id: 'tournaments', label: 'Giải đấu', to: '/admin/tournaments', icon: Trophy },
  { id: 'transactions', label: 'Giao dịch', to: '/admin/transactions', icon: CreditCard },
  { id: 'settings', label: 'Cấu hình', to: '/admin/settings', icon: Settings },
];

const toneClasses: Record<Tone, string> = {
  success: 'bg-primary-container/40 text-primary',
  warning: 'bg-tertiary-container/50 text-tertiary',
  danger: 'bg-error-container text-error',
  info: 'bg-secondary-container text-secondary',
  neutral: 'bg-surface-container text-secondary',
};

const queueToneClasses: Record<Tone, string> = {
  success: 'border-primary/30 bg-primary-container/20 text-primary',
  warning: 'border-tertiary/30 bg-tertiary-container/30 text-tertiary',
  danger: 'border-error/30 bg-error-container/70 text-error',
  info: 'border-secondary/30 bg-secondary-container/40 text-secondary',
  neutral: 'border-outline-variant bg-surface text-secondary',
};

const sectionConfigs: Record<Exclude<AdminSectionId, 'settings'>, AdminConfig> = {
  overview: {
    id: 'overview',
    eyebrow: 'Bảng điều khiển',
    title: 'Tổng quan quản trị',
    description: 'Theo dõi vận hành Picklink theo thời gian thực, ưu tiên các việc cần duyệt và các cảnh báo rủi ro.',
    primaryAction: 'Xuất báo cáo',
    searchPlaceholder: 'Tìm luồng xử lý, người phụ trách...',
    filters: ['Tất cả', 'Ưu tiên cao', 'Đang xử lý', 'Ổn định'],
    stats: [
      { label: 'Người dùng', value: '12.480', helper: '+248 trong tháng', icon: Users },
      { label: 'Sân đang hoạt động', value: '428', helper: '34 sân chờ duyệt', icon: LandPlot },
      { label: 'Booking hôm nay', value: '1.286', helper: '96,4% thanh toán thành công', icon: CalendarCheck },
      { label: 'Báo cáo mở', value: '37', helper: '8 vụ ưu tiên cao', icon: AlertTriangle },
    ],
    columns: ['Luồng xử lý', 'Ưu tiên', 'Phụ trách', 'SLA'],
    rows: [
      {
        id: 'ops-01',
        cells: ['Duyệt sân mới khu vực Hà Nội', 'Ưu tiên cao', 'Nhóm vận hành', '2 giờ'],
        status: 'Đang xử lý',
        statusTone: 'warning',
        filters: ['Ưu tiên cao', 'Đang xử lý'],
        actions: ['Mở hàng chờ', 'Phân công'],
      },
      {
        id: 'ops-02',
        cells: ['Đối soát hoàn tiền cuối ngày', 'Trung bình', 'Tài chính', '18:00'],
        status: 'Ổn định',
        statusTone: 'success',
        filters: ['Ổn định'],
        actions: ['Xem chi tiết'],
      },
      {
        id: 'ops-03',
        cells: ['Báo cáo bài viết cộng đồng', 'Ưu tiên cao', 'Kiểm duyệt', '30 phút'],
        status: 'Đang xử lý',
        statusTone: 'warning',
        filters: ['Ưu tiên cao', 'Đang xử lý'],
        actions: ['Kiểm duyệt', 'Gắn cờ'],
      },
      {
        id: 'ops-04',
        cells: ['Tình trạng thanh toán online', 'Thấp', 'Kỹ thuật', 'Theo dõi'],
        status: 'Ổn định',
        statusTone: 'success',
        filters: ['Ổn định'],
        actions: ['Xem log'],
      },
    ],
    queueTitle: 'Việc cần chú ý',
    queues: [
      { label: 'Sân chờ duyệt', value: '34', tone: 'warning' },
      { label: 'Báo cáo quá hạn', value: '8', tone: 'danger' },
      { label: 'Hoàn tiền cần xác nhận', value: '12', tone: 'info' },
    ],
  },
  users: {
    id: 'users',
    eyebrow: 'Tài khoản',
    title: 'Quản lý người dùng',
    description: 'Quản lý tài khoản người chơi, chủ sân, quản trị viên, trạng thái khóa/mở và xác minh thông tin.',
    primaryAction: 'Thêm quản trị viên',
    searchPlaceholder: 'Tìm tên, email, số điện thoại...',
    filters: ['Tất cả', 'Người chơi', 'Chủ sân', 'Admin', 'Đã khóa'],
    stats: [
      { label: 'Tổng tài khoản', value: '12.480', helper: '9.840 người chơi', icon: Users },
      { label: 'Chờ xác minh', value: '126', helper: 'Cần kiểm tra CCCD/SĐT', icon: BadgeCheck },
      { label: 'Đã khóa', value: '42', helper: '12 tài khoản trong 7 ngày', icon: Lock },
      { label: 'Hoạt động hôm nay', value: '3.816', helper: '+18% so với hôm qua', icon: UserCheck },
    ],
    columns: ['Người dùng', 'Email', 'Vai trò', 'Số điện thoại', 'Ngày tạo'],
    rows: [
      {
        id: 'user-01',
        cells: ['Nguyễn Văn An', 'an.nguyen@gmail.com', 'Người chơi', '0901 234 567', '12/05/2026'],
        status: 'Hoạt động',
        statusTone: 'success',
        filters: ['Người chơi'],
        actions: ['Xem', 'Khóa'],
      },
      {
        id: 'user-02',
        cells: ['Trần Thị Bình', 'binh.tran@yahoo.com', 'Chủ sân', '0912 233 445', '15/05/2026'],
        status: 'Chờ xác minh',
        statusTone: 'warning',
        filters: ['Chủ sân'],
        actions: ['Duyệt', 'Yêu cầu bổ sung'],
      },
      {
        id: 'user-03',
        cells: ['Lê Hoàng Cường', 'cuong.le@outlook.com', 'Người chơi', '0988 776 655', '20/05/2026'],
        status: 'Đã khóa',
        statusTone: 'danger',
        filters: ['Người chơi', 'Đã khóa'],
        actions: ['Mở khóa', 'Xem lịch sử'],
      },
      {
        id: 'user-04',
        cells: ['Hoàng Bảo Anh', 'anh.hoang@picklink.vn', 'Admin', '0944 556 677', '01/01/2026'],
        status: 'Hoạt động',
        statusTone: 'success',
        filters: ['Admin'],
        actions: ['Phân quyền', 'Nhật ký'],
      },
    ],
    queueTitle: 'Hàng chờ tài khoản',
    queues: [
      { label: 'Hồ sơ chủ sân cần duyệt', value: '18', tone: 'warning' },
      { label: 'Tài khoản bị báo cáo', value: '11', tone: 'danger' },
      { label: 'Yêu cầu đổi số điện thoại', value: '24', tone: 'info' },
    ],
  },
  courts: {
    id: 'courts',
    eyebrow: 'Sân pickleball',
    title: 'Duyệt sân, khóa/mở sân',
    description: 'Kiểm tra hồ sơ sân, ảnh, địa chỉ, tiện ích và trạng thái hoạt động của từng cụm sân trên hệ thống.',
    primaryAction: 'Duyệt hàng loạt',
    searchPlaceholder: 'Tìm tên sân, chủ sân, địa chỉ...',
    filters: ['Tất cả', 'Chờ duyệt', 'Hoạt động', 'Đã khóa', 'Cần kiểm tra'],
    stats: [
      { label: 'Cụm sân', value: '428', helper: '1.936 sân con', icon: LandPlot },
      { label: 'Chờ duyệt', value: '34', helper: '12 hồ sơ thiếu ảnh', icon: ClipboardCheck },
      { label: 'Đã khóa', value: '16', helper: 'Do vi phạm chính sách', icon: Lock },
      { label: 'Khiếu nại mở', value: '9', helper: 'Cần phản hồi chủ sân', icon: AlertTriangle },
    ],
    columns: ['Cụm sân', 'Chủ sân', 'Địa chỉ', 'Số sân', 'Cập nhật'],
    rows: [
      {
        id: 'court-01',
        cells: ['Pickleball Diamond Q7', 'Nguyễn Hoàng Nam', 'Quận 7, TP. Hồ Chí Minh', '8 sân', '18/06/2026'],
        status: 'Hoạt động',
        statusTone: 'success',
        filters: ['Hoạt động'],
        actions: ['Xem', 'Khóa'],
      },
      {
        id: 'court-02',
        cells: ['Sân Pickleball Thảo Điền', 'Trần Văn Tú', 'TP. Thủ Đức, TP. Hồ Chí Minh', '4 sân', '17/06/2026'],
        status: 'Chờ duyệt',
        statusTone: 'warning',
        filters: ['Chờ duyệt'],
        actions: ['Duyệt', 'Từ chối'],
      },
      {
        id: 'court-03',
        cells: ['Hồ Tây Pickleball Club', 'Phạm Thanh Tùng', 'Tây Hồ, Hà Nội', '12 sân', '16/06/2026'],
        status: 'Cần kiểm tra',
        statusTone: 'info',
        filters: ['Cần kiểm tra'],
        actions: ['Kiểm tra', 'Nhắn chủ sân'],
      },
      {
        id: 'court-04',
        cells: ['Sân Cầu Giấy Gold', 'Lê Minh Quân', 'Cầu Giấy, Hà Nội', '6 sân', '14/06/2026'],
        status: 'Đã khóa',
        statusTone: 'danger',
        filters: ['Đã khóa'],
        actions: ['Mở khóa', 'Xem lý do'],
      },
    ],
    queueTitle: 'Kiểm duyệt sân',
    queues: [
      { label: 'Chờ duyệt hồ sơ', value: '34', tone: 'warning' },
      { label: 'Cần xác minh địa chỉ', value: '7', tone: 'info' },
      { label: 'Vi phạm ảnh/giá', value: '5', tone: 'danger' },
    ],
  },
  clubs: {
    id: 'clubs',
    eyebrow: 'Câu lạc bộ',
    title: 'Duyệt CLB, xử lý CLB vi phạm',
    description: 'Theo dõi CLB mới, cảnh báo nội dung vi phạm, thành viên bị báo cáo và trạng thái hoạt động của CLB.',
    primaryAction: 'Tạo thông báo',
    searchPlaceholder: 'Tìm tên CLB, chủ nhiệm, khu vực...',
    filters: ['Tất cả', 'Chờ duyệt', 'Hoạt động', 'Bị cảnh báo', 'Đã khóa'],
    stats: [
      { label: 'Tổng CLB', value: '246', helper: '18 CLB mới trong tháng', icon: UsersRound },
      { label: 'Chờ duyệt', value: '19', helper: 'Ưu tiên CLB có đủ hồ sơ', icon: ClipboardCheck },
      { label: 'Bị cảnh báo', value: '8', helper: 'Nội dung hoặc thành viên', icon: AlertTriangle },
      { label: 'Sự kiện tháng này', value: '73', helper: '12 sự kiện đang mở', icon: CalendarCheck },
    ],
    columns: ['CLB', 'Chủ nhiệm', 'Khu vực', 'Thành viên', 'Báo cáo'],
    rows: [
      {
        id: 'club-01',
        cells: ['Saigon Pickle Crew', 'Minh Khang', 'TP. Hồ Chí Minh', '218', '0'],
        status: 'Hoạt động',
        statusTone: 'success',
        filters: ['Hoạt động'],
        actions: ['Xem', 'Gửi nhắc nhở'],
      },
      {
        id: 'club-02',
        cells: ['Hồ Tây Smashers', 'Ngọc Anh', 'Hà Nội', '84', '2'],
        status: 'Bị cảnh báo',
        statusTone: 'danger',
        filters: ['Bị cảnh báo'],
        actions: ['Xử lý', 'Khóa CLB'],
      },
      {
        id: 'club-03',
        cells: ['Đà Nẵng Rally Hub', 'Quốc Huy', 'Đà Nẵng', '42', '0'],
        status: 'Chờ duyệt',
        statusTone: 'warning',
        filters: ['Chờ duyệt'],
        actions: ['Duyệt', 'Từ chối'],
      },
      {
        id: 'club-04',
        cells: ['Cầu Giấy Weekend Club', 'Hoài Nam', 'Hà Nội', '136', '1'],
        status: 'Hoạt động',
        statusTone: 'success',
        filters: ['Hoạt động'],
        actions: ['Xem bài viết', 'Nhật ký'],
      },
    ],
    queueTitle: 'Cần xử lý CLB',
    queues: [
      { label: 'CLB chờ duyệt', value: '19', tone: 'warning' },
      { label: 'CLB có báo cáo mở', value: '8', tone: 'danger' },
      { label: 'Sự kiện cần xác minh', value: '6', tone: 'info' },
    ],
  },
  bookings: {
    id: 'bookings',
    eyebrow: 'Booking toàn hệ thống',
    title: 'Theo dõi booking toàn hệ thống',
    description: 'Giám sát đơn đặt sân, thanh toán, check-in, hủy lịch và các booking có tranh chấp giữa người chơi với chủ sân.',
    primaryAction: 'Tải danh sách',
    searchPlaceholder: 'Tìm mã booking, người đặt, sân...',
    filters: ['Tất cả', 'Đã thanh toán', 'Chờ thanh toán', 'Đã hủy', 'Tranh chấp'],
    stats: [
      { label: 'Booking hôm nay', value: '1.286', helper: '876 đã check-in', icon: CalendarCheck },
      { label: 'Doanh thu giữ chỗ', value: '486,2tr', helper: 'Tăng 14% so với hôm qua', icon: Banknote },
      { label: 'Chờ thanh toán', value: '74', helper: 'Tự hủy sau 15 phút', icon: CreditCard },
      { label: 'Tranh chấp', value: '6', helper: 'Cần admin can thiệp', icon: AlertTriangle },
    ],
    columns: ['Mã đơn', 'Người đặt', 'Sân', 'Thời gian', 'Thanh toán'],
    rows: [
      {
        id: 'booking-01',
        cells: ['BK-260618-0142', 'Nguyễn Văn An', 'Diamond Q7 - Sân 03', '18/06/2026 19:00', '520.000đ'],
        status: 'Đã thanh toán',
        statusTone: 'success',
        filters: ['Đã thanh toán'],
        actions: ['Xem', 'Hỗ trợ'],
      },
      {
        id: 'booking-02',
        cells: ['BK-260618-0157', 'Trần Mỹ Linh', 'Hồ Tây Club - Sân 08', '18/06/2026 20:30', '680.000đ'],
        status: 'Chờ thanh toán',
        statusTone: 'warning',
        filters: ['Chờ thanh toán'],
        actions: ['Nhắc thanh toán', 'Hủy giữ chỗ'],
      },
      {
        id: 'booking-03',
        cells: ['BK-260617-0288', 'Phạm Quốc Huy', 'Thảo Điền - Sân 02', '17/06/2026 17:30', '420.000đ'],
        status: 'Tranh chấp',
        statusTone: 'danger',
        filters: ['Tranh chấp'],
        actions: ['Mở vụ việc', 'Hoàn tiền'],
      },
      {
        id: 'booking-04',
        cells: ['BK-260616-0094', 'Đỗ Hải Nam', 'Cầu Giấy Gold - Sân 01', '16/06/2026 06:00', '300.000đ'],
        status: 'Đã hủy',
        statusTone: 'neutral',
        filters: ['Đã hủy'],
        actions: ['Xem lý do'],
      },
    ],
    queueTitle: 'Hàng chờ booking',
    queues: [
      { label: 'Chờ thanh toán', value: '74', tone: 'warning' },
      { label: 'Yêu cầu hoàn tiền', value: '18', tone: 'info' },
      { label: 'Tranh chấp quá hạn', value: '3', tone: 'danger' },
    ],
  },
  reports: {
    id: 'reports',
    eyebrow: 'An toàn cộng đồng',
    title: 'Xử lý báo cáo người chơi, bài viết, sân, CLB',
    description: 'Tập trung các báo cáo vi phạm để admin phân loại, ưu tiên xử lý, phản hồi người gửi và ghi lại kết quả.',
    primaryAction: 'Phân công báo cáo',
    searchPlaceholder: 'Tìm mã báo cáo, đối tượng, người gửi...',
    filters: ['Tất cả', 'Người chơi', 'Bài viết', 'Sân', 'CLB', 'Ưu tiên cao'],
    stats: [
      { label: 'Báo cáo mở', value: '37', helper: '8 ưu tiên cao', icon: Flag },
      { label: 'Đã xử lý hôm nay', value: '21', helper: 'SLA trung bình 42 phút', icon: CheckCircle2 },
      { label: 'Quá hạn', value: '5', helper: 'Cần trưởng nhóm duyệt', icon: AlertTriangle },
      { label: 'Tái phạm', value: '12', helper: 'Tài khoản/CLB có lịch sử', icon: RefreshCcw },
    ],
    columns: ['Mã báo cáo', 'Loại', 'Đối tượng', 'Người gửi', 'Mức độ'],
    rows: [
      {
        id: 'report-01',
        cells: ['RP-260618-009', 'Người chơi', 'Lê Hoàng Cường', 'Thanh Minh', 'Ưu tiên cao'],
        status: 'Đang xử lý',
        statusTone: 'warning',
        filters: ['Người chơi', 'Ưu tiên cao'],
        actions: ['Mở hồ sơ', 'Khóa tạm'],
      },
      {
        id: 'report-02',
        cells: ['RP-260618-014', 'Bài viết', 'Bài viết #POST-2248', 'Ngọc Anh', 'Trung bình'],
        status: 'Chờ duyệt',
        statusTone: 'warning',
        filters: ['Bài viết'],
        actions: ['Ẩn bài', 'Bỏ qua'],
      },
      {
        id: 'report-03',
        cells: ['RP-260617-033', 'Sân', 'Sân Thảo Điền', 'Quốc Huy', 'Ưu tiên cao'],
        status: 'Quá hạn',
        statusTone: 'danger',
        filters: ['Sân', 'Ưu tiên cao'],
        actions: ['Liên hệ chủ sân', 'Hoàn tiền'],
      },
      {
        id: 'report-04',
        cells: ['RP-260617-040', 'CLB', 'Hồ Tây Smashers', 'Minh Đức', 'Thấp'],
        status: 'Đã phản hồi',
        statusTone: 'success',
        filters: ['CLB'],
        actions: ['Xem kết quả'],
      },
    ],
    queueTitle: 'Ưu tiên kiểm duyệt',
    queues: [
      { label: 'Ưu tiên cao', value: '8', tone: 'danger' },
      { label: 'Chờ phản hồi người gửi', value: '14', tone: 'info' },
      { label: 'Cần khóa tạm', value: '4', tone: 'warning' },
    ],
  },
  posts: {
    id: 'posts',
    eyebrow: 'Cộng đồng',
    title: 'Kiểm duyệt bài viết cộng đồng',
    description: 'Duyệt bài đăng mới, xử lý nội dung bị báo cáo, quản lý trạng thái hiển thị và nhãn nội dung cộng đồng.',
    primaryAction: 'Ẩn bài hàng loạt',
    searchPlaceholder: 'Tìm tiêu đề, tác giả, hashtag...',
    filters: ['Tất cả', 'Chờ duyệt', 'Đang hiển thị', 'Bị báo cáo', 'Đã ẩn'],
    stats: [
      { label: 'Bài mới hôm nay', value: '186', helper: '72 bài có ảnh/video', icon: FileText },
      { label: 'Chờ duyệt', value: '24', helper: 'Tự ưu tiên bài bị báo cáo', icon: ClipboardCheck },
      { label: 'Bị báo cáo', value: '17', helper: '5 bài có nhiều báo cáo', icon: Flag },
      { label: 'Đã ẩn', value: '9', helper: 'Trong 24 giờ gần nhất', icon: XCircle },
    ],
    columns: ['Bài viết', 'Tác giả', 'Chủ đề', 'Tương tác', 'Báo cáo'],
    rows: [
      {
        id: 'post-01',
        cells: ['Kinh nghiệm chọn vợt cho người mới', 'Minh Khang', 'Kỹ thuật', '428 lượt', '0'],
        status: 'Đang hiển thị',
        statusTone: 'success',
        filters: ['Đang hiển thị'],
        actions: ['Xem', 'Ghim'],
      },
      {
        id: 'post-02',
        cells: ['Tìm người giao lưu tối nay ở Quận 7', 'Lan Anh', 'Tìm trận', '96 lượt', '1'],
        status: 'Chờ duyệt',
        statusTone: 'warning',
        filters: ['Chờ duyệt'],
        actions: ['Duyệt', 'Sửa nhãn'],
      },
      {
        id: 'post-03',
        cells: ['Review sân mới tại Thủ Đức', 'Hoàng Nam', 'Đánh giá sân', '312 lượt', '6'],
        status: 'Bị báo cáo',
        statusTone: 'danger',
        filters: ['Bị báo cáo'],
        actions: ['Ẩn bài', 'Nhắc nhở'],
      },
      {
        id: 'post-04',
        cells: ['Lịch tập footwork tuần này', 'Pickle Coach', 'Tập luyện', '154 lượt', '0'],
        status: 'Đang hiển thị',
        statusTone: 'success',
        filters: ['Đang hiển thị'],
        actions: ['Xem', 'Đưa vào nổi bật'],
      },
    ],
    queueTitle: 'Bài cần kiểm tra',
    queues: [
      { label: 'Chờ duyệt', value: '24', tone: 'warning' },
      { label: 'Bị báo cáo nhiều lần', value: '5', tone: 'danger' },
      { label: 'Cần gắn nhãn', value: '13', tone: 'info' },
    ],
  },
  reviews: {
    id: 'reviews',
    eyebrow: 'Đánh giá',
    title: 'Kiểm duyệt đánh giá',
    description: 'Xem đánh giá sân và người chơi, xử lý đánh giá bị báo cáo, nội dung không phù hợp hoặc nghi ngờ spam.',
    primaryAction: 'Xuất đánh giá',
    searchPlaceholder: 'Tìm người đánh giá, sân, nội dung...',
    filters: ['Tất cả', 'Chờ duyệt', 'Đã hiển thị', 'Bị báo cáo', 'Spam'],
    stats: [
      { label: 'Đánh giá mới', value: '92', helper: 'Điểm trung bình 4,6/5', icon: Star },
      { label: 'Chờ duyệt', value: '15', helper: 'Có từ khóa nhạy cảm', icon: ClipboardCheck },
      { label: 'Bị báo cáo', value: '11', helper: 'Chủ sân/người chơi khiếu nại', icon: Flag },
      { label: 'Ẩn trong tuần', value: '7', helper: 'Do spam hoặc công kích', icon: XCircle },
    ],
    columns: ['Đối tượng', 'Người đánh giá', 'Điểm', 'Nội dung', 'Báo cáo'],
    rows: [
      {
        id: 'review-01',
        cells: ['Diamond Q7', 'Nguyễn Văn An', '5 sao', 'Sân sạch, ánh sáng tốt', '0'],
        status: 'Đã hiển thị',
        statusTone: 'success',
        filters: ['Đã hiển thị'],
        actions: ['Xem', 'Đánh dấu nổi bật'],
      },
      {
        id: 'review-02',
        cells: ['Lê Hoàng Cường', 'Thanh Minh', '2 sao', 'Thường xuyên bỏ trận', '2'],
        status: 'Bị báo cáo',
        statusTone: 'danger',
        filters: ['Bị báo cáo'],
        actions: ['Ẩn', 'Yêu cầu bằng chứng'],
      },
      {
        id: 'review-03',
        cells: ['Hồ Tây Club', 'Hoài Nam', '4 sao', 'Giá hơi cao cuối tuần', '0'],
        status: 'Chờ duyệt',
        statusTone: 'warning',
        filters: ['Chờ duyệt'],
        actions: ['Duyệt', 'Sửa lỗi chính tả'],
      },
      {
        id: 'review-04',
        cells: ['Thảo Điền Court', 'Tài khoản mới', '1 sao', 'Nội dung lặp lại nhiều lần', '4'],
        status: 'Spam',
        statusTone: 'danger',
        filters: ['Spam'],
        actions: ['Xóa', 'Khóa tài khoản'],
      },
    ],
    queueTitle: 'Cảnh báo đánh giá',
    queues: [
      { label: 'Nghi ngờ spam', value: '6', tone: 'danger' },
      { label: 'Cần bằng chứng', value: '9', tone: 'warning' },
      { label: 'Chờ phản hồi', value: '11', tone: 'info' },
    ],
  },
  tournaments: {
    id: 'tournaments',
    eyebrow: 'Giải đấu',
    title: 'Quản lý giải đấu',
    description: 'Duyệt giải đấu mới, theo dõi đăng ký, bảng đấu, trạng thái thanh toán lệ phí và công bố kết quả.',
    primaryAction: 'Tạo giải đấu',
    searchPlaceholder: 'Tìm giải, đơn vị tổ chức, địa điểm...',
    filters: ['Tất cả', 'Chờ duyệt', 'Đang mở đăng ký', 'Đang thi đấu', 'Đã kết thúc'],
    stats: [
      { label: 'Giải đang mở', value: '18', helper: '4 giải cấp thành phố', icon: Trophy },
      { label: 'Chờ duyệt', value: '7', helper: 'Cần xác minh điều lệ', icon: ClipboardCheck },
      { label: 'VĐV đăng ký', value: '1.248', helper: '82% đã thanh toán', icon: Users },
      { label: 'Trận trong tuần', value: '156', helper: '24 trận livestream', icon: CalendarCheck },
    ],
    columns: ['Giải đấu', 'Đơn vị tổ chức', 'Địa điểm', 'Đăng ký', 'Thời gian'],
    rows: [
      {
        id: 'tournament-01',
        cells: ['Summer Pickleball Open 2026', 'Picklink', 'TP. Hồ Chí Minh', '128/160', '20-22/06/2026'],
        status: 'Đang mở đăng ký',
        statusTone: 'success',
        filters: ['Đang mở đăng ký'],
        actions: ['Xem', 'Cấu hình bảng đấu'],
      },
      {
        id: 'tournament-02',
        cells: ['Hà Nội Amateur Cup', 'Hồ Tây Club', 'Hà Nội', '64/64', '18-19/06/2026'],
        status: 'Đang thi đấu',
        statusTone: 'info',
        filters: ['Đang thi đấu'],
        actions: ['Nhập kết quả', 'Lịch thi đấu'],
      },
      {
        id: 'tournament-03',
        cells: ['Đà Nẵng Coastal Challenge', 'DN Rally Hub', 'Đà Nẵng', '36/96', '10-12/07/2026'],
        status: 'Chờ duyệt',
        statusTone: 'warning',
        filters: ['Chờ duyệt'],
        actions: ['Duyệt', 'Yêu cầu bổ sung'],
      },
      {
        id: 'tournament-04',
        cells: ['Beginner Friendly Series', 'Pickle Coach', 'Online + sân đối tác', '90/90', '05/06/2026'],
        status: 'Đã kết thúc',
        statusTone: 'neutral',
        filters: ['Đã kết thúc'],
        actions: ['Công bố kết quả', 'Đối soát'],
      },
    ],
    queueTitle: 'Điều phối giải đấu',
    queues: [
      { label: 'Chờ duyệt điều lệ', value: '7', tone: 'warning' },
      { label: 'Cần nhập kết quả', value: '18', tone: 'info' },
      { label: 'Khiếu nại kết quả', value: '2', tone: 'danger' },
    ],
  },
  transactions: {
    id: 'transactions',
    eyebrow: 'Tài chính',
    title: 'Giao dịch, hoàn tiền, đối soát',
    description: 'Theo dõi thanh toán booking, lệ phí giải đấu, yêu cầu hoàn tiền, phí nền tảng và đối soát với chủ sân.',
    primaryAction: 'Đối soát hôm nay',
    searchPlaceholder: 'Tìm mã giao dịch, người trả, booking...',
    filters: ['Tất cả', 'Thành công', 'Chờ đối soát', 'Hoàn tiền', 'Thất bại'],
    stats: [
      { label: 'Doanh thu hôm nay', value: '486,2tr', helper: '1.182 giao dịch thành công', icon: Banknote },
      { label: 'Chờ đối soát', value: '94', helper: 'Tổng 128,6tr', icon: ClipboardCheck },
      { label: 'Yêu cầu hoàn tiền', value: '18', helper: '6 yêu cầu quá 24 giờ', icon: RefreshCcw },
      { label: 'Thất bại', value: '27', helper: 'Đa số do hết hạn OTP', icon: XCircle },
    ],
    columns: ['Mã giao dịch', 'Nguồn tiền', 'Liên kết', 'Số tiền', 'Cổng thanh toán'],
    rows: [
      {
        id: 'transaction-01',
        cells: ['TXN-260618-8841', 'Nguyễn Văn An', 'BK-260618-0142', '520.000đ', 'VNPay'],
        status: 'Thành công',
        statusTone: 'success',
        filters: ['Thành công'],
        actions: ['Biên nhận', 'Đối soát'],
      },
      {
        id: 'transaction-02',
        cells: ['TXN-260618-8898', 'Trần Mỹ Linh', 'BK-260618-0157', '680.000đ', 'Momo'],
        status: 'Chờ đối soát',
        statusTone: 'warning',
        filters: ['Chờ đối soát'],
        actions: ['Xác nhận', 'Gắn ghi chú'],
      },
      {
        id: 'transaction-03',
        cells: ['TXN-260617-7712', 'Phạm Quốc Huy', 'BK-260617-0288', '420.000đ', 'Thẻ nội địa'],
        status: 'Hoàn tiền',
        statusTone: 'info',
        filters: ['Hoàn tiền'],
        actions: ['Duyệt hoàn', 'Từ chối'],
      },
      {
        id: 'transaction-04',
        cells: ['TXN-260617-7621', 'Đỗ Hải Nam', 'TOUR-2607-002', '350.000đ', 'VNPay'],
        status: 'Thất bại',
        statusTone: 'danger',
        filters: ['Thất bại'],
        actions: ['Xem lỗi', 'Gửi lại link'],
      },
    ],
    queueTitle: 'Tài chính cần duyệt',
    queues: [
      { label: 'Chờ đối soát', value: '94', tone: 'warning' },
      { label: 'Hoàn tiền quá hạn', value: '6', tone: 'danger' },
      { label: 'Sai lệch phí nền tảng', value: '3', tone: 'info' },
    ],
  },
};

const settingsGroups: SettingGroup[] = [
  {
    title: 'Đặt sân và thanh toán',
    description: 'Thiết lập thời gian giữ chỗ, phí nền tảng và chính sách hoàn tiền tự động.',
    items: [
      {
        label: 'Thời gian giữ chỗ chưa thanh toán',
        helper: 'Áp dụng cho booking online trước khi tự hủy.',
        value: '15 phút',
        enabled: true,
      },
      {
        label: 'Cho phép hoàn tiền tự động',
        helper: 'Admin vẫn có thể duyệt thủ công các trường hợp đặc biệt.',
        value: 'Bật',
        enabled: true,
      },
      {
        label: 'Phí nền tảng mặc định',
        helper: 'Tính trên tổng giá trị booking thành công.',
        value: '5%',
      },
    ],
  },
  {
    title: 'Kiểm duyệt cộng đồng',
    description: 'Cấu hình hàng chờ bài viết, đánh giá, báo cáo và mức độ nhạy cảm của bộ lọc nội dung.',
    items: [
      {
        label: 'Duyệt bài viết có nhiều báo cáo',
        helper: 'Tự đưa bài viết vào hàng chờ khi có từ 3 báo cáo trở lên.',
        value: 'Bật',
        enabled: true,
      },
      {
        label: 'Ẩn tạm đánh giá nghi ngờ spam',
        helper: 'Giảm hiển thị đánh giá lặp nội dung hoặc từ tài khoản mới.',
        value: 'Bật',
        enabled: true,
      },
      {
        label: 'SLA xử lý báo cáo ưu tiên cao',
        helper: 'Dùng để cảnh báo trong dashboard admin.',
        value: '30 phút',
      },
    ],
  },
  {
    title: 'Bảo mật và phân quyền',
    description: 'Quản lý đăng nhập admin, nhật ký thao tác và cảnh báo truy cập bất thường.',
    items: [
      {
        label: 'Bắt buộc OTP khi đăng nhập admin',
        helper: 'Áp dụng cho toàn bộ tài khoản có quyền quản trị.',
        value: 'Bật',
        enabled: true,
      },
      {
        label: 'Lưu nhật ký thao tác nhạy cảm',
        helper: 'Bao gồm khóa tài khoản, duyệt hoàn tiền, xóa bài viết.',
        value: '180 ngày',
      },
      {
        label: 'Cảnh báo đăng nhập khác tỉnh',
        helper: 'Gửi thông báo cho trưởng nhóm vận hành.',
        value: 'Bật',
        enabled: true,
      },
    ],
  },
];

const AdminShell = ({
  activeId,
  children,
}: {
  activeId: AdminSectionId;
  children: ReactNode;
}) => {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between px-4 shadow-md md:px-8" style={{ backgroundColor: '#84C33E' }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-[24px] font-bold text-white">
            Picklink
          </Link>
          <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[12px] font-bold text-primary shadow-sm">
            Quản trị viên
          </span>
        </div>
        <div className="flex items-center gap-4 text-white">
          <button className="relative rounded-full p-2 transition-colors hover:bg-black/10" title="Thông báo">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#84C33E] bg-error" />
          </button>
          <div className="hidden border-l border-white/30 pl-4 text-right md:block">
            <p className="text-[14px] font-bold">Admin Cao Cấp</p>
            <p className="text-[11px] leading-none opacity-80">admin@picklink.vn</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-[14px] font-bold">
            AD
          </div>
        </div>
      </header>

      <aside className="custom-scrollbar fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col overflow-y-auto border-r border-outline-variant bg-surface p-4 lg:flex">
        <div className="mb-4 px-3 py-2">
          <p className="text-[18px] font-bold text-primary">Hệ thống Picklink</p>
          <p className="text-[12px] text-secondary">Trung tâm quản trị</p>
        </div>
        <nav className="flex flex-col gap-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.id === 'overview'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-bold transition-all ${
                    isActive || activeId === item.id
                      ? 'translate-x-1 bg-primary-container text-on-primary-container'
                      : 'text-secondary hover:bg-secondary-container/30'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="pt-16 lg:ml-64">
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-8">{children}</div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dce2f3;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

const MobileAdminNav = ({ activeId }: { activeId: AdminSectionId }) => (
  <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
    {adminNavItems.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.id}
          to={item.to}
          end={item.id === 'overview'}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-bold ${
              isActive || activeId === item.id
                ? 'border-primary bg-primary-container text-on-primary-container'
                : 'border-outline-variant bg-surface text-secondary'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      );
    })}
  </div>
);

const StatusBadge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold ${toneClasses[tone]}`}>
    {children}
  </span>
);

const AdminDataPage = ({ sectionId }: { sectionId: Exclude<AdminSectionId, 'settings'> }) => {
  const config = sectionConfigs[sectionId];
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const visibleRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return config.rows.filter((row) => {
      const rowText = [...row.cells, row.status, ...row.actions, row.note ?? ''].join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || rowText.includes(normalizedSearch);
      const matchesFilter =
        activeFilter === 'Tất cả' || row.filters.includes(activeFilter) || row.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, config.rows, searchTerm]);

  return (
    <AdminShell activeId={config.id}>
      <MobileAdminNav activeId={config.id} />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-primary">{config.eyebrow}</p>
          <h1 className="text-[30px] font-bold leading-tight text-on-background md:text-[36px]">{config.title}</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-6 text-secondary">{config.description}</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90">
          <Plus className="h-5 w-5" />
          {config.primaryAction}
        </button>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {config.stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="rounded-lg bg-primary-container/25 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-surface px-2 py-1 text-[11px] font-bold text-secondary">Live</span>
              </div>
              <p className="text-[13px] font-bold text-secondary">{stat.label}</p>
              <h2 className="mt-1 text-[28px] font-bold text-on-background">{stat.value}</h2>
              <p className="mt-1 text-[12px] text-secondary">{stat.helper}</p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-4 md:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-md">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={config.searchPlaceholder}
                  className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-[14px] outline-none transition-colors focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {config.filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-lg border px-3 py-2 text-[13px] font-bold transition-colors ${
                      activeFilter === filter
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant bg-surface text-secondary hover:border-primary hover:text-primary'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="border-b border-outline-variant bg-surface text-[12px] uppercase tracking-wider text-secondary">
                <tr>
                  {config.columns.map((column) => (
                    <th key={column} className="px-5 py-4 font-bold">
                      {column}
                    </th>
                  ))}
                  <th className="px-5 py-4 font-bold">Trạng thái</th>
                  <th className="px-5 py-4 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-surface-container-low">
                    {row.cells.map((cell, index) => (
                      <td key={`${row.id}-${cell}`} className="px-5 py-4 text-[14px]">
                        <span className={index === 0 ? 'font-bold text-on-background' : 'text-secondary'}>
                          {cell}
                        </span>
                      </td>
                    ))}
                    <td className="px-5 py-4">
                      <StatusBadge tone={row.statusTone}>{row.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {row.actions.map((action, index) => (
                          <button
                            key={action}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors ${
                              index === 0
                                ? 'bg-primary text-on-primary hover:opacity-90'
                                : 'border border-outline-variant bg-surface text-secondary hover:border-primary hover:text-primary'
                            }`}
                          >
                            {index === 0 ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                            {action}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface p-4 text-[13px] text-secondary md:flex-row md:items-center md:justify-between">
            <span>
              Hiển thị <strong className="text-on-background">{visibleRows.length}</strong> mục trong module{' '}
              <strong className="text-on-background">{config.title}</strong>
            </span>
            <div className="flex gap-2">
              <button className="rounded-md border border-outline-variant px-3 py-1.5 font-bold opacity-50">Trước</button>
              <button className="rounded-md bg-primary px-3 py-1.5 font-bold text-on-primary">1</button>
              <button className="rounded-md border border-outline-variant px-3 py-1.5 font-bold hover:bg-surface-container">2</button>
              <button className="rounded-md border border-outline-variant px-3 py-1.5 font-bold hover:bg-surface-container">Sau</button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-secondary">{config.queueTitle}</p>
                <h2 className="text-[20px] font-bold text-on-background">Hàng chờ</h2>
              </div>
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {config.queues.map((item) => (
                <div key={item.label} className={`rounded-lg border p-4 ${queueToneClasses[item.tone]}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-bold">{item.label}</span>
                    <span className="text-[22px] font-bold">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <h2 className="mb-4 text-[18px] font-bold text-on-background">Thao tác nhanh</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-[12px] font-bold text-secondary hover:border-primary hover:text-primary">
                <CheckCircle2 className="h-5 w-5" />
                Duyệt
              </button>
              <button className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-[12px] font-bold text-secondary hover:border-error hover:text-error">
                <XCircle className="h-5 w-5" />
                Từ chối
              </button>
              <button className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-[12px] font-bold text-secondary hover:border-primary hover:text-primary">
                <Unlock className="h-5 w-5" />
                Mở khóa
              </button>
              <button className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-[12px] font-bold text-secondary hover:border-error hover:text-error">
                <Lock className="h-5 w-5" />
                Khóa
              </button>
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
};

const AdminSettingsPage = () => {
  return (
    <AdminShell activeId="settings">
      <MobileAdminNav activeId="settings" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Thiết lập hệ thống</p>
          <h1 className="text-[30px] font-bold leading-tight text-on-background md:text-[36px]">Cấu hình hệ thống</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-6 text-secondary">
            Quản lý các tham số vận hành chung cho booking, thanh toán, kiểm duyệt, bảo mật và thông báo hệ thống.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90">
          <CheckCircle2 className="h-5 w-5" />
          Lưu cấu hình
        </button>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Quy tắc đang bật', value: '42', helper: '5 nhóm cấu hình', icon: Settings },
          { label: 'Cấu hình thanh toán', value: 'Ổn định', helper: 'Đối soát mỗi ngày', icon: CreditCard },
          { label: 'Kiểm duyệt tự động', value: '86%', helper: 'Độ chính xác tuần này', icon: ShieldCheck },
          { label: 'Cảnh báo bảo mật', value: '3', helper: 'Cần xem lại trong ngày', icon: AlertTriangle },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <span className="mb-4 inline-flex rounded-lg bg-primary-container/25 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-[13px] font-bold text-secondary">{stat.label}</p>
              <h2 className="mt-1 text-[28px] font-bold text-on-background">{stat.value}</h2>
              <p className="mt-1 text-[12px] text-secondary">{stat.helper}</p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          {settingsGroups.map((group) => (
            <div key={group.title} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-5 border-b border-outline-variant pb-4">
                <h2 className="text-[20px] font-bold text-on-background">{group.title}</h2>
                <p className="mt-1 text-[14px] leading-6 text-secondary">{group.description}</p>
              </div>
              <div className="divide-y divide-outline-variant">
                {group.items.map((item) => (
                  <div key={item.label} className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                    <div>
                      <p className="text-[15px] font-bold text-on-background">{item.label}</p>
                      <p className="mt-1 text-[13px] leading-5 text-secondary">{item.helper}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface px-3 py-2">
                      <span className="text-[14px] font-bold text-on-background">{item.value}</span>
                      {typeof item.enabled === 'boolean' ? (
                        <button
                          className={`relative h-6 w-11 rounded-full transition-colors ${
                            item.enabled ? 'bg-primary' : 'bg-outline-variant'
                          }`}
                          title={item.enabled ? 'Đang bật' : 'Đang tắt'}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                              item.enabled ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      ) : (
                        <button className="rounded-md border border-outline-variant px-2 py-1 text-[12px] font-bold text-secondary hover:border-primary hover:text-primary">
                          Sửa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <h2 className="mb-4 text-[18px] font-bold text-on-background">Nhật ký thay đổi</h2>
            <div className="space-y-4">
              {[
                ['18/06/2026 09:20', 'Bật OTP cho tài khoản admin'],
                ['17/06/2026 18:05', 'Cập nhật SLA báo cáo ưu tiên cao'],
                ['16/06/2026 14:12', 'Điều chỉnh phí nền tảng mặc định'],
              ].map(([time, action]) => (
                <div key={time} className="border-l-2 border-primary pl-3">
                  <p className="text-[13px] font-bold text-on-background">{action}</p>
                  <p className="mt-1 text-[12px] text-secondary">{time}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-error/30 bg-error-container/80 p-5 text-error shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-[18px] font-bold">Cấu hình nhạy cảm</h2>
            </div>
            <p className="text-[13px] leading-5">
              Các thay đổi về thanh toán, hoàn tiền và bảo mật admin nên được ghi nhận vào nhật ký vận hành trước khi áp dụng.
            </p>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
};

export const AdminOverview = () => <AdminDataPage sectionId="overview" />;
export const AdminUsers = () => <AdminDataPage sectionId="users" />;
export const AdminCourts = () => <AdminDataPage sectionId="courts" />;
export const AdminClubs = () => <AdminDataPage sectionId="clubs" />;
export const AdminBookings = () => <AdminDataPage sectionId="bookings" />;
export const AdminReports = () => <AdminDataPage sectionId="reports" />;
export const AdminPosts = () => <AdminDataPage sectionId="posts" />;
export const AdminReviews = () => <AdminDataPage sectionId="reviews" />;
export const AdminTournaments = () => <AdminDataPage sectionId="tournaments" />;
export const AdminTransactions = () => <AdminDataPage sectionId="transactions" />;
export const AdminSettings = () => <AdminSettingsPage />;
