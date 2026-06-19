import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client';
import { type AuthUser, useAuth } from '../../auth/AuthContext';
import { renderGoogleSignInButton } from '../../auth/socialAuth';
import type { UserRole } from '../../types';

type SocialRole = Extract<UserRole, 'player' | 'owner'>;

type SocialAuthButtonsProps = {
  disabled?: boolean;
  role?: SocialRole;
  onAuthenticated: (user: AuthUser) => void;
  onError: (message: string) => void;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return 'Không thể đăng nhập bằng tài khoản mạng xã hội. Vui lòng thử lại.';
};

export const SocialAuthButtons = ({ disabled = false, role, onAuthenticated, onError }: SocialAuthButtonsProps) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle } = useAuth();

  const handleGoogleCredential = useCallback(async (token: string) => {
    onError('');
    setIsGoogleLoading(true);

    try {
      const authUser = await loginWithGoogle({ token, role });
      onAuthenticated(authUser);
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }, [loginWithGoogle, onAuthenticated, onError, role]);

  useEffect(() => {
    const container = googleButtonRef.current;
    if (!container) {
      return;
    }

    let active = true;
    setGoogleButtonReady(false);

    renderGoogleSignInButton(container, (token) => {
      if (active) {
        void handleGoogleCredential(token);
      }
    })
      .then(() => {
        if (active) {
          setGoogleButtonReady(true);
        }
      })
      .catch((error) => {
        if (active) {
          onError(getErrorMessage(error));
        }
      });

    return () => {
      active = false;
    };
  }, [handleGoogleCredential, onError]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-variant" />
        </div>
        <div className="relative flex justify-center text-[12px] font-medium">
          <span className="bg-surface-bright px-2 text-secondary">Hoặc tiếp tục bằng</span>
        </div>
      </div>

      <div>
        <div
          className={`relative flex h-[46px] items-center justify-center overflow-hidden rounded-lg ${
            disabled || isGoogleLoading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <div ref={googleButtonRef} className="flex w-full justify-center" />
          {!googleButtonReady && (
            <span className="absolute inset-0 flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-[14px] font-bold text-on-surface">
              Đang tải Google...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
