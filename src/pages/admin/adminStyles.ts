import type { Tone } from './types';

export const toneClasses: Record<Tone, string> = {
  success: 'bg-primary-container/40 text-primary',
  warning: 'bg-tertiary-container/50 text-tertiary',
  danger: 'bg-error-container text-error',
  info: 'bg-secondary-container text-secondary',
  neutral: 'bg-surface-container text-secondary',
};

export const queueToneClasses: Record<Tone, string> = {
  success: 'border-primary/30 bg-primary-container/20 text-primary',
  warning: 'border-tertiary/30 bg-tertiary-container/30 text-tertiary',
  danger: 'border-error/30 bg-error-container/70 text-error',
  info: 'border-secondary/30 bg-secondary-container/40 text-secondary',
  neutral: 'border-outline-variant bg-surface text-secondary',
};
