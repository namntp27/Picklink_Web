import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { createGroup } from '../../api/community';

export const CreateClub = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [descriptionCount, setDescriptionCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || submitting) return;

    const formData = new FormData(e.currentTarget);
    const groupName = (formData.get('club-name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || undefined;
    const groupType = (formData.get('group-type') as string) || 'Public';

    if (!groupName) {
      setError('Vui lòng nhập tên câu lạc bộ.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const group = await createGroup(token, {
        groupName,
        description,
        groupType,
      });
      navigate(`/clubs/${group.groupId}/dashboard`);
    } catch (err: any) {
      setError(err?.message ?? 'Không thể tạo câu lạc bộ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f0f3ff] text-[#151c27] flex flex-col font-body-md w-full flex-1">
      {/* Main Content Area */}
      <main className="flex-grow flex flex-col relative w-full">
        {/* Hero Background Header */}
        <div 
          className="absolute inset-x-0 top-0 h-64 bg-cover bg-center z-0" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLvvQdGuxp_93C7nGLo2YBzPLjS4ECESxlpu01ddVvQEOH3MhLQEv6JXebYssu8Wxs5TdVc4vloNSB6tNLib5do5KVtUct6n2ZkAuj_H-xt_8ColnsEwHqkECdGcf92D5v6SQmi_2Np4QLAMDbX3l36McqFag5ubSehc5ABe1AxqQ73kd-VIvBiKNdKGbwyHjHQUXZmSr8mSjB8No9l0dzJwtd7GBVwLLhZ6OElKE34XqQqg23FMga5Pk7hJ')" }}
        >
          <div className="absolute inset-0 bg-[#2a313d]/60 backdrop-blur-sm"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
          {/* Page Header */}
          <div className="text-center mb-10 text-white">
            <h1 className="text-[40px] mb-4 font-bold drop-shadow-md leading-tight">Tạo Câu Lạc Bộ Mới</h1>
            <p className="text-[18px] text-white/90 max-w-2xl mx-auto drop-shadow font-medium">Xây dựng cộng đồng pickleball của bạn. Điền thông tin chi tiết bên dưới để bắt đầu kết nối với những người chơi khác.</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-lg border border-[#c2c9b3] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#84c33e]"></div>
            
            <form action="#" className="space-y-8" method="POST" onSubmit={handleSubmit}>
              {/* Error message */}
              {error && (
                <div className="rounded-lg border border-[#ba1a1a]/20 bg-[#ba1a1a]/5 p-4">
                  <p className="text-[14px] font-medium text-[#ba1a1a]">{error}</p>
                </div>
              )}

              {/* Section: General Info */}
              <div className="space-y-4">
                <h2 className="text-[24px] text-[#3d6a00] font-bold border-b border-[#dce2f3] pb-2">Thông Tin Cơ Bản</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Club Name */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[14px] font-bold text-[#151c27] mb-2" htmlFor="club-name">Tên Câu Lạc Bộ <span className="text-[#ba1a1a]">*</span></label>
                    <input 
                      className="w-full bg-[#f9f9ff] border border-[#c2c9b3] rounded-md px-4 py-3 text-[16px] text-[#151c27] focus:outline-none focus:ring-2 focus:ring-[#84c33e] focus:border-[#84c33e] transition-shadow" 
                      id="club-name" 
                      name="club-name" 
                      placeholder="VD: Sài Gòn Pickleball Club" 
                      required 
                      type="text"
                    />
                  </div>
                  
                  {/* Group Type */}
                  <div>
                    <label className="block text-[14px] font-bold text-[#151c27] mb-2" htmlFor="group-type">Loại nhóm <span className="text-[#ba1a1a]">*</span></label>
                    <div className="relative">
                      <select 
                        className="w-full bg-[#f9f9ff] border border-[#c2c9b3] rounded-md px-4 py-3 text-[16px] text-[#151c27] appearance-none focus:outline-none focus:ring-2 focus:ring-[#84c33e] focus:border-[#84c33e] transition-shadow" 
                        id="group-type" 
                        name="group-type"
                        defaultValue="Public"
                      >
                        <option value="Public">Công khai</option>
                        <option value="Private">Riêng tư</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 text-[#555f6f] pointer-events-none w-5 h-5" />
                    </div>
                  </div>

                  {/* Location Select */}
                  <div>
                    <label className="block text-[14px] font-bold text-[#151c27] mb-2" htmlFor="city">Khu vực</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-[#f9f9ff] border border-[#c2c9b3] rounded-md px-4 py-3 text-[16px] text-[#151c27] appearance-none focus:outline-none focus:ring-2 focus:ring-[#84c33e] focus:border-[#84c33e] transition-shadow" 
                        id="city" 
                        name="city" 
                        defaultValue=""
                      >
                        <option disabled value="">Chọn Tỉnh/Thành phố</option>
                        <option value="hcm">Hồ Chí Minh</option>
                        <option value="hn">Hà Nội</option>
                        <option value="dn">Đà Nẵng</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 text-[#555f6f] pointer-events-none w-5 h-5" />
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-[14px] font-bold text-[#151c27] mb-2" htmlFor="description">Giới thiệu CLB</label>
                  <textarea 
                    className="w-full bg-[#f9f9ff] border border-[#c2c9b3] rounded-md px-4 py-3 text-[16px] text-[#151c27] focus:outline-none focus:ring-2 focus:ring-[#84c33e] focus:border-[#84c33e] transition-shadow resize-y" 
                    id="description" 
                    name="description" 
                    placeholder="Viết vài dòng giới thiệu về quy mô, văn hóa hoặc định hướng của câu lạc bộ..." 
                    rows={4}
                    onChange={(e) => setDescriptionCount(e.target.value.length)}
                    maxLength={500}
                  ></textarea>
                  <p className="text-[12px] font-medium text-[#555f6f] mt-2 text-right">{descriptionCount} / 500 ký tự</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-6 border-t border-[#dce2f3] flex items-center justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => navigate('/clubs')}
                  className="px-6 py-3 text-[14px] font-bold text-[#151c27] bg-white border border-[#c2c9b3] rounded-md hover:bg-[#f0f3ff] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#c2c9b3]"
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 text-[14px] font-bold text-white bg-[#84c33e] rounded-md hover:bg-[#3d6a00] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#84c33e] focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <PlusCircle className="w-5 h-5" />
                  )}
                  {submitting ? 'Đang tạo...' : 'Tạo Câu Lạc Bộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
