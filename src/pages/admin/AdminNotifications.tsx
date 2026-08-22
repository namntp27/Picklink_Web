import { Notifications } from '../notifications/Notifications';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';

export const AdminNotifications = () => (
  <AdminShell activeId="notifications">
    <MobileAdminNav activeId="notifications" />
    <Notifications workspace="admin" />
  </AdminShell>
);
