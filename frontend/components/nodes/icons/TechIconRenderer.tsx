'use client';

import React from 'react';

interface TechIconRendererProps {
  tech: string;
  size?: number;
  tierColor?: string;
}

function GenericCodeIcon({ size, color }: { size: number; color: string }) {
  const cx = size / 2;
  const cy = size / 2;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path
        d={`M ${cx - 8} ${cy - 4} L ${cx - 12} ${cy} L ${cx - 8} ${cy + 4}`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${cx + 8} ${cy - 4} L ${cx + 12} ${cy} L ${cx + 8} ${cy + 4}`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1={cx - 6}
        y1={cy}
        x2={cx + 6}
        y2={cy}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function PostgreSIcon({ size }: { size: number }) {
  const color = '#336791';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <ellipse cx={size / 2} cy={size * 0.3} rx={size * 0.35} ry={size * 0.15} fill={color} />
      <path d={`M ${size * 0.15} ${size * 0.3} L ${size * 0.15} ${size * 0.75} A ${size * 0.35} ${size * 0.15} 0 0 0 ${size * 0.85} ${size * 0.75} L ${size * 0.85} ${size * 0.3}`} fill={color} />
      <ellipse cx={size / 2} cy={size * 0.52} rx={size * 0.32} ry={size * 0.06} fill="#fff" fillOpacity={0.3} />
      <text x={size / 2} y={size * 0.62} textAnchor="middle" fontSize={size * 0.2} fontWeight="bold" fill="#fff">P</text>
    </svg>
  );
}

function MySQLIcon({ size }: { size: number }) {
  const color = '#F29111';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size * 0.5} ${size * 0.15} Q ${size * 0.2} ${size * 0.3} ${size * 0.3} ${size * 0.5} Q ${size * 0.2} ${size * 0.4} ${size * 0.2} ${size * 0.7} Q ${size * 0.5} ${size * 0.8} ${size * 0.5} ${size * 0.85} Q ${size * 0.8} ${size * 0.4} ${size * 0.8} ${size * 0.5} Q ${size * 0.7} ${size * 0.3} ${size * 0.5} ${size * 0.15}`} fill={color} />
      <text x={size / 2} y={size * 0.58} textAnchor="middle" fontSize={size * 0.22} fontWeight="bold" fill="#fff">DB</text>
    </svg>
  );
}

function MongoDBIcon({ size }: { size: number }) {
  const color = '#47A248';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size * 0.5} ${size * 0.12} L ${size * 0.85} ${size * 0.25} L ${size * 0.85} ${size * 0.6} L ${size * 0.5} ${size * 0.88} L ${size * 0.15} ${size * 0.6} L ${size * 0.15} ${size * 0.25} Z`} fill={color} />
      <path d={`M ${size * 0.5} ${size * 0.25} L ${size * 0.5} ${size * 0.75}`} stroke="#fff" strokeWidth={2} strokeOpacity={0.5} />
      <path d={`M ${size * 0.3} ${size * 0.45} L ${size * 0.7} ${size * 0.45}`} stroke="#fff" strokeWidth={2} strokeOpacity={0.5} />
    </svg>
  );
}

function RedisIcon({ size }: { size: number }) {
  const color = '#DC382D';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={`${size * 0.5},${size * 0.1} ${size * 0.9},${size * 0.5} ${size * 0.5},${size * 0.9} ${size * 0.1},${size * 0.5}`} fill={color} />
      <polygon points={`${size * 0.5},${size * 0.25} ${size * 0.75},${size * 0.5} ${size * 0.5},${size * 0.75} ${size * 0.25},${size * 0.5}`} fill="#fff" fillOpacity={0.3} />
    </svg>
  );
}

function ElasticsearchIcon({ size }: { size: number }) {
  const color = '#FEC514';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.35} rx={2} fill={color} />
      <rect x={size * 0.35} y={size * 0.15} width={size * 0.3} height={size * 0.35} rx={2} fill={color} fillOpacity={0.8} />
      <rect x={size * 0.35} y={size * 0.55} width={size * 0.3} height={size * 0.35} rx={2} fill={color} fillOpacity={0.6} />
    </svg>
  );
}

function KafkaIcon({ size }: { size: number }) {
  const color = '#231F20';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.15} y={size * 0.2} width={size * 0.7} height={size * 0.15} rx={2} fill={color} />
      <rect x={size * 0.15} y={size * 0.4} width={size * 0.7} height={size * 0.15} rx={2} fill={color} />
      <rect x={size * 0.15} y={size * 0.6} width={size * 0.7} height={size * 0.15} rx={2} fill={color} />
      <circle cx={size * 0.25} cy={size * 0.27} r={size * 0.06} fill="#fff" />
      <circle cx={size * 0.25} cy={size * 0.47} r={size * 0.06} fill="#fff" />
      <circle cx={size * 0.25} cy={size * 0.67} r={size * 0.06} fill="#fff" />
      <circle cx={size * 0.75} cy={size * 0.27} r={size * 0.06} fill="#fff" />
      <circle cx={size * 0.75} cy={size * 0.47} r={size * 0.06} fill="#fff" />
      <circle cx={size * 0.75} cy={size * 0.67} r={size * 0.06} fill="#fff" />
    </svg>
  );
}

function RabbitMQIcon({ size }: { size: number }) {
  const color = '#FF6600';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.35} ry={size * 0.3} fill={color} />
      <ellipse cx={size * 0.35} cy={size * 0.25} rx={size * 0.08} ry={size * 0.2} fill={color} />
      <ellipse cx={size * 0.5} cy={size * 0.18} rx={size * 0.08} ry={size * 0.18} fill={color} />
      <ellipse cx={size * 0.65} cy={size * 0.25} rx={size * 0.08} ry={size * 0.2} fill={color} />
    </svg>
  );
}

function SqsIcon({ size }: { size: number }) {
  const color = '#9B59B6';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.15} y={size * 0.3} width={size * 0.7} height={size * 0.4} rx={4} fill={color} />
      <rect x={size * 0.25} y={size * 0.4} width={size * 0.2} height={size * 0.08} rx={2} fill="#fff" fillOpacity={0.8} />
      <rect x={size * 0.55} y={size * 0.4} width={size * 0.2} height={size * 0.08} rx={2} fill="#fff" fillOpacity={0.8} />
      <rect x={size * 0.25} y={size * 0.55} width={size * 0.2} height={size * 0.08} rx={2} fill="#fff" fillOpacity={0.8} />
    </svg>
  );
}

function ReactIcon({ size }: { size: number }) {
  const color = '#61DAFB';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.12} fill="none" stroke={color} strokeWidth={1.5} />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.35} ry={size * 0.15} fill="none" stroke={color} strokeWidth={1.5} transform={`rotate(${60} ${size / 2} ${size / 2})`} />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.35} ry={size * 0.15} fill="none" stroke={color} strokeWidth={1.5} transform={`rotate(${-60} ${size / 2} ${size / 2})`} />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.35} ry={size * 0.15} fill="none" stroke={color} strokeWidth={1.5} transform={`rotate(${180} ${size / 2} ${size / 2})`} />
    </svg>
  );
}

function NextJSIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={`${size * 0.5},${size * 0.1} ${size * 0.9},${size * 0.75} ${size * 0.1},${size * 0.75}`} fill="#000" />
      <polygon points={`${size * 0.5},${size * 0.25} ${size * 0.75},${size * 0.65} ${size * 0.25},${size * 0.65}`} fill="#fff" />
    </svg>
  );
}

function NodeJSIcon({ size }: { size: number }) {
  const color = '#339933';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={`${size * 0.5},${size * 0.1} ${size * 0.9},${size * 0.4} ${size * 0.5},${size * 0.9} ${size * 0.1},${size * 0.4}`} fill={color} />
      <text x={size / 2} y={size * 0.62} textAnchor="middle" fontSize={size * 0.3} fontWeight="bold" fill="#fff">N</text>
    </svg>
  );
}

function TypeScriptIcon({ size }: { size: number }) {
  const color = '#3178C6';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.1} y={size * 0.1} width={size * 0.8} height={size * 0.8} rx={4} fill={color} />
      <text x={size / 2} y={size * 0.62} textAnchor="middle" fontSize={size * 0.28} fontWeight="bold" fill="#fff">TS</text>
    </svg>
  );
}

function JavaScriptIcon({ size }: { size: number }) {
  const color = '#F7DF1E';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.1} y={size * 0.1} width={size * 0.8} height={size * 0.8} rx={4} fill={color} />
      <text x={size / 2} y={size * 0.62} textAnchor="middle" fontSize={size * 0.28} fontWeight="bold" fill="#000">JS</text>
    </svg>
  );
}

function PythonIcon({ size }: { size: number }) {
  const blue = '#3776AB';
  const yellow = '#FFD43B';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={`${size * 0.5},${size * 0.1} ${size * 0.85},${size * 0.75} ${size * 0.15},${size * 0.75}`} fill={blue} />
      <polygon points={`${size * 0.5},${size * 0.25} ${size * 0.72},${size * 0.7} ${size * 0.28},${size * 0.7}`} fill={yellow} />
    </svg>
  );
}

function GolangIcon({ size }: { size: number }) {
  const color = '#00ADD8';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size * 0.5} ${size * 0.15} L ${size * 0.8} ${size * 0.35} L ${size * 0.8} ${size * 0.5} L ${size * 0.5} ${size * 0.65} L ${size * 0.2} ${size * 0.5} L ${size * 0.2} ${size * 0.35} Z`} fill={color} />
      <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.12} fill="#fff" />
    </svg>
  );
}

function DockerIcon({ size }: { size: number }) {
  const color = '#2496ED';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size * 0.5} ${size * 0.15} Q ${size * 0.85} ${size * 0.35} ${size * 0.85} ${size * 0.55} Q ${size * 0.7} ${size * 0.8} ${size * 0.5} ${size * 0.85} Q ${size * 0.3} ${size * 0.8} ${size * 0.15} ${size * 0.55} Q ${size * 0.15} ${size * 0.35} ${size * 0.5} ${size * 0.15}`} fill={color} />
      <rect x={size * 0.35} y={size * 0.35} width={size * 0.15} height={size * 0.12} rx={1} fill="#fff" fillOpacity={0.8} />
      <rect x={size * 0.55} y={size * 0.35} width={size * 0.15} height={size * 0.12} rx={1} fill="#fff" fillOpacity={0.8} />
      <rect x={size * 0.35} y={size * 0.52} width={size * 0.15} height={size * 0.12} rx={1} fill="#fff" fillOpacity={0.8} />
    </svg>
  );
}

function KubernetesIcon({ size }: { size: number }) {
  const color = '#326CE5';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={size * 0.4} fill="none" stroke={color} strokeWidth={3} />
      <circle cx={size / 2} cy={size * 0.2} r={size * 0.08} fill={color} />
      <circle cx={size * 0.78} cy={size * 0.35} r={size * 0.08} fill={color} />
      <circle cx={size * 0.78} cy={size * 0.65} r={size * 0.08} fill={color} />
      <circle cx={size * 0.5} cy={size * 0.8} r={size * 0.08} fill={color} />
      <circle cx={size * 0.22} cy={size * 0.65} r={size * 0.08} fill={color} />
      <circle cx={size * 0.22} cy={size * 0.35} r={size * 0.08} fill={color} />
    </svg>
  );
}

function AwsIcon({ size }: { size: number }) {
  const color = '#FF9900';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size * 0.5} ${size * 0.85} Q ${size * 0.85} ${size * 0.6} ${size * 0.85} ${size * 0.35} Q ${size * 0.5} ${size * 0.15} ${size * 0.15} ${size * 0.35}`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

function NginxIcon({ size }: { size: number }) {
  const color = '#009639';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={size * 0.4} fill={color} />
      <line x1={size * 0.2} y1={size / 2} x2={size * 0.8} y2={size / 2} stroke="#fff" strokeWidth={3} />
      <line x1={size / 2} y1={size * 0.2} x2={size / 2} y2={size * 0.8} stroke="#fff" strokeWidth={3} />
    </svg>
  );
}

function GrafanaIcon({ size }: { size: number }) {
  const color = '#F46800';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={size * 0.4} fill={color} />
      <circle cx={size / 2} cy={size / 2} r={size * 0.2} fill="#fff" fillOpacity={0.3} />
    </svg>
  );
}

function PrometheusIcon({ size }: { size: number }) {
  const color = '#E6522C';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size * 0.5} ${size * 0.15} L ${size * 0.7} ${size * 0.3} L ${size * 0.7} ${size * 0.5} L ${size * 0.5} ${size * 0.65} L ${size * 0.3} ${size * 0.5} L ${size * 0.3} ${size * 0.3} Z`} fill={color} />
    </svg>
  );
}

function VueIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={`${size * 0.5},${size * 0.1} ${size * 0.9},${size * 0.9} ${size * 0.1},${size * 0.9}`} fill="#42B883" />
      <polygon points={`${size * 0.5},${size * 0.3} ${size * 0.75},${size * 0.8} ${size * 0.25},${size * 0.8}`} fill="#35495E" />
    </svg>
  );
}

function DjangoIcon({ size }: { size: number }) {
  const color = '#092E20';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size * 0.5} ${size * 0.15} L ${size * 0.85} ${size * 0.5} L ${size * 0.5} ${size * 0.85} L ${size * 0.15} ${size * 0.5} Z`} fill={color} />
      <text x={size / 2} y={size * 0.58} textAnchor="middle" fontSize={size * 0.22} fontWeight="bold" fill="#fff">D</text>
    </svg>
  );
}

function FastAPIIcon({ size }: { size: number }) {
  const color = '#009688';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={`${size * 0.2},${size * 0.85} ${size * 0.5},${size * 0.15} ${size * 0.8},${size * 0.85}`} fill={color} />
      <polygon points={`${size * 0.35},${size * 0.65} ${size * 0.5},${size * 0.35} ${size * 0.65},${size * 0.65}`} fill="#fff" fillOpacity={0.4} />
    </svg>
  );
}

function SpringIcon({ size }: { size: number }) {
  const color = '#6DB33F';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <ellipse cx={size / 2} cy={size / 2} rx={size * 0.38} ry={size * 0.25} fill={color} />
      <ellipse cx={size / 2} cy={size * 0.35} rx={size * 0.25} ry={size * 0.12} fill={color} />
    </svg>
  );
}

function AwsLambdaIcon({ size }: { size: number }) {
  const color = '#FF9900';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size * 0.2} ${size * 0.7} L ${size * 0.4} ${size * 0.7} L ${size * 0.5} ${size * 0.3} L ${size * 0.6} ${size * 0.7} L ${size * 0.8} ${size * 0.7}`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DatabaseIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <ellipse cx={size / 2} cy={size * 0.25} rx={size * 0.4} ry={size * 0.15} fill={color} />
      <path d={`M ${size * 0.1} ${size * 0.25} L ${size * 0.1} ${size * 0.75} A ${size * 0.4} ${size * 0.15} 0 0 0 ${size * 0.9} ${size * 0.75} L ${size * 0.9} ${size * 0.25}`} fill={color} fillOpacity={0.8} />
      <ellipse cx={size / 2} cy={size * 0.5} rx={size * 0.38} ry={size * 0.08} fill="#fff" fillOpacity={0.3} />
    </svg>
  );
}

function QueueIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.15} y={size * 0.35} width={size * 0.7} height={size * 0.12} rx={3} fill={color} />
      <rect x={size * 0.15} y={size * 0.52} width={size * 0.7} height={size * 0.12} rx={3} fill={color} fillOpacity={0.8} />
      <rect x={size * 0.15} y={size * 0.69} width={size * 0.7} height={size * 0.12} rx={3} fill={color} fillOpacity={0.6} />
    </svg>
  );
}

function CacheIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={`${size / 2},${size * 0.15} ${size * 0.85},${size / 2} ${size / 2},${size * 0.85} ${size * 0.15},${size / 2}`} fill={color} />
      <polygon points={`${size / 2},${size * 0.3} ${size * 0.7},${size / 2} ${size / 2},${size * 0.7} ${size * 0.3},${size / 2}`} fill="#fff" fillOpacity={0.3} />
    </svg>
  );
}

function WorkerIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size * 0.35} r={size * 0.18} fill={color} />
      <path d={`M ${size * 0.2} ${size * 0.85} Q ${size * 0.2} ${size * 0.55} ${size / 2} ${size * 0.55} Q ${size * 0.8} ${size * 0.55} ${size * 0.8} ${size * 0.85}`} fill={color} />
    </svg>
  );
}

function GatewayIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.15} y={size * 0.15} width={size * 0.3} height={size * 0.7} rx={4} fill={color} />
      <rect x={size * 0.55} y={size * 0.15} width={size * 0.3} height={size * 0.7} rx={4} fill={color} fillOpacity={0.7} />
      <line x1={size * 0.45} y1={size * 0.35} x2={size * 0.55} y2={size * 0.35} stroke={color} strokeWidth={2} />
      <line x1={size * 0.45} y1={size / 2} x2={size * 0.55} y2={size / 2} stroke={color} strokeWidth={2} />
      <line x1={size * 0.45} y1={size * 0.65} x2={size * 0.55} y2={size * 0.65} stroke={color} strokeWidth={2} />
    </svg>
  );
}

function LoadBalancerIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size * 0.2} cy={size / 2} r={size * 0.12} fill={color} />
      <circle cx={size * 0.8} cy={size * 0.3} r={size * 0.1} fill={color} />
      <circle cx={size * 0.8} cy={size * 0.7} r={size * 0.1} fill={color} />
      <line x1={size * 0.32} y1={size * 0.45} x2={size * 0.7} y2={size * 0.32} stroke={color} strokeWidth={2} />
      <line x1={size * 0.32} y1={size * 0.55} x2={size * 0.7} y2={size * 0.68} stroke={color} strokeWidth={2} />
    </svg>
  );
}

function AuthIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.2} y={size * 0.3} width={size * 0.6} height={size * 0.5} rx={4} fill={color} />
      <path d={`M ${size * 0.35} ${size * 0.3} L ${size * 0.35} ${size * 0.2} A ${size * 0.15} ${size * 0.15} 0 0 1 ${size * 0.65} ${size * 0.2} L ${size * 0.65} ${size * 0.3}`} fill="none" stroke={color} strokeWidth={3} />
      <circle cx={size / 2} cy={size * 0.52} r={size * 0.1} fill="#fff" />
    </svg>
  );
}

function FirewallIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${size / 2} ${size * 0.15} L ${size * 0.85} ${size * 0.35} L ${size * 0.85} ${size * 0.65} L ${size / 2} ${size * 0.85} L ${size * 0.15} ${size * 0.65} L ${size * 0.15} ${size * 0.35} Z`} fill={color} />
      <rect x={size * 0.35} y={size * 0.45} width={size * 0.3} height={size * 0.15} rx={2} fill="#fff" fillOpacity={0.4} />
    </svg>
  );
}

function MonitoringIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.15} y={size * 0.35} width={size * 0.7} height={size * 0.5} rx={3} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />
      <rect x={size * 0.25} y={size * 0.45} width={size * 0.15} height={size * 0.25} rx={1} fill={color} />
      <rect x={size * 0.45} y={size * 0.55} width={size * 0.15} height={size * 0.15} rx={1} fill={color} />
      <rect x={size * 0.65} y={size * 0.4} width={size * 0.15} height={size * 0.3} rx={1} fill={color} />
    </svg>
  );
}

function ExternalIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size * 0.35} cy={size * 0.35} r={size * 0.2} fill={color} />
      <circle cx={size * 0.55} cy={size * 0.45} r={size * 0.18} fill={color} fillOpacity={0.7} />
      <circle cx={size * 0.4} cy={size * 0.65} r={size * 0.15} fill={color} fillOpacity={0.5} />
    </svg>
  );
}

function ServiceIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.15} y={size * 0.15} width={size * 0.7} height={size * 0.7} rx={8} fill={color} />
      <line x1={size * 0.3} y1={size * 0.4} x2={size * 0.7} y2={size * 0.4} stroke="#fff" strokeWidth={2} />
      <line x1={size * 0.3} y1={size / 2} x2={size * 0.7} y2={size / 2} stroke="#fff" strokeWidth={2} />
      <line x1={size * 0.3} y1={size * 0.6} x2={size * 0.55} y2={size * 0.6} stroke="#fff" strokeWidth={2} />
    </svg>
  );
}

export function TechIconRenderer({ tech, size = 32, tierColor = '#6366f1' }: TechIconRendererProps): React.JSX.Element {
  const techLower = tech.toLowerCase();
  
  switch (techLower) {
    case 'postgres':
    case 'postgresql':
      return <PostgreSIcon size={size} />;
    case 'mysql':
      return <MySQLIcon size={size} />;
    case 'mongodb':
    case 'mongo':
      return <MongoDBIcon size={size} />;
    case 'redis':
      return <RedisIcon size={size} />;
    case 'elasticsearch':
    case 'elastic':
      return <ElasticsearchIcon size={size} />;
    case 'kafka':
      return <KafkaIcon size={size} />;
    case 'rabbitmq':
    case 'rabbit':
      return <RabbitMQIcon size={size} />;
    case 'sqs':
      return <SqsIcon size={size} />;
    case 'react':
      return <ReactIcon size={size} />;
    case 'nextjs':
    case 'next':
      return <NextJSIcon size={size} />;
    case 'nodejs':
    case 'node':
      return <NodeJSIcon size={size} />;
    case 'typescript':
    case 'ts':
      return <TypeScriptIcon size={size} />;
    case 'javascript':
    case 'js':
      return <JavaScriptIcon size={size} />;
    case 'python':
    case 'py':
      return <PythonIcon size={size} />;
    case 'golang':
    case 'go':
      return <GolangIcon size={size} />;
    case 'docker':
      return <DockerIcon size={size} />;
    case 'kubernetes':
    case 'k8s':
      return <KubernetesIcon size={size} />;
    case 'aws':
      return <AwsIcon size={size} />;
    case 'nginx':
      return <NginxIcon size={size} />;
    case 'grafana':
      return <GrafanaIcon size={size} />;
    case 'prometheus':
      return <PrometheusIcon size={size} />;
    case 'vue':
      return <VueIcon size={size} />;
    case 'django':
      return <DjangoIcon size={size} />;
    case 'fastapi':
    case 'fast':
      return <FastAPIIcon size={size} />;
    case 'spring':
      return <SpringIcon size={size} />;
    case 'lambda':
    case 'aws-lambda':
      return <AwsLambdaIcon size={size} />;
    case 'database':
    case 'db':
    case 'dynamodb':
    case 'rds':
    case 'aurora':
    case 'sqlite':
    case 'firestore':
    case 'supabase':
      return <DatabaseIcon size={size} color={tierColor} />;
    case 'queue':
    case 'sns':
    case 'nats':
    case 'pubsub':
    case 'eventbus':
      return <QueueIcon size={size} color={tierColor} />;
    case 'cache':
    case 'memcached':
    case 'elasticache':
      return <CacheIcon size={size} color={tierColor} />;
    case 'worker':
    case 'backgroundjob':
    case 'cronjob':
      return <WorkerIcon size={size} color={tierColor} />;
    case 'gateway':
    case 'proxy':
      return <GatewayIcon size={size} color={tierColor} />;
    case 'loadbalancer':
    case 'lb':
      return <LoadBalancerIcon size={size} color={tierColor} />;
    case 'auth':
    case 'oauth':
    case 'jwt':
      return <AuthIcon size={size} color={tierColor} />;
    case 'firewall':
    case 'waf':
      return <FirewallIcon size={size} color={tierColor} />;
    case 'monitoring':
    case 'observability':
    case 'metrics':
      return <MonitoringIcon size={size} color={tierColor} />;
    case 'external':
    case 'thirdparty':
    case 'saas':
      return <ExternalIcon size={size} color={tierColor} />;
    case 'service':
    case 'api':
    case 'function':
    default:
      return <ServiceIcon size={size} color={tierColor} />;
  }
}

export const SUPPORTED_TECH_ICONS: string[] = [
  'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  'kafka', 'rabbitmq', 'sqs', 'react', 'nextjs', 'nodejs', 'typescript',
  'javascript', 'python', 'golang', 'docker', 'kubernetes', 'aws', 'nginx',
  'grafana', 'prometheus', 'vue', 'django', 'fastapi', 'spring', 'lambda',
  'database', 'dynamodb', 'rds', 'queue', 'cache', 'worker', 'gateway',
  'loadbalancer', 'auth', 'firewall', 'monitoring', 'external', 'service',
];
