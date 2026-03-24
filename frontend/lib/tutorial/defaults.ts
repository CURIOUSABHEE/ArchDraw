// ── Shared default builders — eliminate repetition across tutorial files ─────

/** Standard 3-part action field: search → connect → meaning */
export function buildAction(
  searchLabel: string,
  fromNode: string,
  toNode: string,
  connectionMeaning: string,
): string {
  return (
    `Press ⌘K and search for '${searchLabel}' and press Enter to add it. ` +
    `Then connect ${fromNode} → ${toNode} by hovering over ${fromNode} ` +
    `and dragging from the handle on its edge to ${toNode}. ` +
    `This connection represents ${connectionMeaning}.`
  );
}

/** Standard first step action — no connection needed */
export function buildFirstStepAction(searchLabel: string): string {
  return `Press ⌘K and search for '${searchLabel}' and press Enter to add it.`;
}

/** Standard celebration message */
export function buildCelebration(
  componentLabel: string,
  connectedTo: string,
  realFact: string,
  nextHint: string,
): string {
  return (
    `${componentLabel} added and connected to ${connectedTo}. ` +
    `${realFact} ` +
    `Next we add ${nextHint}.`
  );
}

/** Standard Level 1 opening message */
export function buildOpeningL1(
  company: string,
  component: string,
  whatItDoes: string,
  analogy: string,
  searchLabel: string,
): string {
  return (
    `${company} uses ${component} to ${whatItDoes}. ` +
    `${analogy} ` +
    `Press ⌘K and search for '${searchLabel}' and press Enter.`
  );
}

/** Standard Level 2 opening message */
export function buildOpeningL2(
  company: string,
  component: string,
  atScale: string,
  withoutIt: string,
  searchLabel: string,
): string {
  return (
    `${company}'s ${component} ${atScale}. ` +
    `Without it, ${withoutIt}. ` +
    `Press ⌘K and search for '${searchLabel}' and press Enter.`
  );
}

/** Standard Level 3 opening message */
export function buildOpeningL3(
  company: string,
  component: string,
  pattern: string,
  tradeoff: string,
  searchLabel: string,
): string {
  return (
    `${company}'s ${component} implements ${pattern}. ` +
    `${tradeoff} ` +
    `Press ⌘K and search for '${searchLabel}' and press Enter.`
  );
}
