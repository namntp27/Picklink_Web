import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export const MainLayout = () => {
  const [showFooter, setShowFooter] = useState(true);
  const { pathname } = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const outlet = useOutlet({ setShowFooter });
  const isCommunityWorkspace = (
    pathname === '/my-matches'
    || pathname.startsWith('/matches/')
    || pathname === '/opponents'
    || pathname.startsWith('/opponents/')
    || pathname === '/posts'
    || pathname.startsWith('/posts/')
  );
  const isProductWorkspace = (
    isCommunityWorkspace
    || pathname === '/my-bookings'
    || pathname === '/profile'
    || pathname === '/messages'
    || pathname === '/notifications'
    || (pathname.startsWith('/clubs/') && pathname.endsWith('/dashboard'))
  );
  const motionScope = pathname === '/' ? 'home' : isProductWorkspace ? 'product' : 'rich';
  const routeInitial = shouldReduceMotion || pathname === '/'
    ? false
    : { opacity: 0, y: 12, scale: 0.996 };
  const shouldRenderFooter = pathname === '/' && showFooter;

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-background font-sans text-on-background">
      <Header />
      <main className="flex min-w-0 flex-1 flex-col">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="picklink-route-stage flex min-w-0 flex-1 flex-col"
            data-motion-scope={motionScope}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.998 }}
            initial={routeInitial}
            key={pathname}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.34,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      {shouldRenderFooter && <Footer />}
    </div>
  );
};
