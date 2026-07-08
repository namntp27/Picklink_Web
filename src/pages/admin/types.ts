import type { LucideIcon } from 'lucide-react';

export type AdminSectionId =
  | 'overview'
  | 'users'
  | 'courts'
  | 'clubs'
  | 'bookings'
  | 'reports'
  | 'posts'
  | 'reviews'
  | 'transactions'
  | 'settings';

export type AdminDataSectionId = Exclude<AdminSectionId, 'settings'>;

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type AdminStat = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

export type AdminRow = {
  id: string;
  cells: string[];
  status: string;
  statusTone: Tone;
  filters: string[];
  actions: string[];
  note?: string;
};

export type QueueItem = {
  label: string;
  value: string;
  tone: Tone;
};

export type AdminConfig = {
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

export type SettingGroup = {
  title: string;
  description: string;
  items: Array<{
    label: string;
    helper: string;
    value: string;
    enabled?: boolean;
  }>;
};
