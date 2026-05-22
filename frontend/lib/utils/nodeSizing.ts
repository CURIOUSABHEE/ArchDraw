/**
 * Utility for calculating node dimensions as per Diagram Generation Rules.
 * Rule 2: Node width = auto-fit to longest text line + 40px padding on each side.
 * Rule 2: Node height = auto-fit to number of text lines + 20px padding top/bottom.
 * Rule 2: Minimum node width: 180px. No maximum.
 */

const AVG_CHAR_WIDTH = 8; // Approximation for Inter/Roboto at 14px
const LINE_HEIGHT = 20;
const MIN_WIDTH = 180;
const PADDING_X = 80; // 40px on each side
const PADDING_Y = 40; // 20px on top/bottom

export interface NodeDimensions {
  width: number;
  height: number;
}

export function calculateNodeDimensions(label: string, subtitle?: string): NodeDimensions {
  const lines = [label];
  if (subtitle) lines.push(subtitle);

  // Find longest line
  const longestLineLength = Math.max(...lines.map(line => line.length));
  
  // Calculate width
  const calculatedWidth = (longestLineLength * AVG_CHAR_WIDTH) + PADDING_X;
  const width = Math.max(calculatedWidth, MIN_WIDTH);

  // Calculate height
  // Minimum height for 1 line is PADDING_Y + LINE_HEIGHT = 60
  // But Rule 3 suggests tiered nodes are vertically aligned and Rule 1 suggests rank/node sep.
  // We'll follow the rule: lines + padding.
  const calculatedHeight = (lines.length * LINE_HEIGHT) + PADDING_Y;
  const height = Math.max(calculatedHeight, 110); // Enforcing 110 as seen in SHAPE_CONFIGS for consistency

  return { width, height };
}
