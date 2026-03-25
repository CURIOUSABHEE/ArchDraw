'use client';

import { useEffect, useRef } from 'react';
import {
  Server, Zap, Boxes, Box, Database, Leaf, HardDrive,
  Layers, MessageSquare, Radio, Activity, Shield,
  Brain, GitMerge, Cpu, Link,
  Webhook, Globe, Scale, RadioTower,
  Container, Gauge,
  Search,
  type LucideIcon,
} from 'lucide-react';

const CircleDot = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
);

const canvasNodes: { label: string; icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>; color: string }[] = [
  { label: 'API Gateway',    icon: Webhook,     color: '#6366f1' },
  { label: 'Load Balancer',  icon: Scale,       color: '#6366f1' },
  { label: 'CDN',            icon: RadioTower,  color: '#6366f1' },
  { label: 'LLM API',        icon: Brain,       color: '#ec4899' },
  { label: 'Vector DB',      icon: Cpu,         color: '#ec4899' },
  { label: 'RAG Pipeline',   icon: GitMerge,    color: '#ec4899' },
  { label: 'SQL Database',   icon: Database,    color: '#3b82f6' },
  { label: 'Redis Cache',    icon: Gauge,       color: '#ef4444' },
  { label: 'Message Queue',  icon: MessageSquare, color: '#f59e0b' },
  { label: 'Microservice',   icon: Boxes,        color: '#3b82f6' },
  { label: 'Auth Service',   icon: Shield,       color: '#6366f1' },
  { label: 'Event Bus',      icon: Radio,        color: '#f59e0b' },
  { label: 'Search Engine', icon: Search,       color: '#10b981' },
  { label: 'Object Storage', icon: HardDrive,   color: '#64748b' },
  { label: 'Container',      icon: Container,   color: '#3b82f6' },
  { label: 'Serverless',     icon: Zap,          color: '#f59e0b' },
  { label: 'Monolith',       icon: Server,       color: '#64748b' },
  { label: 'GraphQL API',    icon: Link,         color: '#ec4899' },
  { label: 'REST API',       icon: Globe,        color: '#6366f1' },
  { label: 'WebSocket',      icon: Activity,     color: '#10b981' },
  { label: 'Kubernetes',     icon: CircleDot,    color: '#326CE5' },
  { label: 'Docker',         icon: Box,          color: '#2496ED' },
  { label: 'AWS Lambda',     icon: Zap,          color: '#FF9900' },
  { label: 'AWS S3',         icon: HardDrive,   color: '#3F8624' },
  { label: 'AWS RDS',        icon: Database,    color: '#3B48CC' },
  { label: 'DynamoDB',       icon: Layers,      color: '#3B48CC' },
  { label: 'Kafka',          icon: Activity,    color: '#231F20' },
  { label: 'RabbitMQ',       icon: MessageSquare, color: '#FF6600' },
  { label: 'MongoDB',        icon: Leaf,        color: '#47A248' },
  { label: 'PostgreSQL',     icon: Database,    color: '#336791' },
  { label: 'Redis',          icon: Gauge,       color: '#DC382D' },
  { label: 'Elasticsearch',  icon: Search,      color: '#FEC514' },
];

interface RibbonNodeProps {
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  initialX: number;
  initialY: number;
  initialScale: number;
}

function RibbonNode({ icon: Icon, color, initialX, initialY, initialScale }: RibbonNodeProps) {
  return (
    <div
      className="snake-node"
      style={{
        position: 'absolute',
        left: initialX,
        top: initialY,
        transform: `translate(-50%, -50%) scale(${initialScale})`,
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: color + '18',
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon style={{ width: 14, height: 14, color, strokeWidth: 1.75 }} />
      </div>
    </div>
  );
}

export function IntegrationsRibbon() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const spacing = 72;
  const amplitude = 35;
  const wavelength = 600;
  const centerY = 100;
  
  const initialPositions = canvasNodes.map((_, i) => {
    const x = i * spacing;
    const y = centerY + Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
    const scale = 0.85 + 0.15 * ((y - (centerY - amplitude)) / (amplitude * 2));
    return { 
      x: Math.round(x * 100) / 100, 
      y: Math.round(y * 100) / 100, 
      scale: Math.round(scale * 1000) / 1000 
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const nodeEls = container.querySelectorAll<HTMLElement>('.snake-node');
    const count = nodeEls.length;
    let containerWidth = container.offsetWidth;
    const totalW = containerWidth + count * spacing;
    
    interface Position {
      x: number;
      el: HTMLElement;
    }
    
    const positions: Position[] = Array.from(nodeEls).map((el, i) => ({
      x: i * spacing,
      el,
    }));

    let offset = 0;
    let paused = false;
    let animFrameId: number;

    container.addEventListener('mouseenter', () => { paused = true; });
    container.addEventListener('mouseleave', () => { paused = false; });

    const animate = () => {
      if (!paused) {
        offset += 0.5;
      }

      positions.forEach((p) => {
        let x = (p.x - offset + totalW * 10) % totalW - spacing;
        
        if (x < -100) {
          x += totalW;
          p.x += totalW;
        }
        
        const y = centerY + Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
        const scale = 0.85 + 0.15 * ((y - (centerY - amplitude)) / (amplitude * 2));
        
        p.el.style.left = x + 'px';
        p.el.style.top = y + 'px';
        p.el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      });

      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      containerWidth = container.offsetWidth;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [spacing, amplitude, wavelength, centerY]);

  return (
    <div 
      style={{
        position: 'relative',
        paddingTop: 24,
        paddingBottom: 8,
        backgroundColor: '#080c14',
      }}
    >
      <p style={{
        textAlign: 'center',
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(100,116,139,0.6)',
        marginBottom: 16,
      }}>
        Works with your entire stack
      </p>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 200,
          overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      >
        {canvasNodes.map((node, i) => (
          <RibbonNode
            key={`${node.label}-${i}`}
            icon={node.icon}
            color={node.color}
            initialX={initialPositions[i].x}
            initialY={initialPositions[i].y}
            initialScale={initialPositions[i].scale}
          />
        ))}
      </div>
    </div>
  );
}
