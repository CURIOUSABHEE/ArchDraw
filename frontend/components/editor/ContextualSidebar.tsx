'use client';

import { useMemo } from 'react';
import { X, ExternalLink, BookOpen, Lightbulb, Link2, Check, XCircle, ChevronDown, ChevronRight, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDiagramStore } from '@/store/diagramStore';
import { getComponentKnowledge, getRelatedExplanation, type ComponentKnowledge, type LearningResource, type BestPractices } from '@/lib/knowledge/componentKnowledge';
import { useState } from 'react';

interface ContextualSidebarProps {
  nodeId: string | null;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function Section({ title, icon, defaultExpanded = false, children }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-4 h-4">{icon}</span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ResourceLink({ resource }: { resource: LearningResource }) {
  const icons = {
    documentation: <BookOpen className="w-4 h-4" />,
    video: <Play className="w-4 h-4" />,
    article: <FileText className="w-4 h-4" />,
    code: <Code className="w-4 h-4" />,
    course: <GraduationCap className="w-4 h-4" />
  };
  
  const colors = {
    beginner: 'bg-green-500/10 text-green-600 dark:text-green-400',
    intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    advanced: 'bg-red-500/10 text-red-600 dark:text-red-400'
  };
  
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <span className="text-muted-foreground mt-0.5">{icons[resource.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{resource.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-1.5 py-0.5 rounded ${colors[resource.difficulty]}`}>{resource.difficulty}</span>
          <span className="text-xs text-muted-foreground">{resource.estimatedTime}</span>
        </div>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function Code({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function GraduationCap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10v6M2 10l10-5 10 5-10-5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function BestPracticesContent({ best }: { best: BestPractices }) {
  return (
    <div className="space-y-4">
      {best.dos && best.dos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">DO</span>
          </div>
          <ul className="space-y-1.5">
            {best.dos.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {best.donts && best.donts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">DON'T</span>
          </div>
          <ul className="space-y-1.5">
            {best.donts.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {best.performance && best.performance.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">PERFORMANCE</span>
          </div>
          <ul className="space-y-1.5">
            {best.performance.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ContextualSidebar({ nodeId, onClose }: ContextualSidebarProps) {
  const { nodes, edges } = useDiagramStore();
  
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === nodeId);
  }, [nodes, nodeId]);
  
  const knowledge = useMemo(() => {
    if (!selectedNode) return null;
    const category = selectedNode.data?.category || selectedNode.data?.layer || 'default';
    return getComponentKnowledge(category);
  }, [selectedNode]);
  
  const { upstream, downstream } = useMemo(() => {
    if (!nodeId) return { upstream: [], downstream: [] };
    
    const upstreamNodes: string[] = [];
    const downstreamNodes: string[] = [];
    
    edges.forEach(edge => {
      if (edge.target === nodeId && edge.source) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode) upstreamNodes.push(sourceNode.data?.label || edge.source);
      }
      if (edge.source === nodeId && edge.target) {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode) downstreamNodes.push(targetNode.data?.label || edge.target);
      }
    });
    
    return { upstream: upstreamNodes, downstream: downstreamNodes };
  }, [nodeId, edges, nodes]);
  
  if (!nodeId || !selectedNode) return null;
  
  const nodeLabel = selectedNode.data?.label || 'Unknown Node';
  const nodeCategory = selectedNode.data?.category || selectedNode.data?.layer || 'default';
  
  const roleExplanation = knowledge 
    ? getRelatedExplanation(nodeLabel, nodeCategory, upstream, downstream)
    : `A component in your architecture.`;

  return (
    <div className="w-80 h-full border-l border-border bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Node Info</h3>
            <p className="text-xs text-muted-foreground">Educational context</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Node Name */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-lg">{nodeLabel}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">
            {nodeCategory}
          </span>
          <span className="text-xs text-muted-foreground">
            {upstream.length + downstream.length} connections
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Role in Architecture */}
        <Section 
          title="Role in Architecture" 
          icon={<Link2 className="w-4 h-4" />}
          defaultExpanded={true}
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {roleExplanation}
            </p>
            
            {upstream.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Receives from: </span>
                <span className="font-medium">{upstream.join(', ')}</span>
              </div>
            )}
            
            {downstream.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Routes to: </span>
                <span className="font-medium">{downstream.join(', ')}</span>
              </div>
            )}
          </div>
        </Section>
        
        {/* Component Overview */}
        {knowledge && (
          <Section 
            title="Overview" 
            icon={<BookOpen className="w-4 h-4" />}
            defaultExpanded={true}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              {knowledge.overview}
            </p>
          </Section>
        )}
        
        {/* Best Practices */}
        {knowledge && knowledge.bestPractices && (
          <Section 
            title="Best Practices" 
            icon={<Lightbulb className="w-4 h-4" />}
          >
            <BestPracticesContent best={knowledge.bestPractices} />
          </Section>
        )}
        
        {/* Learning Resources */}
        {knowledge && knowledge.learningResources && knowledge.learningResources.length > 0 && (
          <Section 
            title="Learning Resources" 
            icon={<BookOpen className="w-4 h-4" />}
          >
            <div className="space-y-1">
              {knowledge.learningResources.slice(0, 4).map((resource, i) => (
                <ResourceLink key={i} resource={resource} />
              ))}
              {knowledge.learningResources.length > 4 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  +{knowledge.learningResources.length - 4} more resources
                </p>
              )}
            </div>
          </Section>
        )}
        
        {/* Related Concepts */}
        {knowledge && knowledge.relatedConcepts && knowledge.relatedConcepts.length > 0 && (
          <Section 
            title="Related Concepts" 
            icon={<Link2 className="w-4 h-4" />}
          >
            <div className="flex flex-wrap gap-1.5">
              {knowledge.relatedConcepts.map((concept, i) => (
                <span 
                  key={i} 
                  className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                >
                  {concept}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full" size="sm">
          Delete Node
        </Button>
      </div>
    </div>
  );
}