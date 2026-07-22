import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { prefetchRoute } from '../../navigation/routePrefetch';

const anchorFromEvent = (event: Event) => {
  const target = event.target;
  if (!(target instanceof Element)) return null;

  const anchor = target.closest('a[href]');
  return anchor instanceof HTMLAnchorElement ? anchor : null;
};

export const RouteExperience = () => {
  const { token } = useAuth();
  const { hash, pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === 'POP' || hash) return;

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [hash, navigationType, pathname]);

  useEffect(() => {
    const prefetchFromIntent = (event: Event) => {
      const anchor = anchorFromEvent(event);
      if (!anchor || (anchor.target && anchor.target !== '_self')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin) prefetchRoute(url.pathname, token, url.search);
    };

    document.addEventListener('pointerover', prefetchFromIntent, { passive: true });
    document.addEventListener('pointerdown', prefetchFromIntent, { passive: true });
    document.addEventListener('focusin', prefetchFromIntent);

    return () => {
      document.removeEventListener('pointerover', prefetchFromIntent);
      document.removeEventListener('pointerdown', prefetchFromIntent);
      document.removeEventListener('focusin', prefetchFromIntent);
    };
  }, [token]);

  return null;
};
