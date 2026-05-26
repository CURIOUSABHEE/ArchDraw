# Requirements Document

## Introduction

This feature implements dynamic edge handle positioning that recalculates live during node dragging operations. When nodes are connected by edges, the edge handles automatically choose the optimal side based on the spatial relationship between nodes. This ensures edges always use the most logical routing regardless of how nodes are repositioned.

The system determines handle positions by analyzing the center-to-center vector between connected nodes. The dominant axis (horizontal vs vertical) and direction determine which handles are used. This calculation must occur continuously during drag operations, not just at edge creation time.

## Glossary

- **Edge_Handle**: The connection point on a node where an edge attaches (top, right, bottom, or left side)
- **Source_Node**: The node from which an edge originates
- **Target_Node**: The node to which an edge connects
- **Handle_Position**: The side of a node where a handle is located (Position.Top, Position.Right, Position.Bottom, Position.Left)
- **Node_Center**: The geometric center point of a node calculated as (x + width/2, y + height/2)
- **Dominant_Axis**: The axis (horizontal or vertical) with the greater absolute distance between node centers
- **Dynamic_Handle_Calculator**: The system component that determines optimal handle positions based on node positions
- **Edge_Renderer**: The component responsible for drawing edges between nodes using calculated handle positions
- **Node_Drag_Event**: A user interaction where a node is being moved by mouse or touch input
- **Live_Recalculation**: The process of continuously updating handle positions during node movement

## Requirements

### Requirement 1: Dynamic Handle Selection Based on Spatial Relationship

**User Story:** As a diagram user, I want edge handles to automatically position themselves based on where nodes are relative to each other, so that edges always take the most logical path.

#### Acceptance Criteria

1. WHEN Target_Node center is to the RIGHT of Source_Node center AND horizontal distance exceeds vertical distance, THE Dynamic_Handle_Calculator SHALL assign Position.Right to Source_Node AND Position.Left to Target_Node
2. WHEN Target_Node center is to the LEFT of Source_Node center AND horizontal distance exceeds vertical distance, THE Dynamic_Handle_Calculator SHALL assign Position.Left to Source_Node AND Position.Right to Target_Node
3. WHEN Target_Node center is BELOW Source_Node center AND vertical distance exceeds horizontal distance, THE Dynamic_Handle_Calculator SHALL assign Position.Bottom to Source_Node AND Position.Top to Target_Node
4. WHEN Target_Node center is ABOVE Source_Node center AND vertical distance exceeds horizontal distance, THE Dynamic_Handle_Calculator SHALL assign Position.Top to Source_Node AND Position.Bottom to Target_Node
5. WHEN horizontal distance equals vertical distance, THE Dynamic_Handle_Calculator SHALL prioritize horizontal handle assignment over vertical handle assignment

### Requirement 2: Live Recalculation During Node Drag

**User Story:** As a diagram user, I want edge handles to update in real-time as I drag nodes around, so that I can see the optimal routing immediately without releasing the mouse.

#### Acceptance Criteria

1. WHEN a Node_Drag_Event occurs for Source_Node, THE Dynamic_Handle_Calculator SHALL recalculate handle positions for all edges connected to Source_Node
2. WHEN a Node_Drag_Event occurs for Target_Node, THE Dynamic_Handle_Calculator SHALL recalculate handle positions for all edges connected to Target_Node
3. WHILE a node is being dragged, THE Edge_Renderer SHALL update edge paths using the recalculated handle positions
4. THE Dynamic_Handle_Calculator SHALL complete recalculation within 16 milliseconds to maintain 60fps during drag operations
5. WHEN a Node_Drag_Event completes, THE system SHALL persist the final handle positions with the edge data

### Requirement 3: Handle Position Calculation Based on Node Centers

**User Story:** As a diagram user, I want handle positions to be determined by the geometric relationship between node centers, so that the routing logic is consistent and predictable.

#### Acceptance Criteria

1. THE Dynamic_Handle_Calculator SHALL compute Node_Center as (node.x + node.width / 2, node.y + node.height / 2)
2. THE Dynamic_Handle_Calculator SHALL calculate the horizontal distance as (Target_Node center X - Source_Node center X)
3. THE Dynamic_Handle_Calculator SHALL calculate the vertical distance as (Target_Node center Y - Source_Node center Y)
4. THE Dynamic_Handle_Calculator SHALL determine Dominant_Axis by comparing absolute values of horizontal distance and vertical distance
5. WHEN absolute horizontal distance is greater than or equal to absolute vertical distance, THE Dynamic_Handle_Calculator SHALL select horizontal handles (left or right)
6. WHEN absolute vertical distance is greater than absolute horizontal distance, THE Dynamic_Handle_Calculator SHALL select vertical handles (top or bottom)

### Requirement 4: Handle Coordinate Calculation

**User Story:** As a developer, I want precise handle coordinates calculated for each position, so that edges attach correctly to node boundaries.

#### Acceptance Criteria

1. WHEN Handle_Position is Position.Top, THE Dynamic_Handle_Calculator SHALL return coordinates (Node_Center X, node.y)
2. WHEN Handle_Position is Position.Bottom, THE Dynamic_Handle_Calculator SHALL return coordinates (Node_Center X, node.y + node.height)
3. WHEN Handle_Position is Position.Left, THE Dynamic_Handle_Calculator SHALL return coordinates (node.x, Node_Center Y)
4. WHEN Handle_Position is Position.Right, THE Dynamic_Handle_Calculator SHALL return coordinates (node.x + node.width, Node_Center Y)
5. THE Dynamic_Handle_Calculator SHALL use positionAbsolute values when available, falling back to position values

### Requirement 5: Integration with Edge Rendering System

**User Story:** As a diagram user, I want the dynamic handle system to work seamlessly with the existing edge rendering, so that all edge features continue to function correctly.

#### Acceptance Criteria

1. THE Edge_Renderer SHALL invoke Dynamic_Handle_Calculator before computing edge paths
2. THE Edge_Renderer SHALL pass Source_Node rectangle and Target_Node rectangle to Dynamic_Handle_Calculator
3. THE Edge_Renderer SHALL use the returned Handle_Position values to compute edge start and end coordinates
4. THE Edge_Renderer SHALL apply handle offsets after receiving coordinates from Dynamic_Handle_Calculator
5. THE Edge_Renderer SHALL maintain compatibility with edge shift offsets for parallel edges
6. THE Edge_Renderer SHALL preserve edge label positioning during handle recalculation

### Requirement 6: Backward Compatibility with Existing Edges

**User Story:** As a diagram user with existing diagrams, I want the dynamic handle system to work with my current edges, so that I don't lose any existing work.

#### Acceptance Criteria

1. WHEN an existing edge is loaded, THE system SHALL apply dynamic handle calculation regardless of stored handle values
2. THE system SHALL ignore legacy sourceHandle and targetHandle properties in favor of dynamic calculation
3. THE system SHALL maintain edge data properties (label, edgeType, pathType) during handle recalculation
4. WHEN an edge is reconnected, THE system SHALL apply dynamic handle calculation to the new connection
5. THE system SHALL preserve edge markers (arrows, decorations) during handle position updates

### Requirement 7: Performance Optimization for Multiple Edges

**User Story:** As a diagram user with complex diagrams, I want handle recalculation to remain performant even with many edges, so that dragging nodes stays smooth.

#### Acceptance Criteria

1. THE Dynamic_Handle_Calculator SHALL use memoization to cache handle calculations when node positions are unchanged
2. WHEN a node moves, THE system SHALL only recalculate handles for edges connected to that node
3. THE system SHALL batch handle recalculations when multiple nodes move simultaneously
4. THE Dynamic_Handle_Calculator SHALL complete calculations for 100 edges within 16 milliseconds
5. THE system SHALL avoid unnecessary re-renders of edges whose handles have not changed

### Requirement 8: Validation and Error Handling

**User Story:** As a developer, I want the system to handle edge cases gracefully, so that the application remains stable under all conditions.

#### Acceptance Criteria

1. WHEN Source_Node or Target_Node is not found, THE Dynamic_Handle_Calculator SHALL return default handle positions (Position.Right for source, Position.Left for target)
2. WHEN node dimensions are missing, THE Dynamic_Handle_Calculator SHALL use default dimensions (width: 200, height: 80)
3. WHEN node positions are identical, THE Dynamic_Handle_Calculator SHALL assign Position.Right to Source_Node AND Position.Left to Target_Node
4. IF handle calculation throws an error, THEN THE system SHALL log the error and use fallback handle positions
5. THE system SHALL validate that returned Handle_Position values are valid Position enum values

### Requirement 9: Debug and Observability

**User Story:** As a developer, I want visibility into handle calculation decisions, so that I can debug routing issues effectively.

#### Acceptance Criteria

1. WHERE debug mode is enabled, THE Dynamic_Handle_Calculator SHALL log node center coordinates for each calculation
2. WHERE debug mode is enabled, THE Dynamic_Handle_Calculator SHALL log the calculated dx, dy, and Dominant_Axis values
3. WHERE debug mode is enabled, THE Dynamic_Handle_Calculator SHALL log the selected Handle_Position for source and target
4. THE system SHALL provide a way to disable debug logging in production builds
5. THE system SHALL include edge ID and node IDs in debug log messages

### Requirement 10: Testing and Verification

**User Story:** As a developer, I want comprehensive tests for the dynamic handle system, so that I can confidently make changes without breaking functionality.

#### Acceptance Criteria

1. THE test suite SHALL include property-based tests that verify handle selection for randomly positioned node pairs
2. THE test suite SHALL verify that FOR ALL valid node positions, parsing handle positions then rendering then parsing SHALL produce equivalent handle positions (round-trip property)
3. THE test suite SHALL verify that handle selection remains consistent when nodes are moved along the same axis
4. THE test suite SHALL include integration tests that verify handle recalculation during simulated drag operations
5. THE test suite SHALL verify that handle positions are symmetric (if A→B uses right→left, then swapping positions results in left→right)
