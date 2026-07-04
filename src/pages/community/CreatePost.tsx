import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Globe2,
  Hash,
  Image as ImageIcon,
  Lock,
  MapPin,
  MessageCircle,
  PlusCircle,
  Send,
  ThumbsUp,
  UserRound,
  Users,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getMyProfile, type PlayerProfile } from '../../api/profile';
import { getMyMatches, type MatchSummary } from '../../api/matches';
import { OpenStreetMapLocationPicker } from '../owner/components/OpenStreetMapLocationPicker';
import { uploadToCloudinary } from '../../api/cloudinary';
import { currentCommunityUser } from '../../data/communityPosts';
import { CommunityHero, CommunityPage } from './CommunityUI';
import { Dropdown } from '../../components/ui/Dropdown';
import { createGlobalPost, createGroupPost, getGroups, type CommunityGroup } from '../../api/community';

type Visibility = 'public' | 'club' | 'friends';
type PostMode = 'discussion' | 'find_players' | 'review' | 'training';

const modeOptions: Array<{ label: string; value: PostMode }> = [
  { label: 'Thảo luận', value: 'discussion' },
  { label: 'Tìm người chơi', value: 'find_players' },
  { label: 'Review sân / dụng cụ', value: 'review' },
  { label: 'Kỹ thuật tập luyện', value: 'training' },
];

const visibilityOptions: Array<{ label: string; value: Visibility; icon: typeof Globe2 }> = [
  { label: 'Công khai', value: 'public', icon: Globe2 },
  { label: 'Trong CLB', value: 'club', icon: Users },
  { label: 'Bạn bè', value: 'friends', icon: Lock },
];

const FieldLabel = ({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
}) => (
  <span className="mb-1.5 flex items-center gap-2 text-[12px] font-extrabold text-[#526158]">
    {Icon && <Icon aria-hidden="true" className="h-4 w-4 text-[#477313]" />}
    {children}
  </span>
);

export const CreatePost = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [searchParams] = useSearchParams();

  const initialLocation = '';

  // Refs for focusing inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<PostMode>(
    (searchParams.get('mode') as PostMode) === 'find_players' ? 'find_players' : 'discussion'
  );
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [court, setCourt] = useState('');
  const [location, setLocation] = useState('');
  const [locationObj, setLocationObj] = useState({
    address: '',
    latitude: '',
    longitude: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [tagDraft, setTagDraft] = useState('');
  const [lookingFor, setLookingFor] = useState(
    searchParams.get('mode') === 'find_players' || searchParams.get('attach') === 'people'
  );
  const [slots, setSlots] = useState('');
  const [minSkill, setMinSkill] = useState('');
  const [maxSkill, setMaxSkill] = useState('');
  const [playDate, setPlayDate] = useState('');
  const [playStartTime, setPlayStartTime] = useState('');
  const [playEndTime, setPlayEndTime] = useState('');

  const levelRange = useMemo(() => {
    if (!minSkill && !maxSkill) return '';
    return `${minSkill} - ${maxSkill}`;
  }, [minSkill, maxSkill]);

  const playTime = useMemo(() => {
    if (!playDate) return '';
    
    let dateStr = '';
    try {
      dateStr = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(playDate));
    } catch {
      dateStr = playDate;
    }

    const timeStr = playStartTime && playEndTime 
      ? `${playStartTime} - ${playEndTime}` 
      : (playStartTime || playEndTime || '');
      
    return timeStr ? `${dateStr} từ ${timeStr}` : dateStr;
  }, [playDate, playStartTime, playEndTime]);

  const [published, setPublished] = useState(false);

  const [hostedMatches, setHostedMatches] = useState<MatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const [userGroups, setUserGroups] = useState<CommunityGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [linkMatchRoom, setLinkMatchRoom] = useState(false);

  useEffect(() => {
    if (hostedMatches.length > 0) {
      setLinkMatchRoom(true);
    } else {
      setLinkMatchRoom(false);
    }
  }, [hostedMatches]);

  useEffect(() => {
    if (lookingFor && token) {
      setLoadingMatches(true);
      getMyMatches(token, { page: 1, pageSize: 50 })
        .then((res) => {
          const hosted = res.items.filter((m) => m.isHost && (m.status === 'Recruiting' || m.status === 'ReadyToBook'));
          setHostedMatches(hosted);
        })
        .catch((err) => {
          console.error('Failed to load hosted matches:', err);
        })
        .finally(() => {
          setLoadingMatches(false);
        });
    }
  }, [lookingFor, token]);

  const handleMatchSelect = (matchIdVal: string) => {
    const matchIdNum = Number(matchIdVal);
    setSelectedMatchId(matchIdNum);
    const found = hostedMatches.find((m) => m.matchId === matchIdNum);
    if (found) {
      const needed = found.requiredPlayerCount - found.acceptedPlayerCount;
      setSlots(String(needed > 0 ? needed : 0));
      setMinSkill(found.minSkillLevel.toFixed(1));
      setMaxSkill(found.maxSkillLevel.toFixed(1));
      
      if (found.availableDateFrom) {
        setPlayDate(found.availableDateFrom.slice(0, 10));
      }
      
      if (found.startTime) {
        setPlayStartTime(found.startTime.slice(11, 16));
      } else if (found.preferredTimeStart) {
        setPlayStartTime(found.preferredTimeStart);
      }
      
      if (found.endTime) {
        setPlayEndTime(found.endTime.slice(11, 16));
      } else if (found.preferredTimeEnd) {
        setPlayEndTime(found.preferredTimeEnd);
      }
    }
  };

  const matchOptions = useMemo(() => hostedMatches.map((m) => ({
    value: String(m.matchId),
    label: `${m.title} (${m.matchType})`,
  })), [hostedMatches]);

  // Focus effect based on search query params
  useEffect(() => {
    const attach = searchParams.get('attach');
    const focus = searchParams.get('focus');
    
    const timer = setTimeout(() => {
      if (attach === 'image' && imageInputRef.current) {
        imageInputRef.current.focus();
        imageInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (focus === 'location' && locationInputRef.current) {
        locationInputRef.current.focus();
        locationInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (token && user?.role === 'player') {
      getMyProfile(token)
        .then((p) => {
          setProfile(p);
        })
        .catch(() => {});
    }
  }, [token, user]);

  useEffect(() => {
    if (token) {
      setLoadingGroups(true);
      getGroups(token, undefined, undefined, undefined, 'Mine')
        .then((groups) => {
          setUserGroups(groups);
          if (groups.length > 0) {
            setSelectedGroupId(groups[0].groupId);
          }
        })
        .catch((err) => console.error('Failed to load user clubs:', err))
        .finally(() => setLoadingGroups(false));
    }
  }, [token]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const { url } = await uploadToCloudinary(token, file, (progress) => {
        setUploadProgress(progress);
      });
      setImageUrl(url);
    } catch (err: any) {
      alert(err.message || 'Không thể tải ảnh lên.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteImage = () => setImageUrl('');

  const selectedClub = useMemo(() => userGroups.find((g) => g.groupId === selectedGroupId), [userGroups, selectedGroupId]);
  const name = user?.name || '';
  const avatarUrl = user?.avatar || profile?.profileImageUrl;
  let level = '';
  if (user) {
    if (user.role === 'player') {
      level = profile?.skillLevel != null ? profile.skillLevel.toFixed(1) : 'Chưa cập nhật';
    } else if (user.role === 'owner') {
      level = 'Chủ sân';
    } else if (user.role === 'admin') {
      level = 'Admin';
    } else if (user.role === 'staff') {
      level = 'Nhân viên';
    }
  }

  const tags = useMemo(
    () => tagDraft
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5),
    [tagDraft],
  );
  const selectedVisibility = visibilityOptions.find((option) => option.value === visibility) ?? visibilityOptions[0];
  const VisibilityIcon = selectedVisibility.icon;
  const canPublish =
    title.trim().length > 0 &&
    content.trim().length >= 10 &&
    (visibility !== 'club' || selectedGroupId !== null);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPublish || !token) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        body: content.trim(),
        location: location.trim(),
        mode,
        lookingFor,
        slots,
        levelRange,
        playTime,
        matchId: selectedMatchId,
        tags
      };

      const serializedContent = JSON.stringify(payload);
      const mediaUrls = imageUrl ? [imageUrl] : [];

      if (visibility === 'club' && selectedGroupId) {
        await createGroupPost(token, selectedGroupId, {
          content: serializedContent,
          mediaUrls
        });
        // Redirect to the club page
        navigate(`/clubs/${selectedGroupId}`);
      } else {
        await createGlobalPost(token, {
          content: serializedContent,
          mediaUrls
        });
        // Redirect back to news feed
        navigate('/posts');
      }
    } catch (err: any) {
      alert(err.message || 'Không thể tạo bài viết.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CommunityPage>
      <CommunityHero
        actions={(
          <>
            <Link className="community-button-secondary" to="/posts">
              <X aria-hidden="true" className="h-4 w-4" />
              Hủy
            </Link>
            <button className="community-button" disabled={!canPublish || submitting} form="create-community-post" type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
              Đăng bài
            </button>
          </>
        )}
        backLink={{ label: 'Quay lại bảng tin', to: '/posts' }}
        description="Chia sẻ trận đấu, tìm người chơi, review sân hoặc đăng kinh nghiệm tập luyện."
        icon={MessageCircle}
        label="Cộng đồng Picklink"
        title="Tạo bài viết"
      />

      <form
        className="community-container grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        id="create-community-post"
        onSubmit={handleSubmit}
      >
        <main className="min-w-0 space-y-5">
          {published && (
            <section className="rounded-xl border border-[#b9d4ae] bg-[#eaf6e5] p-4 text-[#365c16]">
              <div className="flex items-start gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-[13px] font-extrabold">Bài viết đã sẵn sàng trong bản nháp giao diện.</p>
                  <Link className="mt-1 inline-flex text-[12px] font-bold underline" to="/posts">Về bảng tin</Link>
                </div>
              </div>
            </section>
          )}

          <section className="community-panel p-4 sm:p-5">
            <div className="flex items-center gap-3 border-b border-[#e0e9dc] pb-4">
              {avatarUrl ? (
                <img alt={name} className="community-avatar community-avatar--lg" src={avatarUrl} />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#e0e9dc] text-[#477313]">
                  <UserRound className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-extrabold text-[#0b2228]">{name}</h2>
                <p className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-[#718077]">
                  <VisibilityIcon aria-hidden="true" className="h-3.5 w-3.5" />
                  {selectedVisibility.label} · {user?.role === 'player' ? `Trình độ ${level}` : level}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <FieldLabel>Chủ đề bài viết</FieldLabel>
                <Dropdown<PostMode>
                  options={modeOptions}
                  value={mode}
                  onChange={setMode}
                  triggerClassName="w-full justify-between !h-11 text-[13px] font-semibold text-[#0b2228] border-[#cfe0c8] bg-[#f4f8f2] hover:bg-white"
                  dropdownClassName="w-full"
                  align="left"
                />
              </div>
              <div className="flex flex-col">
                <FieldLabel>Hiển thị</FieldLabel>
                <Dropdown<Visibility>
                  options={visibilityOptions}
                  value={visibility}
                  onChange={setVisibility}
                  triggerClassName="w-full justify-between !h-11 text-[13px] font-semibold text-[#0b2228] border-[#cfe0c8] bg-[#f4f8f2] hover:bg-white"
                  dropdownClassName="w-full"
                  align="left"
                />
              </div>
            </div>

            {visibility === 'club' && (
              <div className="mt-4 flex flex-col">
                <FieldLabel icon={Users}>Chọn Câu lạc bộ</FieldLabel>
                {loadingGroups ? (
                  <div className="flex h-11 items-center gap-2 px-3 border rounded-[10px] border-[#cfe0c8] bg-[#f4f8f2] text-[13px] font-semibold text-[#718077]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#477313]" />
                    Đang tải danh sách câu lạc bộ...
                  </div>
                ) : userGroups.length > 0 ? (
                  <Dropdown<string>
                    options={userGroups.map((g) => ({
                      label: g.groupName,
                      value: String(g.groupId),
                    }))}
                    value={selectedGroupId ? String(selectedGroupId) : ''}
                    onChange={(val) => setSelectedGroupId(Number(val))}
                    triggerClassName="w-full justify-between !h-11 text-[13px] font-semibold text-[#0b2228] border-[#cfe0c8] bg-[#f4f8f2] hover:bg-white"
                    dropdownClassName="w-full"
                    align="left"
                  />
                ) : (
                  <div className="flex h-11 items-center px-3 border rounded-[10px] border-red-200 bg-red-50 text-[13px] font-semibold text-red-700">
                    Bạn chưa tham gia câu lạc bộ nào. Vui lòng tham gia CLB trước khi đăng bài.
                  </div>
                )}
              </div>
            )}

            <label className="mt-4 block">
              <FieldLabel>Tiêu đề</FieldLabel>
              <input
                className="community-control !h-11 text-[14px] font-bold"
                maxLength={90}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Tìm đồng đội đánh đôi tối nay ở Cầu Giấy"
                value={title}
              />
            </label>

            <label className="mt-4 block">
              <FieldLabel>Nội dung</FieldLabel>
              <textarea
                className="community-control min-h-[160px]"
                maxLength={1200}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Chia sẻ nội dung bài viết..."
                value={content}
              />
            </label>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#718077]">
              <span>{content.length}/1200 ký tự</span>
              <span>{title.length}/90 tiêu đề</span>
            </div>
          </section>

          <section className="community-panel p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#0b2228]">Thông tin gắn kèm</h2>
              <p className="mt-1 text-[12px] leading-5 text-[#718077]">Giúp bài viết dễ được tìm thấy và đặt đúng bối cảnh.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel icon={MapPin}>Địa điểm</FieldLabel>
                <div ref={locationInputRef} tabIndex={-1} className="outline-none">
                  <OpenStreetMapLocationPicker
                    value={locationObj}
                    onChange={(nextVal) => {
                      setLocationObj(nextVal);
                      setLocation(nextVal.address);
                    }}
                  />
                </div>
              </div>
              <label>
                <FieldLabel icon={CalendarDays}>Sân / lịch liên quan</FieldLabel>
                <input className="community-control" onChange={(event) => setCourt(event.target.value)} value={court} />
              </label>
              <label>
                <FieldLabel icon={Hash}>Thẻ chủ đề</FieldLabel>
                <input className="community-control" onChange={(event) => setTagDraft(event.target.value)} value={tagDraft} />
              </label>
              
              <div className="sm:col-span-2 mt-2">
                <FieldLabel icon={ImageIcon}>Ảnh bài viết</FieldLabel>
                
                {imageUrl ? (
                  <div className="relative rounded-lg border border-outline-variant overflow-hidden bg-[#f8f9fa] p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={imageUrl} alt="Uploaded" className="h-16 w-24 object-cover rounded-md border border-outline-variant" />
                      <span className="text-[13px] text-on-surface-variant truncate max-w-xs">{imageUrl}</span>
                    </div>
                    <button
                      onClick={handleDeleteImage}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#ba1a1a] font-bold text-[13px] rounded-lg transition-colors"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                      <span>Xóa ảnh</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-lg p-6 hover:bg-surface-container-low hover:border-primary transition-all cursor-pointer relative">
                      <ImageIcon className="h-8 w-8 text-[#555f6f] mb-2" />
                      <span className="text-[13px] font-bold text-[#555f6f]">{uploadingImage ? 'Đang tải ảnh...' : 'Chọn ảnh tải lên'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                    
                    <div className="flex items-center justify-center font-bold text-[13px] text-outline">hoặc</div>

                    <input
                      ref={imageInputRef}
                      className="flex-[1.5] h-12 rounded-lg border border-outline-variant px-4 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder="Dán URL ảnh trực tiếp..."
                      value={imageUrl}
                    />
                  </div>
                )}

                {uploadingImage && uploadProgress !== null && (
                  <div className="mt-2 w-full bg-[#f0f3ff] rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="community-panel p-4 sm:p-5">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="flex items-center gap-2 text-[17px] font-extrabold text-[#0b2228]">
                  <Users aria-hidden="true" className="h-5 w-5 text-[#477313]" />
                  Tìm người chơi
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-[#718077]">Bật khi bài viết cần ghép thêm người tham gia trận.</span>
              </span>
              <span className="relative mt-1 inline-flex shrink-0">
                <input
                  checked={lookingFor}
                  className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-[#d5dfd1] transition-colors checked:bg-[#477313]"
                  onChange={(event) => setLookingFor(event.target.checked)}
                  type="checkbox"
                />
                <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
              </span>
            </label>

            {lookingFor && (
              <div className="mt-4 border-t border-[#e0e9dc] pt-4">
                {loadingMatches ? (
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#718077] py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#477313]" />
                    <span>Đang tải danh sách phòng ghép trận của bạn...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hostedMatches.length > 0 && (
                      <div className="mb-4 flex items-center gap-4">
                        <label className="flex items-center gap-2 text-[13px] font-bold text-[#0b2228] cursor-pointer">
                          <input
                            type="radio"
                            name="matchInputType"
                            checked={linkMatchRoom}
                            onChange={() => {
                              setLinkMatchRoom(true);
                              const first = hostedMatches[0];
                              if (first) {
                                setSelectedMatchId(first.matchId);
                                const needed = first.requiredPlayerCount - first.acceptedPlayerCount;
                                setSlots(String(needed > 0 ? needed : 0));
                                setMinSkill(first.minSkillLevel.toFixed(1));
                                setMaxSkill(first.maxSkillLevel.toFixed(1));
                                
                                if (first.availableDateFrom) {
                                  setPlayDate(first.availableDateFrom.slice(0, 10));
                                }
                                
                                if (first.startTime) {
                                  setPlayStartTime(first.startTime.slice(11, 16));
                                } else if (first.preferredTimeStart) {
                                  setPlayStartTime(first.preferredTimeStart);
                                }
                                
                                if (first.endTime) {
                                  setPlayEndTime(first.endTime.slice(11, 16));
                                } else if (first.preferredTimeEnd) {
                                  setPlayEndTime(first.preferredTimeEnd);
                                }
                              }
                            }}
                            className="h-4 w-4 text-[#477313] focus:ring-[#477313]"
                          />
                          Liên kết phòng ghép
                        </label>
                        <label className="flex items-center gap-2 text-[13px] font-bold text-[#0b2228] cursor-pointer">
                          <input
                            type="radio"
                            name="matchInputType"
                            checked={!linkMatchRoom}
                            onChange={() => {
                              setLinkMatchRoom(false);
                              setSelectedMatchId(null);
                              setSlots('');
                              setMinSkill('');
                              setMaxSkill('');
                              setPlayDate('');
                              setPlayStartTime('');
                              setPlayEndTime('');
                            }}
                            className="h-4 w-4 text-[#477313] focus:ring-[#477313]"
                          />
                          Tự nhập thông tin
                        </label>
                      </div>
                    )}

                    {linkMatchRoom && hostedMatches.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <FieldLabel>Chọn phòng ghép trận đã tạo</FieldLabel>
                          <Dropdown<string>
                            options={matchOptions}
                            value={selectedMatchId ? String(selectedMatchId) : ''}
                            onChange={handleMatchSelect}
                            triggerClassName="w-full justify-between !h-11 text-[13px] font-semibold text-[#0b2228] border-[#cfe0c8] bg-[#f4f8f2] hover:bg-white"
                            dropdownClassName="w-full"
                            align="left"
                          />
                        </div>

                        <div className="grid gap-4 rounded-xl border border-[#d8e4d4] bg-[#f4f8f2] p-3 text-[12px] sm:grid-cols-3">
                          <div>
                            <span className="block font-bold text-[#718077]">Số slot cần tìm</span>
                            <strong className="mt-1 block text-[14px] text-[#0b2228]">{slots} người</strong>
                          </div>
                          <div>
                            <span className="block font-bold text-[#718077]">Trình độ yêu cầu</span>
                            <strong className="mt-1 block text-[14px] text-[#0b2228]">{levelRange}</strong>
                          </div>
                          <div>
                            <span className="block font-bold text-[#718077]">Thời gian chơi</span>
                            <strong className="mt-1 block text-[14px] text-[#0b2228]">{playTime}</strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {hostedMatches.length === 0 && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-2 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-amber-800 leading-5">
                                Bạn chưa có phòng ghép trận nào đang làm chủ.
                              </p>
                              <p className="mt-1 text-[12px] text-amber-700 leading-4">
                                Bạn có thể đi tạo phòng ghép để người dùng khác tham gia trực tiếp trên bảng tin.
                              </p>
                            </div>
                            <Link
                              to="/opponents"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b2228] px-3.5 py-2 text-[12px] font-black text-white hover:bg-[#0b2228]/95 shrink-0"
                            >
                              <PlusCircle className="h-4 w-4" />
                              Tạo phòng
                            </Link>
                          </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <FieldLabel>Số slot cần tìm</FieldLabel>
                            <input
                              type="number"
                              min="1"
                              max="4"
                              className="community-control"
                              onChange={(e) => setSlots(e.target.value)}
                              value={slots}
                              placeholder="Số người (1-4)"
                            />
                          </div>
                          <div>
                            <FieldLabel>Trình độ yêu cầu</FieldLabel>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                min="1.0"
                                max="5.0"
                                step="0.1"
                                className="community-control text-center"
                                onChange={(e) => setMinSkill(e.target.value)}
                                value={minSkill}
                                placeholder="Tối thiểu"
                              />
                              <input
                                type="number"
                                min="1.0"
                                max="5.0"
                                step="0.1"
                                className="community-control text-center"
                                onChange={(e) => setMaxSkill(e.target.value)}
                                value={maxSkill}
                                placeholder="Tối đa"
                              />
                            </div>
                          </div>
                          <div>
                            <FieldLabel>Thời gian chơi</FieldLabel>
                            <div className="grid grid-cols-1 gap-2">
                              <input
                                type="date"
                                className="community-control"
                                onChange={(e) => setPlayDate(e.target.value)}
                                value={playDate}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="time"
                                  className="community-control"
                                  onChange={(e) => setPlayStartTime(e.target.value)}
                                  value={playStartTime}
                                  placeholder="Bắt đầu"
                                />
                                <input
                                  type="time"
                                  className="community-control"
                                  onChange={(e) => setPlayEndTime(e.target.value)}
                                  value={playEndTime}
                                  placeholder="Kết thúc"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        <aside className="grid gap-4 lg:sticky lg:top-20">
          <section className="community-panel p-4">
            <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-[#0b2228]">
              <Eye aria-hidden="true" className="h-[18px] w-[18px] text-[#477313]" />
              Xem trước
            </h2>
            <article className="mt-4 overflow-hidden rounded-xl border border-[#d8e4d4] bg-white">
              <div className="p-3">
                <div className="flex gap-3">
                  {avatarUrl ? (
                    <img alt={name} className="community-avatar" src={avatarUrl} />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                      <UserRound className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold">{name || currentCommunityUser.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-[#718077]">
                      <span className="inline-flex items-center gap-1">
                        <VisibilityIcon aria-hidden="true" className="h-3.5 w-3.5" />
                        {selectedVisibility.label}
                      </span>
                      {visibility === 'club' && selectedClub && (
                        <span className="inline-flex items-center gap-1 text-[#477313]">
                          <Users aria-hidden="true" className="h-3.5 w-3.5" />
                          {selectedClub.groupName}
                        </span>
                      )}
                      {location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" />
                          {location}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <h3 className="mt-3 text-[15px] font-extrabold leading-5 text-[#0b2228]">{title || 'Tiêu đề bài viết'}</h3>
                <p className="mt-2 text-[12px] leading-5 text-[#66756b]">{content || 'Nội dung bài viết sẽ hiển thị tại đây.'}</p>

                {lookingFor && (
                  <div className="mt-3 rounded-xl bg-[#edf5e9] p-3 text-[11px] font-extrabold text-[#477313]">
                    Cần {slots || '0'} slot · Trình {levelRange || '-'} · {playTime || '-'}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => <span className="community-badge !min-h-5 !px-2 !py-1" key={tag}>#{tag}</span>)}
                </div>
              </div>

              {imageUrl ? (
                <img alt="Ảnh xem trước" className="h-40 w-full bg-[#dfeadc] object-cover" src={imageUrl} />
              ) : (
                <div className="grid h-32 place-items-center bg-[#edf5e9] text-[#81907f]">
                  <ImageIcon aria-hidden="true" className="h-7 w-7" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-1 border-t border-[#e0e9dc] p-2">
                <span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><ThumbsUp className="h-3.5 w-3.5" />Thích</span>
                <span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><MessageCircle className="h-3.5 w-3.5" />Bình luận</span>
                <span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><Send className="h-3.5 w-3.5" />Gửi</span>
              </div>
            </article>
          </section>

          <section className="community-panel p-4">
            <h2 className="text-[15px] font-extrabold text-[#0b2228]">Kiểm tra trước khi đăng</h2>
            <div className="mt-3 grid gap-2">
              {[
                { label: 'Có tiêu đề', done: title.trim().length > 0 },
                { label: 'Nội dung đủ dài', done: content.trim().length >= 10 },
                { label: 'Có thẻ chủ đề', done: tags.length > 0 },
              ].map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f0f6ed] p-3" key={item.label}>
                  <span className="text-[12px] font-bold text-[#526158]">{item.label}</span>
                  <CheckCircle2 className={`h-[18px] w-[18px] ${item.done ? 'text-[#477313]' : 'text-[#b8c5b4]'}`} />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </form>
    </CommunityPage>
  );
};
