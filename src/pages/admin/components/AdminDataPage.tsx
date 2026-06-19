import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Lock,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Unlock,
  XCircle,
} from 'lucide-react';
import { sectionConfigs } from '../adminData';
import { queueToneClasses } from '../adminStyles';
import type { AdminDataSectionId, AdminRow } from '../types';
import {
  AdminConfirmDialog,
  type AdminActionTarget,
  isDangerousAdminAction,
} from './AdminConfirmDialog';
import { AdminDetailDrawer } from './AdminDetailDrawer';
import { AdminShell } from './AdminShell';
import { MobileAdminNav } from './MobileAdminNav';
import { StatusBadge } from './StatusBadge';

const isViewAction = (action: string) => action.trim().toLowerCase() === 'xem';

export const AdminDataPage = ({ sectionId }: { sectionId: AdminDataSectionId }) => {
  const config = sectionConfigs[sectionId];
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [selectedRow, setSelectedRow] = useState<AdminRow | null>(null);
  const [pendingAction, setPendingAction] = useState<AdminActionTarget | null>(null);

  const handleActionSelect = (action: string, row?: AdminRow | null) => {
    if (isDangerousAdminAction(action)) {
      setPendingAction({ action, config, row });
    }
  };

  const handleConfirmAction = () => {
    setPendingAction(null);
  };

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
        <button
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-bold shadow-sm transition-opacity hover:opacity-90 ${
            isDangerousAdminAction(config.primaryAction) ? 'bg-error text-white' : 'bg-primary text-on-primary'
          }`}
          onClick={() => handleActionSelect(config.primaryAction)}
          type="button"
        >
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
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-on-primary transition-opacity hover:opacity-90"
                          onClick={() => setSelectedRow(row)}
                          type="button"
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </button>
                        {row.actions.filter((action) => !isViewAction(action)).map((action) => (
                          <button
                            key={action}
                            className={`inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-2 text-[12px] font-bold transition-colors ${
                              isDangerousAdminAction(action)
                                ? 'border-error/30 text-error hover:bg-error-container/60'
                                : 'border-outline-variant text-secondary hover:border-primary hover:text-primary'
                            }`}
                            onClick={() => handleActionSelect(action, row)}
                            type="button"
                          >
                            <Pencil className="h-4 w-4" />
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
              <button
                className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-[12px] font-bold text-secondary hover:border-primary hover:text-primary"
                onClick={() => handleActionSelect('Duyệt')}
                type="button"
              >
                <CheckCircle2 className="h-5 w-5" />
                Duyệt
              </button>
              <button
                className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-[12px] font-bold text-secondary hover:border-error hover:text-error"
                onClick={() => handleActionSelect('Từ chối')}
                type="button"
              >
                <XCircle className="h-5 w-5" />
                Từ chối
              </button>
              <button
                className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-[12px] font-bold text-secondary hover:border-primary hover:text-primary"
                onClick={() => handleActionSelect('Mở khóa')}
                type="button"
              >
                <Unlock className="h-5 w-5" />
                Mở khóa
              </button>
              <button
                className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-[12px] font-bold text-secondary hover:border-error hover:text-error"
                onClick={() => handleActionSelect('Khóa')}
                type="button"
              >
                <Lock className="h-5 w-5" />
                Khóa
              </button>
            </div>
          </section>
        </aside>
      </div>

      <AdminDetailDrawer
        config={config}
        onActionSelect={(row, action) => handleActionSelect(action, row)}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />
      <AdminConfirmDialog
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        target={pendingAction}
      />
    </AdminShell>
  );
};
