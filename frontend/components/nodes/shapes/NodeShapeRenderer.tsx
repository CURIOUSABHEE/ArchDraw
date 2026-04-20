'use client';

import React from 'react';
import { NODE_SHAPE_MAP, type NodeShapeVariant } from '../nodeDesignTokens';

interface NodeShapeRendererProps {
  nodeType: string;
  size?: number;
  tierColor: string;
}

function RoundedSquare({ size, tierColor }: { size: number; tierColor: string }) {
  const fillColor = tierColor;
  const strokeColor = tierColor;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect
        x={2}
        y={2}
        width={size - 4}
        height={size - 4}
        rx={12}
        fill={fillColor}
        fillOpacity={0.1}
        stroke={strokeColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
    </svg>
  );
}

function Cylinder({ size, tierColor }: { size: number; tierColor: string }) {
  const width = size;
  const height = size * 1.2;
  const ellipseRy = height * 0.12;
  const bodyHeight = height - ellipseRy * 2;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={0}
        y={ellipseRy}
        width={width}
        height={bodyHeight}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <ellipse
        cx={width / 2}
        cy={height - ellipseRy}
        rx={width / 2}
        ry={ellipseRy}
        fill={tierColor}
        fillOpacity={0.15}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <ellipse
        cx={width / 2}
        cy={ellipseRy}
        rx={width / 2}
        ry={ellipseRy}
        fill={tierColor}
        fillOpacity={0.2}
        stroke={tierColor}
        strokeOpacity={0.5}
        strokeWidth={1}
      />
    </svg>
  );
}

function PillHorizontal({ size, tierColor }: { size: number; tierColor: string }) {
  const width = size * 1.6;
  const height = size * 0.7;
  const radius = height / 2;
  
  const lineSpacing = height / 4;
  const lineY1 = height / 2 - lineSpacing;
  const lineY2 = height / 2;
  const lineY3 = height / 2 + lineSpacing;
  const lineMargin = width * 0.2;
  const lineLength = width * 0.4;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        rx={radius}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <line
        x1={lineMargin}
        y1={lineY1}
        x2={lineMargin + lineLength}
        y2={lineY1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <line
        x1={lineMargin}
        y1={lineY2}
        x2={lineMargin + lineLength}
        y2={lineY2}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <line
        x1={lineMargin}
        y1={lineY3}
        x2={lineMargin + lineLength}
        y2={lineY3}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Diamond({ size, tierColor }: { size: number; tierColor: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const points = [
    `${cx},${cy - size / 2 + 4}`,
    `${cx + size / 2 - 4},${cy}`,
    `${cx},${cy + size / 2 - 4}`,
    `${cx - size / 2 + 4},${cy}`,
  ].join(' ');
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon
        points={points}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <path
        d={`M ${cx - 6} ${cy - 8} L ${cx + 2} ${cy - 2} L ${cx - 4} ${cy + 6} Z M ${cx + 4} ${cy - 6} L ${cx + 10} ${cy + 2} L ${cx + 2} ${cy + 4} Z`}
        fill={tierColor}
        fillOpacity={0.5}
      />
    </svg>
  );
}

function Cloud({ size, tierColor }: { size: number; tierColor: string }) {
  const width = size * 1.2;
  const height = size * 0.8;
  const cx = width / 2;
  const cy = height / 2 + height * 0.1;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <ellipse
        cx={cx - width * 0.25}
        cy={cy - height * 0.1}
        rx={width * 0.28}
        ry={height * 0.35}
        fill={tierColor}
        fillOpacity={0.08}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeDasharray="5 3"
      />
      <ellipse
        cx={cx}
        cy={cy - height * 0.15}
        rx={width * 0.32}
        ry={height * 0.4}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeDasharray="5 3"
      />
      <ellipse
        cx={cx + width * 0.25}
        cy={cy - height * 0.05}
        rx={width * 0.26}
        ry={height * 0.32}
        fill={tierColor}
        fillOpacity={0.08}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeDasharray="5 3"
      />
      <rect
        x={cx - width * 0.35}
        y={cy}
        width={width * 0.7}
        height={height * 0.25}
        fill={tierColor}
        fillOpacity={0.08}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeDasharray="5 3"
      />
    </svg>
  );
}

function Hexagon({ size, tierColor }: { size: number; tierColor: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const w = size / 2;
  const h = size * 0.44;
  const points = [
    `${cx},${cy - h + 2}`,
    `${cx + w - 2},${cy - h / 2}`,
    `${cx + w - 2},${cy + h / 2}`,
    `${cx},${cy + h - 2}`,
    `${cx - w + 2},${cy + h / 2}`,
    `${cx - w + 2},${cy - h / 2}`,
  ].join(' ');
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon
        points={points}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
    </svg>
  );
}

function Shield({ size, tierColor }: { size: number; tierColor: string }) {
  const cx = size / 2;
  const cy = size / 2 + size * 0.05;
  const w = size * 0.4;
  const h = size * 0.5;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path
        d={`M ${cx} ${cy - h} L ${cx + w} ${cy - h * 0.5} L ${cx + w} ${cy + h * 0.2} L ${cx} ${cy + h} L ${cx - w} ${cy + h * 0.2} L ${cx - w} ${cy - h * 0.5} Z`}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <rect
        x={cx - 6}
        y={cy - 8}
        width={12}
        height={10}
        rx={2}
        fill={tierColor}
        fillOpacity={0.5}
      />
      <path
        d={`M ${cx - 4} ${cy - 2} A 4 4 0 0 0 ${cx + 4} ${cy - 2}`}
        fill="none"
        stroke={tierColor}
        strokeOpacity={0.8}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={cy + 2}
        x2={cx}
        y2={cy + 6}
        stroke={tierColor}
        strokeOpacity={0.8}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MonitorScreen({ size, tierColor }: { size: number; tierColor: string }) {
  const width = size * 1.1;
  const height = size;
  const screenHeight = height * 0.75;
  const standHeight = height * 0.15;
  const baseWidth = width * 0.4;
  const baseHeight = height * 0.08;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={2}
        y={2}
        width={width - 4}
        height={screenHeight - 2}
        rx={4}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <rect
        x={width / 2 - 3}
        y={screenHeight}
        width={6}
        height={standHeight}
        fill={tierColor}
        fillOpacity={0.3}
      />
      <rect
        x={(width - baseWidth) / 2}
        y={screenHeight + standHeight}
        width={baseWidth}
        height={baseHeight}
        rx={2}
        fill={tierColor}
        fillOpacity={0.3}
      />
    </svg>
  );
}

function MobilePhone({ size, tierColor }: { size: number; tierColor: string }) {
  const width = size * 0.6;
  const height = size;
  const screenWidth = width * 0.85;
  const screenHeight = height * 0.78;
  const screenX = (width - screenWidth) / 2;
  const screenY = height * 0.08;
  const homeButtonY = height * 0.92;
  const speakerY = height * 0.03;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={6}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <rect
        x={screenX}
        y={screenY}
        width={screenWidth}
        height={screenHeight}
        rx={2}
        fill={tierColor}
        fillOpacity={0.05}
      />
      <rect
        x={width / 2 - 4}
        y={speakerY}
        width={8}
        height={2}
        rx={1}
        fill={tierColor}
        fillOpacity={0.4}
      />
      <circle
        cx={width / 2}
        cy={homeButtonY}
        r={3}
        fill={tierColor}
        fillOpacity={0.4}
      />
    </svg>
  );
}

function UserCircle({ size, tierColor }: { size: number; tierColor: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  const headR = size * 0.18;
  const headY = cy - size * 0.08;
  const bodyR = size * 0.28;
  const bodyY = cy + size * 0.15;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <circle
        cx={cx}
        cy={headY}
        r={headR}
        fill={tierColor}
        fillOpacity={0.6}
      />
      <ellipse
        cx={cx}
        cy={bodyY}
        rx={bodyR}
        ry={bodyR * 0.7}
        fill={tierColor}
        fillOpacity={0.5}
      />
    </svg>
  );
}

function Gear({ size, tierColor }: { size: number; tierColor: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = size * 0.25;
  const toothCount = 8;
  const toothWidth = (2 * Math.PI) / toothCount;
  const toothDepth = outerR * 0.2;
  
  let path = '';
  for (let i = 0; i < toothCount; i++) {
    const angle1 = i * toothWidth;
    const angle2 = angle1 + toothWidth * 0.3;
    const angle3 = angle1 + toothWidth * 0.7;
    const angle4 = angle1 + toothWidth;
    
    const x1 = cx + Math.cos(angle1) * (outerR - toothDepth);
    const y1 = cy + Math.sin(angle1) * (outerR - toothDepth);
    const x2 = cx + Math.cos(angle2) * outerR;
    const y2 = cy + Math.sin(angle2) * outerR;
    const x3 = cx + Math.cos(angle3) * outerR;
    const y3 = cy + Math.sin(angle3) * outerR;
    const x4 = cx + Math.cos(angle4) * (outerR - toothDepth);
    const y4 = cy + Math.sin(angle4) * (outerR - toothDepth);
    
    if (i === 0) {
      path += `M ${x1} ${y1} `;
    }
    path += `L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} `;
  }
  path += 'Z';
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path
        d={path}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill={tierColor}
        fillOpacity={0.15}
        stroke={tierColor}
        strokeOpacity={0.3}
        strokeWidth={1}
      />
    </svg>
  );
}

function Chart({ size, tierColor }: { size: number; tierColor: string }) {
  const width = size;
  const height = size;
  const chartPadding = 8;
  const chartWidth = width - chartPadding * 2;
  const chartHeight = height - chartPadding * 2;
  const barCount = 4;
  const barWidth = chartWidth / (barCount * 2 + 1);
  const barHeights = [0.4, 0.7, 0.55, 0.85];
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={chartPadding}
        y={chartPadding}
        width={chartWidth}
        height={chartHeight}
        rx={4}
        fill={tierColor}
        fillOpacity={0.1}
        stroke={tierColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      {barHeights.map((h, i) => {
        const x = chartPadding + barWidth * (i * 2 + 0.5);
        const barHeight = chartHeight * h;
        const y = chartPadding + chartHeight - barHeight;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={2}
            fill={tierColor}
            fillOpacity={0.4 + h * 0.3}
          />
        );
      })}
    </svg>
  );
}

export function NodeShapeRenderer({ nodeType, size = 64, tierColor }: NodeShapeRendererProps): React.JSX.Element {
  const shape = NODE_SHAPE_MAP[nodeType.toLowerCase()] || 'ROUNDED_SQUARE';
  
  const props = { size, tierColor };
  
  switch (shape) {
    case 'CYLINDER':
      return <Cylinder {...props} />;
    case 'PILL_HORIZONTAL':
      return <PillHorizontal {...props} />;
    case 'DIAMOND':
      return <Diamond {...props} />;
    case 'CLOUD':
      return <Cloud {...props} />;
    case 'HEXAGON':
      return <Hexagon {...props} />;
    case 'SHIELD':
      return <Shield {...props} />;
    case 'MONITOR_SCREEN':
      return <MonitorScreen {...props} />;
    case 'MOBILE_PHONE':
      return <MobilePhone {...props} />;
    case 'USER_CIRCLE':
      return <UserCircle {...props} />;
    case 'GEAR':
      return <Gear {...props} />;
    case 'CHART':
      return <Chart {...props} />;
    case 'ROUNDED_SQUARE':
    default:
      return <RoundedSquare {...props} />;
  }
}

export { NODE_SHAPE_MAP };
