import { Notifications } from '../notifications/Notifications';
import { OwnerShell } from './components/OwnerShell';

export const OwnerNotifications = () => (
  <OwnerShell activeId="notifications" innerClassName="max-w-[1320px]">
    <Notifications workspace="owner" />
  </OwnerShell>
);
