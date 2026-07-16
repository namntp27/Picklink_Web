import { CircleOff } from 'lucide-react';
import type { AdminSectionId } from '../types';
import { AdminShell } from './AdminShell';
import { MobileAdminNav } from './MobileAdminNav';

export const AdminUnavailable = ({
  activeId,
  title,
}: {
  activeId: AdminSectionId;
  title: string;
}) => (
  <AdminShell activeId={activeId}>
    <MobileAdminNav activeId={activeId} />
    <section className="mx-auto max-w-2xl rounded-2xl border border-outline-variant bg-white p-6 text-center shadow-sm sm:p-10" role="status">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-surface-container-low text-primary">
        <CircleOff aria-hidden="true" className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-on-surface">{title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-on-surface-variant">
        Chức năng này chưa có API quản trị. Picklink sẽ không hiển thị dữ liệu mẫu hoặc thao tác giả.
      </p>
    </section>
  </AdminShell>
);