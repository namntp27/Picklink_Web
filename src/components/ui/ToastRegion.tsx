import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'error' | 'info' | 'success';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type Notify = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<Notify | null>(null);

const toneStyle: Record<ToastTone, {
  icon: typeof Info;
  iconClassName: string;
  surfaceClassName: string;
}> = {
  error: {
    icon: AlertTriangle,
    iconClassName: 'bg-error-container text-error',
    surfaceClassName: 'border-error/25',
  },
  info: {
    icon: Info,
    iconClassName: 'bg-[#edf5e9] text-[#477313]',
    surfaceClassName: 'border-[#d8e4d4]',
  },
  success: {
    icon: CheckCircle2,
    iconClassName: 'bg-[#e2ff57] text-[#102414]',
    surfaceClassName: 'border-[#b9dca8]',
  },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const shouldReduceMotion = useReducedMotion();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback<Notify>((message, tone = 'info') => {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) return;

    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setItems((current) => [...current.slice(-2), { id, message: normalizedMessage, tone }]);
    const timer = window.setTimeout(() => dismiss(id), tone === 'error' ? 5200 : 3800);
    timersRef.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const contextValue = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-atomic="false"
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 top-3 z-[120] grid w-[calc(100%_-_1.5rem)] max-w-md -translate-x-1/2 gap-2 sm:top-4"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const style = toneStyle[item.tone];
            const Icon = style.icon;

            return (
              <motion.div
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className={`picklink-toast-item pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white/96 p-3.5 text-[#0b2228] shadow-[0_18px_48px_rgba(8,29,36,0.16)] backdrop-blur-xl ${style.surfaceClassName}`}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.97, x: 18 }}
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, x: 24 }}
                key={item.id}
                layout
                role={item.tone === 'error' ? 'alert' : 'status'}
                transition={{
                  duration: shouldReduceMotion ? 0.01 : 0.24,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${style.iconClassName}`}>
                  <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                </span>
                <p className="min-w-0 flex-1 pt-1 text-[13px] font-bold leading-5">{item.message}</p>
                <button
                  aria-label="Đóng thông báo"
                  className="picklink-glow-control grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#718077] hover:bg-[#edf5e9] hover:text-[#0b2228]"
                  onClick={() => dismiss(item.id)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error('useToast must be used inside ToastProvider.');
  return notify;
};
