import type { ReactNode } from 'react';
import { toneClasses } from '../adminStyles';
import type { Tone } from '../types';

export const StatusBadge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold ${toneClasses[tone]}`}>
    {children}
  </span>
);
