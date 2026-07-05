import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Globe2,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { createGroup } from '../../api/community';
import './club-pages.css';

export const CreateClub = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [descriptionCount, setDescriptionCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || submitting) return;

    const formData = new FormData(event.currentTarget);
    const groupName = (formData.get('club-name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || undefined;
    const groupType = (formData.get('group-type') as string) || 'Public';
    const citySelect = formData.get('city') as string;
    const districtInput = (formData.get('district') as string)?.trim();
    const cityMap: Record<string, string> = {
      hn: 'Hà Nội',
      hcm: 'Hồ Chí Minh',
      dn: 'Đà Nẵng',
    };
    const cityLabel = cityMap[citySelect] || citySelect;
    const activeLocation = [districtInput, cityLabel].filter(Boolean).join(', ') || undefined;

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
        activeLocation,
      });
      navigate(`/clubs/${group.groupId}/dashboard`);
    } catch (reason: any) {
      setError(reason?.message ?? 'Không thể tạo câu lạc bộ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 18 };

  return (
    <div className="min-h-dvh bg-[#f8fbf4] pt-[72px] text-[#0b2228]" data-club-ui>
      <section className="relative overflow-hidden bg-[#081d24] px-4 py-8 text-white sm:px-6 lg:px-8" data-no-reveal>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(152,217,81,0.22),transparent_34%),radial-gradient(circle_at_88%_16%,rgba(226,255,87,0.12),transparent_24%),linear-gradient(135deg,#081d24,#143f34)]" />
        <div className="relative mx-auto max-w-[1060px]">
          <button
            className="picklink-glow-control inline-flex h-9 items-center gap-2 rounded-lg border border-white/18 bg-white/8 px-3 text-[12px] font-bold text-white/86 hover:bg-white/14"
            onClick={() => navigate('/clubs')}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Danh sách câu lạc bộ
          </button>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-[12px] font-bold text-[#dff6b2]">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
                Khởi tạo cộng đồng mới
              </p>
              <h1 className="mt-2 max-w-[15ch] text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[0.98] tracking-[-0.04em]">
                Tạo câu lạc bộ theo cách bạn muốn chơi.
              </h1>
              <p className="mt-3 max-w-[58ch] text-[14px] leading-6 text-white/68">
                Thiết lập thông tin cơ bản trước, sau đó mời thành viên và tổ chức hoạt động trong dashboard.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/12 bg-white/12">
              {[
                { value: '01', label: 'Thông tin' },
                { value: '02', label: 'Thành viên' },
                { value: '03', label: 'Hoạt động' },
              ].map((step) => (
                <div className="bg-[#0d2a2f]/90 px-3 py-3" key={step.value}>
                  <p className="font-mono text-[16px] font-bold text-[#e2ff57]">{step.value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/58">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1060px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="picklink-glow-surface grid overflow-hidden rounded-2xl border border-[#d8e4d4] bg-white shadow-[0_18px_46px_rgba(8,29,36,0.08)] lg:grid-cols-[300px_minmax(0,1fr)]"
          initial={revealInitial}
          onSubmit={handleSubmit}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.36, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <aside className="border-b border-[#d8e4d4] bg-[#edf5e9] p-5 lg:border-b-0 lg:border-r lg:p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0b2228] text-[#e2ff57]">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-[20px] font-bold tracking-[-0.025em]">Nền tảng cho một CLB hoạt động bền vững</h2>
            <p className="mt-2 text-[13px] leading-5 text-[#64736a]">
              Thông tin này xuất hiện trên trang công khai và giúp người chơi tìm đúng cộng đồng.
            </p>
            <div className="mt-5 space-y-3 border-t border-[#cbdac6] pt-4">
              {[
                { icon: Users, text: 'Quản lý thành viên và phân quyền' },
                { icon: ShieldCheck, text: 'Chọn chế độ công khai hoặc riêng tư' },
                { icon: MapPin, text: 'Kết nối người chơi theo khu vực' },
              ].map((item) => (
                <div className="flex items-center gap-2.5 text-[12px] font-bold text-[#53645b]" key={item.text}>
                  <item.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#477313]" />
                  {item.text}
                </div>
              ))}
            </div>
          </aside>

          <div className="p-5 sm:p-6">
            <div className="border-b border-[#e0e9dc] pb-4">
              <p className="text-[12px] font-bold text-[#477313]">Thông tin cơ bản</p>
              <h2 className="mt-1 text-[22px] font-bold tracking-[-0.025em]">Hồ sơ câu lạc bộ</h2>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-[#e7c8c4] bg-[#fff1ef] px-3.5 py-3 text-[12px] font-bold text-[#a33535]" role="alert">
                {error}
              </div>
            )}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 md:col-span-2" htmlFor="club-name">
                <span className="text-[12px] font-bold text-[#53645b]">Tên câu lạc bộ <span className="text-[#ba1a1a]">*</span></span>
                <input className="h-10 w-full rounded-xl border px-3 text-[14px]" id="club-name" name="club-name" placeholder="Ví dụ: Sài Gòn Pickleball Club" required type="text" />
              </label>

              <label className="grid gap-1.5" htmlFor="group-type">
                <span className="text-[12px] font-bold text-[#53645b]">Loại nhóm <span className="text-[#ba1a1a]">*</span></span>
                <span className="relative">
                  <Globe2 aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#477313]" />
                  <select className="h-10 w-full appearance-none rounded-xl border pl-9 pr-8 text-[13px] font-semibold" defaultValue="Public" id="group-type" name="group-type">
                    <option value="Public">Công khai</option>
                    <option value="Private">Riêng tư</option>
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718077]" />
                </span>
              </label>

              <label className="grid gap-1.5" htmlFor="city">
                <span className="text-[12px] font-bold text-[#53645b]">Tỉnh / Thành phố <span className="text-[#ba1a1a]">*</span></span>
                <span className="relative">
                  <MapPin aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#477313]" />
                  <select className="h-10 w-full appearance-none rounded-xl border pl-9 pr-8 text-[13px] font-semibold" defaultValue="" id="city" name="city" required>
                    <option disabled value="">Chọn khu vực</option>
                    <option value="hn">Hà Nội</option>
                    <option value="hcm">Hồ Chí Minh</option>
                    <option value="dn">Đà Nẵng</option>
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718077]" />
                </span>
              </label>

              <label className="grid gap-1.5 md:col-span-2" htmlFor="district">
                <span className="text-[12px] font-bold text-[#53645b]">Địa bàn hoạt động <span className="text-[#ba1a1a]">*</span></span>
                <input className="h-10 w-full rounded-xl border px-3 text-[14px]" id="district" name="district" placeholder="Ví dụ: Quận Cầu Giấy, Sân Nghĩa Tân" required type="text" />
              </label>

              <label className="grid gap-1.5 md:col-span-2" htmlFor="description">
                <span className="flex items-center justify-between gap-3 text-[12px] font-bold text-[#53645b]">
                  Giới thiệu CLB
                  <span className="font-mono text-[10px] text-[#849187]">{descriptionCount}/500</span>
                </span>
                <textarea
                  className="min-h-28 w-full resize-y rounded-xl border px-3 py-2.5 text-[14px] leading-6"
                  id="description"
                  maxLength={500}
                  name="description"
                  onChange={(event) => setDescriptionCount(event.target.value.length)}
                  placeholder="Mô tả quy mô, văn hóa hoặc định hướng của câu lạc bộ"
                  rows={4}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#e0e9dc] pt-4 sm:flex-row sm:justify-end">
              <button className="picklink-glow-control inline-flex h-10 items-center justify-center rounded-xl border border-[#cbdac6] bg-white px-4 text-[13px] font-bold text-[#53645b] hover:bg-[#edf5e9]" disabled={submitting} onClick={() => navigate('/clubs')} type="button">
                Hủy
              </button>
              <button className="picklink-glow-control inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#e2ff57] px-5 text-[13px] font-bold text-[#102414] shadow-[0_10px_24px_rgba(152,217,81,0.2)] hover:bg-[#d6f64d] disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">
                {submitting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
                {submitting ? 'Đang tạo...' : 'Tạo câu lạc bộ'}
              </button>
            </div>
          </div>
        </motion.form>
      </main>
    </div>
  );
};
