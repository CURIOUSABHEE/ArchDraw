'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Server, Database, Radio, Globe, Monitor, Cpu, Brain, Shield,
  HardDrive, Box, X, Plus, Zap, Cloud, Lock, Webhook,
} from 'lucide-react';

export interface ComponentType {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  group: 'compute' | 'data' | 'infra' | 'external';
}

export const COMPONENT_TYPES: ComponentType[] = [
  // Compute group
  { id: 'service', label: 'Service', icon: Server, color: '#8b5cf6', group: 'compute' },
  { id: 'client', label: 'Client', icon: Monitor, color: '#10b981', group: 'compute' },
  { id: 'gateway', label: 'Gateway', icon: Globe, color: '#6366f1', group: 'compute' },
  { id: 'queue', label: 'Queue', icon: Radio, color: '#f59e0b', group: 'compute' },
  // Data group
  { id: 'database', label: 'Database', icon: Database, color: '#3b82f6', group: 'data' },
  { id: 'storage', label: 'Storage', icon: HardDrive, color: '#f97316', group: 'data' },
  { id: 'cache', label: 'Cache', icon: Zap, color: '#ef4444', group: 'data' },
  // Infrastructure group
  { id: 'infrastructure', label: 'Infra', icon: Cloud, color: '#64748b', group: 'infra' },
  { id: 'container', label: 'Container', icon: Box, color: '#0891b2', group: 'infra' },
  // External group
  { id: 'ai-ml', label: 'AI / ML', icon: Brain, color: '#ec4899', group: 'external' },
  { id: 'security', label: 'Security', icon: Shield, color: '#ef4444', group: 'external' },
  { id: 'other', label: 'Other', icon: Webhook, color: '#6366f1', group: 'external' },
];

const TYPE_GROUPS = {
  compute: { label: 'Compute', types: COMPONENT_TYPES.filter(t => t.group === 'compute') },
  data: { label: 'Data', types: COMPONENT_TYPES.filter(t => t.group === 'data') },
  infra: { label: 'Infra', types: COMPONENT_TYPES.filter(t => t.group === 'infra') },
  external: { label: 'External', types: COMPONENT_TYPES.filter(t => t.group === 'external') },
};

export interface CreateComponentData {
  name: string;
  type: string;
  description: string;
}

export interface ComponentToEdit {
  id: string;
  label: string;
  category: string;
  description?: string;
}

interface CreateComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateComponentData) => void;
  onUpdate?: (id: string, data: CreateComponentData) => void;
  existingNames: string[];
  editComponent?: ComponentToEdit | null;
}

export function CreateComponentModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  existingNames,
  editComponent,
}: CreateComponentModalProps) {
  const [modalKey, setModalKey] = useState(0);

  if (!isOpen) return null;

  const isEditing = !!editComponent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Lightweight backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in-0 zoom-in-95 duration-200 scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {isEditing ? 'Edit Component' : 'New Component'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <ModalContent
          key={modalKey}
          existingNames={existingNames}
          editComponent={editComponent}
          onCreate={(data) => {
            onCreate(data);
            onClose();
          }}
          onUpdate={(data) => {
            if (editComponent && onUpdate) {
              onUpdate(editComponent.id, data);
              onClose();
            }
          }}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

interface ModalContentProps {
  onClose: () => void;
  onCreate: (data: CreateComponentData) => void;
  onUpdate: (data: CreateComponentData) => void;
  existingNames: string[];
  editComponent?: ComponentToEdit | null;
}

function ModalContent({ onClose, onCreate, onUpdate, existingNames, editComponent }: ModalContentProps) {
  const isEditing = !!editComponent;
  const typeFromCategory = COMPONENT_TYPES.find(t => t.label.toLowerCase() === editComponent?.category?.toLowerCase());
  
  const [name, setName] = useState(editComponent?.label || '');
  const [selectedType, setSelectedType] = useState<string | null>(typeFromCategory?.id || null);
  const [description, setDescription] = useState(editComponent?.description || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  const selectedTypeData = COMPONENT_TYPES.find(t => t.id === selectedType);

  const validateName = (value: string): string | null => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Min 2 characters';
    const lowerName = value.trim().toLowerCase();
    const namesToCheck = existingNames.filter(n => {
      if (isEditing && editComponent) {
        return n !== editComponent.label.toLowerCase();
      }
      return true;
    });
    if (namesToCheck.includes(lowerName)) return 'Name already exists';
    return null;
  };

  const handleSubmit = () => {
    const error = validateName(name);
    if (error) {
      setNameError(error);
      nameInputRef.current?.focus();
      return;
    }
    if (!selectedType) {
      return;
    }

    setIsCreating(true);
    setTimeout(() => {
      const data = {
        name: name.trim(),
        type: selectedType,
        description: description.trim(),
      };
      
      if (isEditing) {
        onUpdate(data);
      } else {
        onCreate(data);
        // Dispatch event to notify other components (like CommandPalette) to refresh
        window.dispatchEvent(new CustomEvent('custom-component-added'));
      }
      
      setIsCreating(false);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const isValid = name.trim().length >= 2 && selectedType !== null;

  return (
    <div className="p-5 space-y-5" onKeyDown={handleKeyDown}>
      {/* Name Input - Primary Focus */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Name
          </label>
          {selectedTypeData && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <selectedTypeData.icon
                className="w-3 h-3"
                style={{ color: selectedTypeData.color }}
              />
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                {selectedTypeData.label}
              </span>
            </div>
          )}
        </div>
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(validateName(e.target.value));
          }}
          placeholder="Auth Service, API Gateway, Payment…"
          className={`w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 outline-none transition-all ${nameError
            ? 'border-red-400 focus:border-red-500'
            : 'border-transparent focus:border-indigo-500'
            }`}
        />
        {nameError && (
          <p className="text-xs text-red-500 mt-1">{nameError}</p>
        )}
      </div>

      {/* Type Selection - Flat Compact Grid */}
      <div className="space-y-2 shrink-0">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Type
        </label>

        <div className="grid grid-cols-4 gap-2">
          {COMPONENT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`group relative flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border-2 transition-all ${isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                  }`}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: isSelected ? `${type.color}25` : `${type.color}15`,
                    border: `1px solid ${type.color}40`,
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: type.color }}
                    strokeWidth={0.1}
                  />
                </div>
                <span className={`text-[11px] font-medium text-center ${isSelected
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-zinc-600 dark:text-zinc-400'
                  }`}>
                  {type.label}
                </span>
                {isSelected && (
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900"
                    style={{ backgroundColor: type.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description - Optional */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Description
          </label>
          <span className="text-[10px] text-zinc-400">
            Optional
          </span>
        </div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 80))}
          placeholder="What does this component do?"
          maxLength={80}
          className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent outline-none focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors"
        />
        <div className="flex justify-end">
          <span className="text-[10px] text-zinc-400">{description.length}/80</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid || isCreating}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${isValid && !isCreating
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
            }`}
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEditing ? 'Saving…' : 'Creating…'}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {isEditing ? 'Save' : 'Create'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
