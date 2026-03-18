'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, FolderOpen } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';

export function UserAvatar() {
  const { user, signOut } = useAuthStore();
  const { userProfile, canvases } = useDiagramStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const profile = userProfile ?? (user ? { id: user.id, email: user.email ?? undefined } : null);
  if (!profile) return null;

  const initials = (profile.name?.[0] ?? profile.email?.[0] ?? '?').toUpperCase();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <div ref={ref} className="relative px-3 pb-3 pt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={initials} className="w-7 h-7 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-semibold shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 text-left overflow-hidden min-w-0">
          <p className="text-xs text-white truncate leading-tight">{profile.name ?? 'User'}</p>
          <p className="text-[10px] text-slate-400 truncate leading-tight">{profile.email}</p>
        </div>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-3 right-3 mb-1 rounded-lg shadow-xl overflow-hidden z-50"
          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="px-3 py-2.5 border-b border-white/8">
            <p className="text-xs font-medium text-white truncate">{profile.name ?? profile.email}</p>
            {profile.name && <p className="text-[10px] text-slate-400 truncate">{profile.email}</p>}
          </div>
          <div className="px-3 py-2 border-b border-white/8">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{canvases.length} canvas{canvases.length !== 1 ? 'es' : ''}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
