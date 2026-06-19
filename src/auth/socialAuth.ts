type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type: 'standard';
              theme: 'outline';
              size: 'large';
              text: 'continue_with';
              shape: 'rectangular';
              logo_alignment: 'left';
              locale: string;
              width: number;
            },
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const loadScript = (id: string, src: string) =>
  new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(id) as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Không thể tải SDK đăng nhập bên thứ ba.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('Không thể tải SDK đăng nhập bên thứ ba.'));
    document.head.appendChild(script);
  });

export const hasGoogleClientId = () => Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export const renderGoogleSignInButton = async (
  container: HTMLElement,
  onCredential: (idToken: string) => void,
) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Chưa cấu hình VITE_GOOGLE_CLIENT_ID cho frontend.');
  }

  await loadScript(GOOGLE_SCRIPT_ID, GOOGLE_SCRIPT_SRC);

  if (!window.google?.accounts?.id) {
    throw new Error('Không thể khởi tạo Google Identity Services.');
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    auto_select: false,
    callback: (response) => {
      if (!response.credential) {
        throw new Error('Google không trả về ID token.');
      }

      onCredential(response.credential);
    },
  });

  container.replaceChildren();
  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    locale: 'vi',
    width: Math.max(160, Math.floor(container.getBoundingClientRect().width)),
  });
};

export {};
