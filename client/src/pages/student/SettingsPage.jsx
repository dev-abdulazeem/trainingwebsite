import { useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { useMutation } from '@tanstack/react-query';
import { userApi } from '@api/client';
import { User, Lock, Bell, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({ name: user?.name || '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const updateProfile = useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.user);
      toast.success('Profile updated!');
    },
  });

  const changePassword = useMutation({
    mutationFn: (data) => userApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate(profileData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    changePassword.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmNewPassword: passwordData.confirmNewPassword,
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-400">Manage your account preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600/10 text-primary-400'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ name: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-dark-800/50 border border-dark-700 rounded-lg px-4 py-3 text-dark-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-dark-600 mt-1">Email cannot be changed</p>
                </div>
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
                >
                  {changePassword.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'New Lesson Alerts', desc: 'Get notified when new lessons are released' },
                  { label: 'Assignment Reminders', desc: 'Receive reminders before assignment deadlines' },
                  { label: 'Community Replies', desc: 'Get notified when someone replies to your posts' },
                  { label: 'Account Activity', desc: 'Important updates about your account' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-dark-500 text-sm">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-dark-700 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}