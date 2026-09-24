import { Outlet } from 'react-router-dom';
import AdminSidebar from '@components/common/AdminSidebar';
import TopBar from '@components/common/TopBar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-dark-950 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-[var(--spacing-sidebar)]">
        <TopBar />
        <main className="flex-1 p-6 pt-[calc(var(--spacing-topbar)+1.5rem)] lg:pt-6 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}