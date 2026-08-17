import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const useHistoryBack = (fallback: string) => {
  const { key } = useLocation();
  const navigate = useNavigate();
  const canGoBack = key !== 'default';
  return { canGoBack, goBack: () => (canGoBack ? navigate(-1) : navigate(fallback)) };
};

export const HistoryBackLink = ({ fallback, className, children }: { fallback: string; className?: string; children: ReactNode }) => {
  const { canGoBack, goBack } = useHistoryBack(fallback);
  return (
    <Link
      className={className}
      onClick={(event) => {
        if (!canGoBack || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        goBack();
      }}
      to={fallback}
    >
      {children}
    </Link>
  );
};