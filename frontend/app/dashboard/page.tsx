import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getLayoutedElements } from '@/lib/layoutUtils';
import { TEMPLATES } from '@/data/templates/index';

export const metadata = {
  title: 'Dashboard | ArchDraw',
  description: 'Manage your architecture diagrams and templates.',
};

const aiPrompts = [
  'E-commerce System',
  'Real-time Chat',
  'SaaS Platform',
];

export default async function DashboardPage() {
  // Pre-calculate layouted templates on the server
  const layoutedTemplates = TEMPLATES.slice(0, 5).map((template) => {
    const { nodes, edges } = getLayoutedElements(template.nodes, template.edges, 'LR');
    return {
      ...template,
      nodes,
      edges,
    };
  });

  return (
    <DashboardClient 
      templates={layoutedTemplates} 
      aiPrompts={aiPrompts} 
    />
  );
}
