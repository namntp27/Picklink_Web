import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export const MainLayout = () => {
  const [showFooter, setShowFooter] = useState(true);

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-background font-sans text-on-background">
      <Header />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet context={{ setShowFooter }} />
      </main>
      {showFooter && <Footer />}
    </div>
  );
};
