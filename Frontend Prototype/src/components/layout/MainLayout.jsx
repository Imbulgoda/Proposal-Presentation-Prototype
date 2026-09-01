import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIHealthAssistant from '../assistant/AIHealthAssistant';
import NotificationDetailModal from '../cards/NotificationDetailModal';
import { SidebarContext } from './sidebarContext';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="min-h-screen bg-surface">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="md:pl-[260px]">
          <Outlet />
        </div>
        <AIHealthAssistant />
        <NotificationDetailModal />
      </div>
    </SidebarContext.Provider>
  );
}
