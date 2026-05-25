# Bugfix Requirements Document

## Introduction

The system currently maintains two distinct node design styles: a dark mode gradient-based style and a "design with plates" style. This dual-style approach creates visual inconsistency and increases maintenance complexity. The dark mode gradient style should be completely removed, leaving only the "design with plates" style as the single, consistent node design approach across all themes. The background theme (light/dark) can still change, but nodes will maintain a consistent plate-based appearance regardless of theme.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the canvas theme is set to dark mode THEN SystemNode.tsx renders nodes with `DARK_STYLES` configuration using gradient backgrounds (`linear-gradient(135deg, #1E2235 0%, #141624 100%)`)

1.2 WHEN the canvas theme is set to dark mode THEN ShapeNode.tsx switches to `DARK_NODE_STYLES` which uses different backplate colors (`#111827`, `#1F2937`) instead of the plate design

1.3 WHEN exporting diagrams in dark mode THEN lib/svgExport.ts renders nodes with `node-dark-bg` gradient fill and dark-specific styling

1.4 WHEN the theme changes THEN nodes change their fundamental design appearance (gradient vs plates) rather than maintaining consistent design with theme-appropriate colors

1.5 WHEN lib/theme/stylingConstants.ts is imported THEN both `DARK_NODE_STYLES` and `LIGHT_NODE_STYLES` are exported, enabling the dual-style system

### Expected Behavior (Correct)

2.1 WHEN the canvas theme is set to dark mode THEN SystemNode.tsx SHALL render nodes using the plate design with dark-theme-appropriate colors (no gradients)

2.2 WHEN the canvas theme is set to dark mode THEN ShapeNode.tsx SHALL use plate-style backplates with consistent offsets and colors appropriate for dark backgrounds

2.3 WHEN exporting diagrams in dark mode THEN lib/svgExport.ts SHALL render nodes with plate-based design using solid fills and backplates (no `node-dark-bg` gradient)

2.4 WHEN the theme changes THEN nodes SHALL maintain the same plate-based design structure with only color adjustments for theme contrast

2.5 WHEN lib/theme/stylingConstants.ts is imported THEN only a single unified node style configuration SHALL be exported, with theme-specific color variations

### Unchanged Behavior (Regression Prevention)

3.1 WHEN nodes are rendered in light mode THEN the system SHALL CONTINUE TO display the existing plate design with light-appropriate colors

3.2 WHEN nodes are selected THEN the system SHALL CONTINUE TO show selection indicators (borders, shadows) appropriate to the theme

3.3 WHEN nodes have accent colors or status indicators THEN the system SHALL CONTINUE TO display these visual elements correctly

3.4 WHEN diagrams are exported THEN the system SHALL CONTINUE TO generate valid SVG output with all node content and styling

3.5 WHEN users interact with node toolbars and properties THEN the system SHALL CONTINUE TO function without changes to interaction behavior
