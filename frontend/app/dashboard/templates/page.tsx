'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { TEMPLATES } from '@/data/templates';

function TemplateCard({
  name,
  description,
  icon,
  tags,
  onClick,
}: {
  name: string;
  description: string;
  icon: string;
  tags: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-5 rounded-[20px] text-left transition-all duration-200 hover:scale-[1.02]"
      style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {icon}
        </div>
      </div>
      <h3 className="font-semibold text-[#1A1A1A] text-lg mb-2">{name}</h3>
      <p className="text-sm mb-3 line-clamp-2" style={{ color: '#6B6B6B' }}>{description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-[6px] text-xs"
            style={{ background: '#F2F2F2', color: '#6B6B6B' }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1 text-sm font-medium" style={{ color: '#6366f1' }}>
        Use Template <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const { initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center" style={{ background: '#F4F4F4' }}>
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleUseTemplate = (templateId: string) => {
    router.push(`/editor?template=${templateId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">Architecture Templates</h2>
        <p className="text-lg" style={{ color: '#6B6B6B' }}>Start with pre-built system architectures for common use cases</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            name={template.name}
            description={template.description}
            icon={template.icon}
            tags={template.tags}
            onClick={() => handleUseTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  );
}
