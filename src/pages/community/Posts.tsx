import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Users, 
  Bookmark, 
  Settings, 
  Image as ImageIcon,
  MapPin,
  UserPlus,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal
} from 'lucide-react';

export const Posts = () => {
  return (
    <div className="flex bg-[#f9f9ff] min-h-screen font-body-md text-[#151c27] max-w-[1200px] mx-auto pt-[72px]">
      
      {/* Left Sidebar */}
      <aside className="w-[280px] shrink-0 p-4 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto hidden md:block">
        <div className="flex items-center gap-3 mb-8 p-2">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Court Leader" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-primary">Court Leader</h3>
            <p className="text-[#555f6f] text-[13px] font-medium">Skill Level: 4.5</p>
          </div>
        </div>

        <nav className="space-y-2">
          <Link to="/posts" className="flex items-center gap-3 px-4 py-3 bg-[#84c33e] text-white rounded-xl font-bold transition-all shadow-sm">
            <Home className="w-5 h-5" />
            Bảng tin
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-[#555f6f] hover:bg-[#e7eefe] rounded-xl font-medium transition-all">
            <TrendingUp className="w-5 h-5" />
            Xu hướng
          </Link>
          <Link to="/clubs" className="flex items-center gap-3 px-4 py-3 text-[#555f6f] hover:bg-[#e7eefe] rounded-xl font-medium transition-all">
            <Users className="w-5 h-5" />
            Câu lạc bộ
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-[#555f6f] hover:bg-[#e7eefe] rounded-xl font-medium transition-all">
            <Bookmark className="w-5 h-5" />
            Bài viết đã lưu
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-[#555f6f] hover:bg-[#e7eefe] rounded-xl font-medium transition-all">
            <Settings className="w-5 h-5" />
            Cài đặt
          </Link>
        </nav>
      </aside>

      {/* Main Content Flow */}
      <main className="flex-1 max-w-[600px] p-4">
        {/* Create Post Box */}
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm mb-6">
          <div className="flex gap-3 mb-4">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" className="w-10 h-10 rounded-full shrink-0" />
            <input 
              type="text" 
              placeholder="Bạn đang nghĩ gì về trận đấu hôm nay?" 
              className="w-full bg-[#f0f3ff] rounded-xl px-4 py-2 text-[14px] text-[#151c27] focus:outline-none focus:ring-1 focus:ring-primary-container"
            />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
            <div className="flex gap-2">
              <button className="p-2 text-[#555f6f] hover:bg-[#f0f3ff] rounded-full transition-colors"><ImageIcon className="w-5 h-5" /></button>
              <button className="p-2 text-[#555f6f] hover:bg-[#f0f3ff] rounded-full transition-colors"><MapPin className="w-5 h-5" /></button>
              <button className="p-2 text-[#555f6f] hover:bg-[#f0f3ff] rounded-full transition-colors"><UserPlus className="w-5 h-5" /></button>
            </div>
            <button className="bg-primary text-white font-bold px-6 py-2 rounded-full hover:bg-primary/90 transition-colors text-[14px]">
              Đăng Bài
            </button>
          </div>
        </div>

        {/* Post 1 */}
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026703d" alt="Trần Văn Nam" className="w-10 h-10 rounded-full" />
              <div>
                <h4 className="font-bold text-[15px]">Trần Văn Nam</h4>
                <div className="flex items-center gap-2 text-[12px] text-[#555f6f]">
                  <span className="bg-[#e7eefe] text-[#3d6a00] font-bold px-1.5 py-0.5 rounded-sm">Level 3.5</span>
                  <span>•</span>
                  <span>2 giờ trước</span>
                </div>
              </div>
            </div>
            <button className="text-[#555f6f] hover:bg-[#f0f3ff] p-1.5 rounded-full"><MoreHorizontal className="w-5 h-5" /></button>
          </div>
          <p className="text-[15px] mb-4">
            Tìm đồng đội chơi tối nay ở sân Cầu Giấy. Mình đang cần 2 slot đánh đôi, trình độ từ 3.0 - 4.0. Ai rảnh inbox nhé! 🏓🔥
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
            <button className="flex-1 flex items-center justify-center gap-2 text-[#555f6f] hover:bg-[#f0f3ff] py-2 rounded-lg transition-colors font-medium text-[14px]">
              <ThumbsUp className="w-5 h-5" /> Thích
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 text-[#555f6f] hover:bg-[#f0f3ff] py-2 rounded-lg transition-colors font-medium text-[14px]">
              <MessageCircle className="w-5 h-5" /> Bình luận
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 text-[#555f6f] hover:bg-[#f0f3ff] py-2 rounded-lg transition-colors font-medium text-[14px]">
              <Share2 className="w-5 h-5" /> Chia sẻ
            </button>
          </div>
        </div>

        {/* Post 2 */}
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026702d" alt="Lê Thu Hà" className="w-10 h-10 rounded-full" />
              <div>
                <h4 className="font-bold text-[15px]">Lê Thu Hà</h4>
                <div className="flex items-center gap-2 text-[12px] text-[#555f6f]">
                  <span className="bg-[#b3f66a] text-[#0f2000] font-bold px-1.5 py-0.5 rounded-sm">Level 4.0</span>
                  <span>•</span>
                  <span>6 giờ trước</span>
                </div>
              </div>
            </div>
            <button className="text-[#555f6f] hover:bg-[#f0f3ff] p-1.5 rounded-full"><MoreHorizontal className="w-5 h-5" /></button>
          </div>
          <p className="text-[15px] mb-3">
            Khoe vợt mới mua! Sẵn sàng cho giải đấu cuối tuần này. Cảm ơn The Pickleball Shop đã tư vấn rất nhiệt tình. 💚
          </p>
          <img src="https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1470&auto=format&fit=crop" alt="Pickleball Paddle" className="w-full h-[300px] object-cover rounded-xl mb-3" />
          
          <div className="flex items-center justify-between text-[13px] text-[#555f6f] mb-3 px-2">
            <span className="flex items-center gap-1 font-medium"><ThumbsUp className="w-4 h-4 text-primary" /> 42</span>
            <span>12 bình luận • 3 chia sẻ</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
            <button className="flex-1 flex items-center justify-center gap-2 text-primary bg-[#e7eefe] py-2 rounded-lg transition-colors font-bold text-[14px]">
              <ThumbsUp className="w-5 h-5" fill="currentColor" /> Thích
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 text-[#555f6f] hover:bg-[#f0f3ff] py-2 rounded-lg transition-colors font-medium text-[14px]">
              <MessageCircle className="w-5 h-5" /> Bình luận
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 text-[#555f6f] hover:bg-[#f0f3ff] py-2 rounded-lg transition-colors font-medium text-[14px]">
              <Share2 className="w-5 h-5" /> Chia sẻ
            </button>
          </div>
        </div>

      </main>

      {/* Right Sidebar */}
      <aside className="w-[300px] shrink-0 p-4 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto hidden lg:block">
        
        {/* Trending Topics */}
        <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm mb-4">
          <h3 className="font-bold text-[16px] mb-4">Chủ Đề Nổi Bật</h3>
          <div className="space-y-4">
            <div className="cursor-pointer group">
              <p className="text-[12px] text-[#555f6f] mb-0.5">Giải đấu Hà Nội Mở Rộng</p>
              <h4 className="font-bold text-[14px] group-hover:text-primary transition-colors">Đăng ký tham gia ngay</h4>
              <p className="text-[12px] text-[#555f6f]">1.2k bài viết</p>
            </div>
            <div className="cursor-pointer group">
              <p className="text-[12px] text-[#555f6f] mb-0.5">Thiết bị & Dụng cụ</p>
              <h4 className="font-bold text-[14px] group-hover:text-primary transition-colors">Review vợt Joola Ben Johns</h4>
              <p className="text-[12px] text-[#555f6f]">850 bài viết</p>
            </div>
            <div className="cursor-pointer group">
              <p className="text-[12px] text-[#555f6f] mb-0.5">Hướng dẫn kỹ thuật</p>
              <h4 className="font-bold text-[14px] group-hover:text-primary transition-colors">Cách giao bóng xoáy</h4>
              <p className="text-[12px] text-[#555f6f]">640 bài viết</p>
            </div>
          </div>
        </div>

        {/* Active Players */}
        <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm">
          <h3 className="font-bold text-[16px] mb-4">Người Chơi Tích Cực</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 items-center">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026705d" alt="Hoàng Minh" className="w-10 h-10 rounded-full" />
                <div>
                  <h4 className="font-bold text-[14px]">Hoàng Minh</h4>
                  <p className="text-[12px] text-[#555f6f]">Level 5.0</p>
                </div>
              </div>
              <button className="bg-[#e7eefe] text-primary text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-primary-container transition-colors">
                Kết bạn
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-3 items-center">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026706d" alt="Mai Phương" className="w-10 h-10 rounded-full" />
                <div>
                  <h4 className="font-bold text-[14px]">Mai Phương</h4>
                  <p className="text-[12px] text-[#555f6f]">Level 4.0</p>
                </div>
              </div>
              <button className="bg-[#e7eefe] text-primary text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-primary-container transition-colors">
                Kết bạn
              </button>
            </div>
          </div>
        </div>

      </aside>

    </div>
  );
};
