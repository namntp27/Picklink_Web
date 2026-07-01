import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { LoaderCircle } from 'lucide-react';

type GoogleCredentialResponse = {
  credential: string;
  select_by: string;
};

type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  context?: 'signin' | 'signup';
  ux_mode?: 'popup' | 'redirect';
};

type GoogleButtonConfiguration = {
  type: 'standard';
  theme: 'outline';
  size: 'large';
  text: 'signin_with' | 'signup_with';
  shape: 'rectangular';
  logo_alignment: 'left';
  width: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (configuration: GoogleIdConfiguration) => void;
          renderButton: (element: HTMLElement, configuration: GoogleButtonConfiguration) => void;
        };
      };
    };
  }
}

type GoogleAuthButtonProps = {
  mode: 'login' | 'register';
  onCredential: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
};

const googleScriptId = 'google-identity-services';
let googleScriptPromise: Promise<void> | null = null;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(googleScriptId) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');

    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Google Identity Services could not be loaded.')), { once: true });

    if (!existingScript) {
      script.id = googleScriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return googleScriptPromise;
};

export const GoogleAuthButton = ({ mode, onCredential, onError }: GoogleAuthButtonProps) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const shouldReduceMotion = useReducedMotion();
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  useEffect(() => {
    let isActive = true;
    setIsLoadingScript(true);

    if (!clientId) {
      setIsLoadingScript(false);
      onErrorRef.current('VITE_GOOGLE_CLIENT_ID chưa được cấu hình.');
      return undefined;
    }

    loadGoogleIdentityServices()
      .then(() => {
        if (!isActive || !buttonRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          context: mode === 'register' ? 'signup' : 'signin',
          ux_mode: 'popup',
          callback: async ({ credential }) => {
            if (!credential) {
              onErrorRef.current('Google không trả về thông tin xác thực. Vui lòng thử lại.');
              return;
            }

            setIsProcessing(true);
            try {
              await onCredentialRef.current(credential);
            } finally {
              if (isActive) setIsProcessing(false);
            }
          },
        });

        buttonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(buttonRef.current.clientWidth || 320, 400),
        });
        setIsLoadingScript(false);
      })
      .catch(() => {
        if (isActive) {
          setIsLoadingScript(false);
          onErrorRef.current('Không thể tải đăng nhập Google. Vui lòng kiểm tra kết nối mạng.');
        }
      });

    return () => {
      isActive = false;
    };
  }, [clientId, mode]);

  return (
    <div
      aria-busy={isLoadingScript || isProcessing}
      className="relative flex min-h-12 w-full min-w-0 items-center justify-center overflow-hidden rounded-lg"
    >
      <div
        aria-hidden={isProcessing}
        className={`flex min-h-12 w-full min-w-0 items-center justify-center transition-opacity duration-200 ${
          isProcessing ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        ref={buttonRef}
      />
      <AnimatePresence initial={false}>
        {(isLoadingScript || isProcessing) && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex min-h-12 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-[14px] font-semibold text-on-surface-variant"
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -2 }}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 2 }}
            role="status"
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 shrink-0 animate-spin text-primary motion-reduce:animate-none"
            />
            <span>{isProcessing ? 'Đang xác thực Google...' : 'Đang tải Google...'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
