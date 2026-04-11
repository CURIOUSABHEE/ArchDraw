'use client';

import { useState, useEffect } from 'react';

interface DiagramTitleProps {
  title?: string;
  subtitle?: string;
  onTitleChange?: (title: string) => void;
}

export function DiagramTitle({ 
  title: initialTitle, 
  subtitle: initialSubtitle,
  onTitleChange 
}: DiagramTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle || 'Architecture Diagram');
  const [subtitle, setSubtitle] = useState(initialSubtitle || '');

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (onTitleChange) {
      onTitleChange(title);
    }
  };

  if (!isEditing) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-auto">
        <h1 
          className="text-[20px] font-semibold text-[#111118] cursor-pointer hover:text-[#6366F1] transition-colors"
          onClick={() => setIsEditing(true)}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px] text-[#9CA3AF] mt-1">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-auto">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleTitleSubmit();
          if (e.key === 'Escape') {
            setTitle(initialTitle || 'Architecture Diagram');
            setIsEditing(false);
          }
        }}
        autoFocus
        className="text-[20px] font-semibold text-[#111118] bg-white border border-[#E5E7EB] rounded-lg px-3 py-1 outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 text-center"
        style={{ minWidth: 200 }}
      />
    </div>
  );
}
