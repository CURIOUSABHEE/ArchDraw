/**
 * Returns the x/y coordinate at a fractional position t (0–1) along an SVG path string.
 * Falls back to midpoint on error.
 */
export function getPointOnPath(
  pathD: string,
  t: number
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }

  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    svg.style.pointerEvents = 'none';
    document.body.appendChild(svg);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    svg.appendChild(path);

    const totalLength = path.getTotalLength();
    const clamped = Math.max(0, Math.min(1, t));
    const point = path.getPointAtLength(totalLength * clamped);

    document.body.removeChild(svg);
    return { x: point.x, y: point.y };
  } catch {
    return { x: 0, y: 0 };
  }
}

/**
 * Given a pointer position and SVG path, finds the closest t (0-1)
 * along the path by sampling.
 */
export function findClosestT(
  pathD: string,
  px: number,
  py: number,
  samples = 100
): number {
  if (typeof window === 'undefined') return 0.5;

  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    svg.style.pointerEvents = 'none';
    document.body.appendChild(svg);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    svg.appendChild(path);

    const totalLength = path.getTotalLength();
    let bestT = 0.5;
    let bestDist = Infinity;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const pt = path.getPointAtLength(totalLength * t);
      const dist = (pt.x - px) ** 2 + (pt.y - py) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestT = t;
      }
    }

    document.body.removeChild(svg);
    return Math.max(0.05, Math.min(0.95, bestT)); // keep 5% margin from endpoints
  } catch {
    return 0.5;
  }
}
