import { useEffect } from 'react';
import {
  ClipboardCheck,
  FileText,
  History,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AdminConfig, AdminDataSectionId, AdminRow } from '../types';
import { isDangerousAdminAction } from './AdminConfirmDialog';
import { StatusBadge } from './StatusBadge';

type DetailCopy = {
  subject: string;
  description: string;
  checkpoints: string[];
  auditTrail: string[];
};

const detailCopy: Record<AdminDataSectionId, DetailCopy> = {
  overview: {
    subject: 'Viá»‡c váº­n hÃ nh',
    description: 'Theo dÃµi Ä‘áº§u viá»‡c, ngÆ°á»i phá»¥ trÃ¡ch, SLA vÃ  tráº¡ng thÃ¡i xá»­ lÃ½ hiá»‡n táº¡i.',
    checkpoints: ['Kiá»ƒm tra má»©c Æ°u tiÃªn vÃ  SLA', 'Xem nhÃ³m phá»¥ trÃ¡ch', 'Ghi nháº­n quyáº¿t Ä‘á»‹nh xá»­ lÃ½'],
    auditTrail: ['Táº¡o luá»“ng xá»­ lÃ½ tá»± Ä‘á»™ng', 'Cáº­p nháº­t tráº¡ng thÃ¡i gáº§n nháº¥t', 'Äá»“ng bá»™ vÃ o hÃ ng chá» váº­n hÃ nh'],
  },
  users: {
    subject: 'NgÆ°á»i dÃ¹ng',
    description: 'Xem há»“ sÆ¡, vai trÃ², tráº¡ng thÃ¡i xÃ¡c minh vÃ  cÃ¡c thao tÃ¡c an toÃ n tÃ i khoáº£n.',
    checkpoints: ['XÃ¡c minh email/sá»‘ Ä‘iá»‡n thoáº¡i', 'Kiá»ƒm tra vai trÃ² vÃ  lá»‹ch sá»­ khÃ³a', 'Äá»‘i chiáº¿u bÃ¡o cÃ¡o liÃªn quan'],
    auditTrail: ['Ghi nháº­n Ä‘Äƒng nháº­p gáº§n nháº¥t', 'Cáº­p nháº­t há»“ sÆ¡ tÃ i khoáº£n', 'Theo dÃµi thay Ä‘á»•i quyá»n'],
  },
  courts: {
    subject: 'SÃ¢n',
    description: 'Kiá»ƒm tra há»“ sÆ¡ sÃ¢n, chá»§ sÃ¢n, Ä‘á»‹a chá»‰, sá»‘ sÃ¢n con vÃ  tráº¡ng thÃ¡i kiá»ƒm duyá»‡t.',
    checkpoints: ['Xem áº£nh vÃ  Ä‘á»‹a chá»‰ sÃ¢n', 'Äá»‘i chiáº¿u thÃ´ng tin chá»§ sÃ¢n', 'Kiá»ƒm tra lÃ½ do khÃ³a hoáº·c chá» duyá»‡t'],
    auditTrail: ['Chá»§ sÃ¢n cáº­p nháº­t há»“ sÆ¡', 'Admin kiá»ƒm tra thÃ´ng tin váº­n hÃ nh', 'Ghi nháº­n tráº¡ng thÃ¡i kiá»ƒm duyá»‡t'],
  },
  clubs: {
    subject: 'CÃ¢u láº¡c bá»™',
    description: 'Theo dÃµi CLB, chá»§ nhiá»‡m, thÃ nh viÃªn, bÃ¡o cÃ¡o vÃ  tráº¡ng thÃ¡i kiá»ƒm duyá»‡t.',
    checkpoints: ['Kiá»ƒm tra chá»§ nhiá»‡m CLB', 'Xem sá»‘ bÃ¡o cÃ¡o má»Ÿ', 'ÄÃ¡nh giÃ¡ má»©c Ä‘á»™ rá»§i ro cá»™ng Ä‘á»“ng'],
    auditTrail: ['CLB cáº­p nháº­t ná»™i dung', 'Admin xá»­ lÃ½ bÃ¡o cÃ¡o', 'Ghi nháº­n cáº£nh bÃ¡o gáº§n nháº¥t'],
  },
  bookings: {
    subject: 'Booking',
    description: 'Xem mÃ£ Ä‘Æ¡n, ngÆ°á»i Ä‘áº·t, sÃ¢n, thá»i gian, thanh toÃ¡n vÃ  tranh cháº¥p náº¿u cÃ³.',
    checkpoints: ['Äá»‘i chiáº¿u tráº¡ng thÃ¡i thanh toÃ¡n', 'Kiá»ƒm tra lá»‹ch sÃ¢n liÃªn quan', 'Xem yÃªu cáº§u há»— trá»£/hoÃ n tiá»n'],
    auditTrail: ['Khá»Ÿi táº¡o booking', 'Cáº­p nháº­t thanh toÃ¡n', 'Ghi nháº­n check-in hoáº·c há»§y lá»‹ch'],
  },
  reports: {
    subject: 'BÃ¡o cÃ¡o',
    description: 'Xem loáº¡i bÃ¡o cÃ¡o, Ä‘á»‘i tÆ°á»£ng bá»‹ bÃ¡o cÃ¡o, ngÆ°á»i gá»­i vÃ  má»©c Ä‘á»™ Æ°u tiÃªn.',
    checkpoints: ['PhÃ¢n loáº¡i ná»™i dung vi pháº¡m', 'Kiá»ƒm tra báº±ng chá»©ng liÃªn quan', 'Ghi káº¿t quáº£ xá»­ lÃ½ cho ngÆ°á»i gá»­i'],
    auditTrail: ['Táº¡o bÃ¡o cÃ¡o tá»« ngÆ°á»i dÃ¹ng', 'ÄÆ°a vÃ o hÃ ng chá» kiá»ƒm duyá»‡t', 'Cáº­p nháº­t káº¿t quáº£ xá»­ lÃ½'],
  },
  posts: {
    subject: 'BÃ i viáº¿t',
    description: 'Xem bÃ i viáº¿t cá»™ng Ä‘á»“ng, tÃ¡c giáº£, chá»§ Ä‘á», tÆ°Æ¡ng tÃ¡c vÃ  sá»‘ bÃ¡o cÃ¡o.',
    checkpoints: ['Kiá»ƒm tra ná»™i dung/hashtag', 'Xem lá»‹ch sá»­ bÃ¡o cÃ¡o', 'Quyáº¿t Ä‘á»‹nh hiá»ƒn thá»‹, áº©n hoáº·c ghim'],
    auditTrail: ['BÃ i viáº¿t Ä‘Æ°á»£c táº¡o', 'Cáº­p nháº­t tÆ°Æ¡ng tÃ¡c', 'Ghi nháº­n tráº¡ng thÃ¡i kiá»ƒm duyá»‡t'],
  },
  reviews: {
    subject: 'ÄÃ¡nh giÃ¡',
    description: 'Xem Ä‘á»‘i tÆ°á»£ng Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡, ngÆ°á»i Ä‘Ã¡nh giÃ¡, Ä‘iá»ƒm sá»‘, ná»™i dung vÃ  bÃ¡o cÃ¡o.',
    checkpoints: ['Kiá»ƒm tra ná»™i dung Ä‘Ã¡nh giÃ¡', 'Äá»‘i chiáº¿u báº±ng chá»©ng náº¿u bá»‹ bÃ¡o cÃ¡o', 'Quyáº¿t Ä‘á»‹nh hiá»ƒn thá»‹ hoáº·c áº©n'],
    auditTrail: ['NgÆ°á»i dÃ¹ng gá»­i Ä‘Ã¡nh giÃ¡', 'Há»‡ thá»‘ng quÃ©t spam', 'Admin cáº­p nháº­t tráº¡ng thÃ¡i'],
  },
  transactions: {
    subject: 'Giao dá»‹ch',
    description: 'Xem mÃ£ giao dá»‹ch, nguá»“n tiá»n, liÃªn káº¿t booking/giáº£i Ä‘áº¥u, sá»‘ tiá»n vÃ  cá»•ng thanh toÃ¡n.',
    checkpoints: ['Äá»‘i chiáº¿u mÃ£ giao dá»‹ch', 'Kiá»ƒm tra tráº¡ng thÃ¡i cá»•ng thanh toÃ¡n', 'XÃ¡c minh hoÃ n tiá»n/Ä‘á»‘i soÃ¡t'],
    auditTrail: ['Táº¡o giao dá»‹ch', 'Cáº­p nháº­t tá»« cá»•ng thanh toÃ¡n', 'Ghi nháº­n Ä‘á»‘i soÃ¡t tÃ i chÃ­nh'],
  },
};

export const AdminDetailDrawer = ({
  config,
  row,
  onClose,
  onActionSelect,
}: {
  config: AdminConfig;
  row: AdminRow | null;
  onClose: () => void;
  onActionSelect?: (row: AdminRow, action: string) => void;
}) => {
  useEffect(() => {
    if (!row) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, row]);

  if (!row) {
    return null;
  }

  const copy = detailCopy[config.id];
  const title = row.cells[0] ?? row.id;
  const subtitle = row.cells.slice(1, 3).filter(Boolean).join(' â€¢ ');
  const fields = config.columns.map((column, index) => ({
    label: column,
    value: row.cells[index] ?? '-',
  }));

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="ÄÃ³ng chi tiáº¿t"
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-labelledby="admin-detail-title"
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col overflow-hidden bg-surface-container-lowest shadow-2xl"
        role="dialog"
      >
        <header className="sticky top-0 z-10 border-b border-outline-variant bg-surface-container-lowest px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">
                Chi tiáº¿t {copy.subject}
              </p>
              <h2 id="admin-detail-title" className="mt-1 text-[26px] font-bold leading-tight text-on-background">
                {title}
              </h2>
              {subtitle && <p className="mt-1 text-[14px] text-secondary">{subtitle}</p>}
            </div>
            <button
              aria-label="ÄÃ³ng"
              className="rounded-lg border border-outline-variant p-2 text-secondary transition-colors hover:border-primary hover:text-primary"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge tone={row.statusTone}>{row.status}</StatusBadge>
            <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold text-secondary">
              ID: {row.id}
            </span>
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <section className="rounded-xl border border-outline-variant bg-surface p-5">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-primary-container/25 p-2 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[18px] font-bold text-on-background">ThÃ´ng tin chÃ­nh</h3>
                <p className="mt-1 text-[14px] leading-6 text-secondary">{copy.description}</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.label} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                  <dt className="text-[12px] font-bold uppercase tracking-[0.08em] text-secondary">{field.label}</dt>
                  <dd className="mt-1 text-[15px] font-bold text-on-background">{field.value}</dd>
                </div>
              ))}
            </dl>

            {row.note && (
              <div className="mt-3 rounded-lg border border-secondary/20 bg-secondary-container/30 p-4 text-[14px] leading-6 text-secondary">
                {row.note}
              </div>
            )}
          </section>

          <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-outline-variant bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <h3 className="text-[18px] font-bold text-on-background">Cáº§n kiá»ƒm tra</h3>
              </div>
              <ul className="space-y-3">
                {copy.checkpoints.map((item) => (
                  <li key={item} className="flex gap-3 text-[14px] leading-5 text-secondary">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h3 className="text-[18px] font-bold text-on-background">Nháº­t kÃ½ gáº§n Ä‘Ã¢y</h3>
              </div>
              <div className="space-y-3">
                {copy.auditTrail.map((item, index) => (
                  <div key={item} className="border-l-2 border-primary/40 pl-3">
                    <p className="text-[14px] font-bold text-on-background">{item}</p>
                    <p className="mt-0.5 text-[12px] text-secondary">BÆ°á»›c {index + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-outline-variant bg-surface p-5">
            <h3 className="text-[18px] font-bold text-on-background">Luá»“ng xá»­ lÃ½</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {row.filters.map((filter) => (
                <span key={filter} className="rounded-full bg-secondary-container px-3 py-1 text-[12px] font-bold text-secondary">
                  {filter}
                </span>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {row.actions.map((action) => (
                <button
                  className={`rounded-lg border bg-surface-container-lowest px-4 py-3 text-left text-[13px] font-bold transition-colors ${
                    isDangerousAdminAction(action)
                      ? 'border-error/30 text-error hover:bg-error-container/60'
                      : 'border-outline-variant text-secondary hover:border-primary hover:text-primary'
                  }`}
                  key={action}
                  onClick={() => onActionSelect?.(row, action)}
                  type="button"
                >
                  {action}
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};
