import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { Button } from './Button';
import { ModalDialog } from './ModalDialog';

export type ConfirmTone = 'danger' | 'default' | 'success';

export type ConfirmOptions = {
  title: string;
  /** Optional second line: the detail that makes the decision obvious. */
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

export type PromptOptions = ConfirmOptions & {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  /** Blocks the confirm button until something is typed. */
  required?: boolean;
  maxLength?: number;
};

type RequestConfirm = (options: ConfirmOptions | string) => Promise<boolean>;
type RequestPrompt = (options: PromptOptions) => Promise<string | null>;

const ConfirmContext = createContext<RequestConfirm | null>(null);
const PromptContext = createContext<RequestPrompt | null>(null);

const toneStyle: Record<ConfirmTone, {
  icon: typeof HelpCircle;
  headerClassName: string;
  kickerClassName: string;
  iconClassName: string;
  closeClassName: string;
  confirmVariant: 'danger' | 'default';
  kicker: string;
}> = {
  danger: {
    icon: AlertTriangle,
    headerClassName: 'border-error/20 bg-error-container',
    kickerClassName: 'text-error',
    iconClassName: 'bg-error/12 text-error',
    closeClassName: 'text-error hover:bg-on-error/45',
    confirmVariant: 'danger',
    kicker: 'Cần xác nhận',
  },
  default: {
    icon: HelpCircle,
    headerClassName: 'border-[#e2ff57]/25 bg-[#081d24]',
    kickerClassName: 'text-[#e2ff57]',
    iconClassName: 'bg-[#e2ff57] text-[#081d24]',
    closeClassName: 'text-white/70 hover:bg-white/10 hover:text-white',
    confirmVariant: 'default',
    kicker: 'Xác nhận',
  },
  success: {
    icon: CheckCircle2,
    headerClassName: 'border-[#b9dca8] bg-[#edf5e9]',
    kickerClassName: 'text-[#477313]',
    iconClassName: 'bg-[#e2ff57] text-[#102414]',
    closeClassName: 'text-[#477313] hover:bg-[#dcebd3]',
    confirmVariant: 'default',
    kicker: 'Xác nhận',
  },
};

type PendingRequest = {
  options: ConfirmOptions;
  input?: Omit<PromptOptions, keyof ConfirmOptions>;
  /** Prompts settle with the typed text (null when dismissed); confirms settle with a boolean. */
  settle: (result: boolean | string | null) => void;
};

/**
 * Replaces window.confirm with an in-app dialog.
 *
 * Kept promise-based on purpose: call sites read almost exactly like the native call they replace
 * (`if (!(await confirm(...))) return;`), so the branch stays where the decision belongs instead of
 * being scattered into per-screen dialog state.
 */
export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
  const shouldReduceMotion = useReducedMotion();
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [draft, setDraft] = useState('');
  const pendingRef = useRef<PendingRequest | null>(null);

  const settle = useCallback((accepted: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    if (!current) return;
    current.settle(current.input ? (accepted ? draft : null) : accepted);
  }, [draft]);

  const open = useCallback((request: Omit<PendingRequest, 'settle'>, settleRequest: PendingRequest['settle']) => {
    // A second request while one is open: the older question is abandoned, never silently accepted.
    pendingRef.current?.settle(pendingRef.current.input ? null : false);

    const next = { ...request, settle: settleRequest };
    pendingRef.current = next;
    setDraft(request.input?.defaultValue ?? '');
    setPending(next);
  }, []);

  const requestConfirm = useCallback<RequestConfirm>((options) => new Promise<boolean>((resolve) => {
    open(
      { options: typeof options === 'string' ? { title: options } : options },
      (result) => resolve(result === true),
    );
  }), [open]);

  const requestPrompt = useCallback<RequestPrompt>((options) => new Promise<string | null>((resolve) => {
    const { label, placeholder, defaultValue, required, maxLength, ...confirmOptions } = options;
    open(
      { options: confirmOptions, input: { label, placeholder, defaultValue, required, maxLength } },
      (result) => resolve(typeof result === 'string' ? result : null),
    );
  }), [open]);

  const style = toneStyle[pending?.options.tone ?? 'default'];
  const Icon = style.icon;

  return (
    <ConfirmContext.Provider value={requestConfirm}>
      <PromptContext.Provider value={requestPrompt}>
      {children}
      {pending && (
        <ModalDialog
          aria-labelledby="confirm-dialog-title"
          // Sits near the top so the screen behind stays readable, and leaves that screen unblurred:
          // these questions are about what is on it, so dimming it hides the very thing being judged.
          className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto bg-transparent shadow-none backdrop:bg-transparent backdrop:backdrop-blur-none"
          onRequestClose={() => settle(false)}
          style={{ maxWidth: '28.8rem', marginTop: '6vh', marginBottom: 'auto' }}
        >
          <motion.section
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0_24px_70px_rgba(25,29,20,0.22)]"
            data-motion-managed
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className={`flex items-start gap-3 border-b px-5 py-3 ${style.headerClassName}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${style.iconClassName}`}>
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-bold uppercase tracking-[0.08em] ${style.kickerClassName}`}>
                  {style.kicker}
                </p>
                <h2
                  className={`mt-0.5 break-words text-[17px] font-extrabold leading-6 tracking-[-0.01em] ${
                    pending.options.tone === 'default' ? 'text-white' : 'text-on-surface'
                  }`}
                  id="confirm-dialog-title"
                >
                  {pending.options.title}
                </h2>
              </div>
              <button
                aria-label="Đóng"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px ${style.closeClassName}`}
                onClick={() => settle(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              {pending.options.message && (
                <div className="text-[13px] leading-5 text-on-surface-variant">{pending.options.message}</div>
              )}

              {pending.input && (
                <label className={`block ${pending.options.message ? 'mt-3' : ''}`}>
                  <span className="text-[13px] font-bold text-on-surface">{pending.input.label}</span>
                  <textarea
                    autoFocus
                    className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-outline-variant bg-surface-container p-2.5 text-[14px] leading-6 text-on-surface outline-none transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] placeholder:text-outline hover:border-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container/30"
                    maxLength={pending.input.maxLength ?? 500}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={pending.input.placeholder}
                    value={draft}
                  />
                  <span className="mt-1 block text-right text-[11px] text-on-surface-variant">
                    {draft.length}/{pending.input.maxLength ?? 500}
                  </span>
                </label>
              )}

              <div className={`grid gap-2.5 sm:grid-cols-2 ${pending.options.message || pending.input ? 'mt-4' : ''}`}>
                <Button onClick={() => settle(false)} type="button" variant="outline">
                  {pending.options.cancelLabel ?? 'Hủy'}
                </Button>
                <Button
                  autoFocus={!pending.input}
                  disabled={Boolean(pending.input?.required) && !draft.trim()}
                  onClick={() => settle(true)}
                  type="button"
                  variant={style.confirmVariant}
                >
                  {pending.options.confirmLabel ?? 'Xác nhận'}
                </Button>
              </div>
            </div>
          </motion.section>
        </ModalDialog>
      )}
      </PromptContext.Provider>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const requestConfirm = useContext(ConfirmContext);
  if (!requestConfirm) throw new Error('useConfirm must be used inside ConfirmDialogProvider.');
  return requestConfirm;
};

/** Same dialog as useConfirm, plus a text box. Resolves to the typed value, or null if dismissed. */
export const usePrompt = () => {
  const requestPrompt = useContext(PromptContext);
  if (!requestPrompt) throw new Error('usePrompt must be used inside ConfirmDialogProvider.');
  return requestPrompt;
};
