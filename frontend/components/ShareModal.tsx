'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Link2, X, ChevronDown, Users, Globe, Lock, Mail, Loader2 } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuthStore } from '@/store/authStore';

export type AccessRole = 'owner' | 'editor' | 'viewer';

export interface CanvasShareUser {
  id: string;
  email: string;
  name?: string;
  role: AccessRole;
  addedAt?: number;
}

interface Props {
  canvasId: string;
  canvasName: string;
  onClose: () => void;
}

export function ShareModal({ canvasId, canvasName, onClose }: Props) {
  const { userProfile } = useDiagramStore();
  const { user } = useAuthStore();
  
  const [linkAccess, setLinkAccess] = useState<'restricted' | 'anyone'>('restricted');
  const [linkPermission, setLinkPermission] = useState<'viewer' | 'editor'>('viewer');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [users, setUsers] = useState<CanvasShareUser[]>([]);
  const [copied, setCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentUserEmail = userProfile?.email || user?.email || '';
  const isOwner = (email: string) => users.find(u => u.id === email)?.role === 'owner';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/share/${canvasId}`;
    }
    return `/share/${canvasId}`;
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInvite = () => {
    if (!validateEmail(inviteEmail)) return;
    
    const newUser: CanvasShareUser = {
      id: inviteEmail,
      email: inviteEmail,
      name: inviteEmail.split('@')[0],
      role: inviteRole as AccessRole,
      addedAt: Date.now(),
    };
    
    if (!users.find(u => u.email === inviteEmail)) {
      setUsers([...users, newUser]);
    }
    
    setInviteEmail('');
  };

  const handleRemoveUser = (email: string) => {
    if (isOwner(email)) return;
    setUsers(users.filter(u => u.email !== email));
  };

  const handleRoleChange = (email: string, newRole: AccessRole) => {
    if (isOwner(email)) return;
    setUsers(users.map(u => u.email === email ? { ...u, role: newRole } : u));
    setShowRoleDropdown(null);
  };

  const addCurrentUser = () => {
    if (currentUserEmail && !users.find(u => u.email === currentUserEmail)) {
      setUsers([...users, {
        id: currentUserEmail,
        email: currentUserEmail,
        name: userProfile?.name,
        role: 'owner',
        addedAt: Date.now(),
      }]);
    }
  };

  useEffect(() => {
    addCurrentUser();
  }, [currentUserEmail]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose} 
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 overflow-hidden"
        style={{ 
          background: 'white', 
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: '#F2F2F2' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: '#F2F2F2' }}
              >
                <Users className="w-5 h-5" style={{ color: '#1A1A1A' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Share "{canvasName}"</h2>
                <p className="text-xs" style={{ color: '#6B6B6B' }}>Manage access and permissions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:bg-gray-100"
              style={{ color: '#6B6B6B' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Invite Row */}
          <div className="space-y-3">
            <label className="text-xs font-medium" style={{ color: '#1A1A1A' }}>Invite people</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#B0B0B0' }} />
                <input
                  ref={inputRef}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="Email or name..."
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-[12px] outline-none transition-all"
                  style={{ 
                    background: '#F8F8F8',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
                    color: '#1A1A1A'
                  }}
                />
              </div>
              
              {/* Permission dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowRoleDropdown(showRoleDropdown === 'invite' ? null : 'invite')}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-[12px] transition-all"
                  style={{ background: '#F2F2F2', color: '#1A1A1A' }}
                >
                  <span className="text-xs">{inviteRole === 'viewer' ? 'Can view' : 'Can edit'}</span>
                  <ChevronDown className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                </button>
                
                {showRoleDropdown === 'invite' && (
                  <div 
                    className="absolute top-full right-0 mt-1 w-36 rounded-[12px] overflow-hidden z-10"
                    style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  >
                    <button
                      onClick={() => { setInviteRole('viewer'); setShowRoleDropdown(null); }}
                      className="w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                      style={{ color: '#1A1A1A' }}
                    >
                      Can view
                    </button>
                    <button
                      onClick={() => { setInviteRole('editor'); setShowRoleDropdown(null); }}
                      className="w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                      style={{ color: '#1A1A1A' }}
                    >
                      Can edit
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleInvite}
                disabled={!validateEmail(inviteEmail)}
                className="px-4 py-2.5 text-sm font-medium text-white rounded-[12px] transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#1A1A1A' }}
              >
                Invite
              </button>
            </div>
          </div>

          {/* General Access */}
          <div className="space-y-3">
            <label className="text-xs font-medium" style={{ color: '#1A1A1A' }}>General access</label>
            
            <div className="space-y-2">
              {/* Only those invited */}
              <button
                onClick={() => setLinkAccess('restricted')}
                className={`w-full flex items-center gap-3 p-3 rounded-[14px] transition-all ${
                  linkAccess === 'restricted' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  linkAccess === 'restricted' ? 'bg-[#1A1A1A]' : 'border-2 border-gray-300'
                }`}>
                  {linkAccess === 'restricted' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Only those invited</p>
                  <p className="text-xs" style={{ color: '#6B6B6B' }}>Only specific people can access</p>
                </div>
                <Lock className="w-4 h-4" style={{ color: '#6B6B6B' }} />
              </button>
              
              {/* Link access */}
              <button
                onClick={() => setLinkAccess('anyone')}
                className={`w-full flex items-center gap-3 p-3 rounded-[14px] transition-all ${
                  linkAccess === 'anyone' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  linkAccess === 'anyone' ? 'bg-[#1A1A1A]' : 'border-2 border-gray-300'
                }`}>
                  {linkAccess === 'anyone' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Link access</p>
                  <p className="text-xs" style={{ color: '#6B6B6B' }}>Anyone with the link can access</p>
                </div>
                <Globe className="w-4 h-4" style={{ color: '#6B6B6B' }} />
              </button>
            </div>
            
            {/* Link permission selector */}
            {linkAccess === 'anyone' && (
              <div className="flex items-center gap-3 mt-3 ml-8">
                <span className="text-xs" style={{ color: '#6B6B6B' }}>People with link can:</span>
                <button
                  onClick={() => setLinkPermission('viewer')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    linkPermission === 'viewer' ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
                  style={{ color: '#1A1A1A' }}
                >
                  View
                </button>
                <button
                  onClick={() => setLinkPermission('editor')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    linkPermission === 'editor' ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
                  style={{ color: '#1A1A1A' }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* People with Access */}
          <div className="space-y-3">
            <label className="text-xs font-medium" style={{ color: '#1A1A1A' }}>
              People with access {users.length > 0 && `(${users.length})`}
            </label>
            
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#B0B0B0' }} />
                <p className="text-sm" style={{ color: '#6B6B6B' }}>No one has access yet</p>
                <p className="text-xs mt-1" style={{ color: '#B0B0B0' }}>Invite people above to share this canvas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-[14px]"
                    style={{ background: '#F8F8F8' }}
                  >
                    {/* Avatar */}
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white"
                      style={{ background: isOwner(u.email) ? '#1A1A1A' : '#6366f1' }}
                    >
                      {(u.name?.[0] || u.email[0]).toUpperCase()}
                    </div>
                    
                    {/* Name/Email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>
                        {u.name || 'User'}
                        {u.email === currentUserEmail && <span className="text-xs font-normal ml-1" style={{ color: '#6B6B6B' }}>(you)</span>}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#6B6B6B' }}>{u.email}</p>
                    </div>
                    
                    {/* Role dropdown */}
                    {u.role !== 'owner' ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowRoleDropdown(showRoleDropdown === u.email ? null : u.email)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors hover:bg-gray-200"
                          style={{ color: '#6B6B6B' }}
                        >
                          {u.role === 'viewer' ? 'Can view' : 'Can edit'}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        
                        {showRoleDropdown === u.email && (
                          <div 
                            className="absolute right-0 mt-1 w-28 rounded-lg overflow-hidden z-10"
                            style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          >
                            <button
                              onClick={() => handleRoleChange(u.email, 'viewer')}
                              className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50"
                              style={{ color: '#1A1A1A' }}
                            >
                              Can view
                            </button>
                            <button
                              onClick={() => handleRoleChange(u.email, 'editor')}
                              className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50"
                              style={{ color: '#1A1A1A' }}
                            >
                              Can edit
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#1A1A1A', color: 'white' }}>
                        Owner
                      </span>
                    )}
                    
                    {/* Remove button */}
                    {u.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveUser(u.email)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: '#B0B0B0' }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Link sharing section */}
        <div className="px-6 py-5 border-t" style={{ borderColor: '#F2F2F2', background: '#FAFAFA' }}>
          <div className="space-y-3">
            <label className="text-xs font-medium" style={{ color: '#1A1A1A' }}>Share link</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#B0B0B0' }} />
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-[12px] outline-none"
                  style={{ 
                    background: 'white',
                    color: '#1A1A1A'
                  }}
                />
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-[12px] transition-all hover:bg-gray-200"
                style={{ background: copied ? '#22c55e' : '#1A1A1A', color: 'white' }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
