import { Outlet } from 'react-router-dom';
import Sidebar from '@components/common/Sidebar';
import TopBar from '@components/common/TopBar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-dark-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-[var(--spacing-sidebar)]">
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-[calc(var(--spacing-topbar)+1.5rem)] overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}