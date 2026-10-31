
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() =>
          setSidebarCollapsed((current) => !current)
        }
      />

      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]'
        }`}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-h-[calc(100vh-145px)] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          <div className="mx-auto w-full max-w-[1500px]">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
