import { Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { RouteExperience, type RoutePrefetcher } from '../components/navigation/RouteExperience';
import { RouteLoadingFallback } from '../components/navigation/RouteLoadingFallback';
import { ToastProvider } from '../components/ui/ToastRegion';

type MotionScope = 'home' | 'product' | 'rich';

type AppFrameProps = {
  children: ReactNode;
  getMotionScope?: (pathname: string) => MotionScope;
  prefetchRoute: RoutePrefetcher;
};

export const AppFrame = ({
  children,
  getMotionScope = () => 'product',
  prefetchRoute,
}: AppFrameProps) => {
  const { pathname } = useLocation();

  return (
    <ToastProvider>
      <div className="picklink-app-shell" data-motion-scope={getMotionScope(pathname)}>
        <RouteExperience prefetchRoute={prefetchRoute} />
        <Suspense fallback={<RouteLoadingFallback />}>
          {children}
        </Suspense>
      </div>
    </ToastProvider>
  );
};
