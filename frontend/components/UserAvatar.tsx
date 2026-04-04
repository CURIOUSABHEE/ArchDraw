'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  LogOut, 
  FolderOpen, 
  Settings, 
  User, 
  Shield, 
  Bell, 
  CreditCard,
  ChevronRight,
  Camera,
  Check
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';

type SettingsTab = 'general' | 'profile' | 'security' | 'notifications' | 'subscription';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { user, signOut } = useAuthStore();
  const { userProfile, canvases } = useDiagramStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [open, onOpenChange]);

  const profile = userProfile ?? (user ? { id: user.id, email: user.email ?? undefined, name: user.user_metadata?.name } : null);
  if (!profile) return null;

  const initials = (profile.name?.[0] ?? profile.email?.[0] ?? '?').toUpperCase();

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'subscription' as const, label: 'Subscription', icon: CreditCard },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.3)' }} onClick={() => onOpenChange(false)} />
      
      <div 
        ref={ref}
        className="relative w-full max-w-2xl mx-4 overflow-hidden flex"
        style={{ 
          background: 'white', 
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          height: 480
        }}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: '#6B6B6B', zIndex: 10 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left sidebar */}
        <div 
          className="w-48 shrink-0 p-4"
          style={{ background: '#FAFAFA' }}
        >
          <h2 className="text-sm font-semibold mb-4 px-2" style={{ color: '#1A1A1A' }}>Settings</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-[12px] transition-all ${
                  activeTab === tab.id ? 'bg-white shadow-sm' : 'hover:bg-gray-100'
                }`}
                style={{ 
                  color: activeTab === tab.id ? '#1A1A1A' : '#6B6B6B'
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User info at bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <div 
              className="flex items-center gap-3 p-3 rounded-[12px]"
              style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-semibold shrink-0"
                style={{ background: '#1A1A1A' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#1A1A1A' }}>
                  {profile.name ?? 'User'}
                </p>
                <p className="text-[10px] truncate" style={{ color: '#6B6B6B' }}>
                  {profile.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 mt-2 text-sm rounded-[12px] transition-colors hover:bg-gray-100"
              style={{ color: '#E5484D' }}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>General</h3>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>Manage your account settings</p>
              </div>

              <div 
                className="p-4 rounded-[16px]"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Dark mode</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Switch between light and dark theme</p>
                  </div>
                  <button 
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ background: '#1A1A1A' }}
                  >
                    <span 
                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: 'translateX(5px)' }}
                    />
                  </button>
                </div>
              </div>

              <div 
                className="p-4 rounded-[16px]"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Edge animations</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Show animated connections</p>
                  </div>
                  <button 
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ background: '#E0E0E0' }}
                  >
                    <span 
                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                    />
                  </button>
                </div>
              </div>

              <div 
                className="p-4 rounded-[16px]"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Show grid</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Display alignment grid on canvas</p>
                  </div>
                  <button 
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ background: '#1A1A1A' }}
                  >
                    <span 
                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: 'translateX(5px)' }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>Profile</h3>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>Manage your public profile</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl text-white font-semibold"
                    style={{ background: '#1A1A1A' }}
                  >
                    {initials}
                  </div>
                  <button 
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-white shadow-md"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  >
                    <Camera className="w-3 h-3" style={{ color: '#1A1A1A' }} />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Profile photo</p>
                  <p className="text-xs" style={{ color: '#6B6B6B' }}>Click to upload</p>
                </div>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>Display name</label>
                <input
                  type="text"
                  defaultValue={profile.name ?? ''}
                  placeholder="Your name"
                  className="w-full px-4 py-3 text-sm rounded-[14px] outline-none transition-all"
                  style={{ 
                    background: '#F8F8F8',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
                    color: '#1A1A1A'
                  }}
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>Email</label>
                <input
                  type="email"
                  defaultValue={profile.email ?? ''}
                  disabled
                  className="w-full px-4 py-3 text-sm rounded-[14px] outline-none"
                  style={{ 
                    background: '#F2F2F2',
                    color: '#6B6B6B'
                  }}
                />
              </div>

              {/* Private profile toggle */}
              <div 
                className="p-4 rounded-[16px]"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Private profile</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Only you can see your diagrams</p>
                  </div>
                  <button 
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ background: '#E0E0E0' }}
                  >
                    <span 
                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                    />
                  </button>
                </div>
              </div>

              <button
                className="w-full py-3 text-sm font-medium text-white rounded-[14px] transition-all hover:opacity-90"
                style={{ 
                  background: '#1A1A1A',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                Save changes
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>Security</h3>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>Manage your account security</p>
              </div>

              <div 
                className="p-4 rounded-[16px] cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Change password</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Update your account password</p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                </div>
              </div>

              <div 
                className="p-4 rounded-[16px] cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Two-factor authentication</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Add an extra layer of security</p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>Notifications</h3>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>Configure how you receive updates</p>
              </div>

              <div 
                className="p-4 rounded-[16px]"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Email notifications</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Receive updates via email</p>
                  </div>
                  <button 
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ background: '#1A1A1A' }}
                  >
                    <span 
                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: 'translateX(5px)' }}
                    />
                  </button>
                </div>
              </div>

              <div 
                className="p-4 rounded-[16px]"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Share notifications</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Get notified when someone shares a diagram</p>
                  </div>
                  <button 
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ background: '#1A1A1A' }}
                  >
                    <span 
                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: 'translateX(5px)' }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>Subscription</h3>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>Manage your plan and billing</p>
              </div>

              <div 
                className="p-5 rounded-[16px] border-2"
                style={{ borderColor: '#1A1A1A' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Free plan</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#1A1A1A', color: 'white' }}>Current</span>
                </div>
                <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>5 canvases, basic features</p>
                <button
                  className="w-full py-2.5 text-sm font-medium text-white rounded-[12px] transition-all hover:opacity-90"
                  style={{ background: '#1A1A1A' }}
                >
                  Upgrade to Pro
                </button>
              </div>

              <div 
                className="p-4 rounded-[16px]"
                style={{ background: '#F8F8F8' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Canvases used</p>
                    <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>{canvases.length} of 5</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface UserAvatarProps {
  onSettingsClick?: () => void;
}

export function UserAvatar({ onSettingsClick }: UserAvatarProps) {
  const { user, signOut } = useAuthStore();
  const { userProfile, canvases } = useDiagramStore();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const profile = userProfile ?? (user ? { id: user.id, email: user.email ?? undefined, name: user.user_metadata?.name } : null);
  if (!profile) return null;

  const initials = (profile.name?.[0] ?? profile.email?.[0] ?? '?').toUpperCase();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 p-1.5 rounded-[12px] transition-colors hover:bg-gray-100"
        >
          {'avatar_url' in profile && profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={initials} className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-semibold shrink-0"
              style={{ background: '#1A1A1A' }}
            >
              {initials}
            </div>
          )}
        </button>

        {open && (
          <div
            className="absolute top-full right-0 mt-2 w-56 rounded-[16px] overflow-hidden z-50"
            style={{ 
              background: 'white', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: '#F2F2F2' }}>
              <p className="text-sm font-semibold truncate" style={{ color: '#1A1A1A' }}>
                {profile.name ?? 'User'}
              </p>
              <p className="text-xs truncate" style={{ color: '#6B6B6B' }}>{profile.email}</p>
            </div>
            
            <div className="p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowSettings(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-[12px] transition-colors hover:bg-gray-50"
                style={{ color: '#1A1A1A' }}
              >
                <Settings className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                Settings
              </button>
              
              <button
                onClick={() => {
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-[12px] transition-colors hover:bg-gray-50"
                style={{ color: '#1A1A1A' }}
              >
                <FolderOpen className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                <span className="flex-1 text-left">Your canvases</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F2F2F2', color: '#6B6B6B' }}>
                  {canvases.length}
                </span>
              </button>
            </div>

            <div className="p-2 border-t" style={{ borderColor: '#F2F2F2' }}>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-[12px] transition-colors hover:bg-red-50"
                style={{ color: '#E5484D' }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <SettingsPanel open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
