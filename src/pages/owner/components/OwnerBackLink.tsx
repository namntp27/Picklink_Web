import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const OwnerBackLink = ({ fallback, className, children }: { fallback: string; className?: string; children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Link
      className={className}
      onClick={(event) => {
        if (location.key === 'default') return;
        event.preventDefault();
        navigate(-1);
      }}
      to={fallback}
    >
      {children}
    </Link>
  );
};