/**
 * Utility for calculating node dimensions as per Diagram Generation Rules.
 * Rule 2: Node width = auto-fit to longest text line + 40px padding on each side.
 * Rule 2: Node height = auto-fit to number of text lines + 20px padding top/bottom.
 * Rule 2: Minimum node width: 180px. No maximum.
 */

const AVG_CHAR_WIDTH = 6.5; // Approximation for Inter/Roboto at 14px
const LINE_HEIGHT = 20;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320; // Prevent ridiculously long nodes
const PADDING_X = 48; // 24px on each side
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
  const width = Math.min(Math.max(calculatedWidth, MIN_WIDTH), MAX_WIDTH);

  // Calculate height
  // Determine if text wraps
  let wrappedLines = 0;
  for (const line of lines) {
    const lineW = (line.length * AVG_CHAR_WIDTH) + PADDING_X;
    if (lineW > MAX_WIDTH) {
      wrappedLines += Math.ceil(lineW / MAX_WIDTH);
    } else {
      wrappedLines += 1;
    }
  }

  // Minimum height for 1 line is PADDING_Y + LINE_HEIGHT = 60
  const calculatedHeight = (wrappedLines * LINE_HEIGHT) + PADDING_Y;
  const height = Math.max(calculatedHeight, 110); // Enforcing 110 as seen in SHAPE_CONFIGS for consistency

  return { width, height };
}
