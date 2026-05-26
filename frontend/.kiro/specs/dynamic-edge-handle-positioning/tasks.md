# Implementation Plan: Dynamic Edge Handle Positioning

## Overview

This feature is largely already implemented. The core dynamic handle calculation logic exists in `lib/features/dynamicHandles.ts` and is integrated into `components/edges/SimpleFloatingEdge.tsx`. The implementation plan focuses on:

1. **Testing**: Add comprehensive property-based tests and unit tests to validate correctness
2. **Performance**: Validate and optimize performance to meet 60fps target
3. **Debug Tooling**: Add conditional debug logging and observability features
4. **Documentation**: Document the system behavior and testing approach

The existing implementation already achieves live recalculation through React Flow's reactive rendering model. When nodes move during drag operations, connected edges automatically re-render with updated handle positions.

## Tasks

- [x] 1. Set up testing infrastructure
  - Install `fast-check` library for property-based testing
  - Create test file structure for unit and property tests
  - Configure test runner for TypeScript support
  - _Requirements: 10.1_

- [ ] 2. Implement property-based tests for handle selection
  - [x] 2.1 Write property test for spatial relationship-based handle selection
    - **Property 1: Handle Selection Based on Spatial Relationship**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 3.4, 3.5, 3.6**
    - Generate random node rectangles and verify handle selection follows spatial rules
    - Test horizontal dominance (right/left handles)
    - Test vertical dominance (top/bottom handles)
    - Test tie-breaking (equal distances prefer horizontal)
    - Minimum 100 iterations
  
  - [x] 2.2 Write property test for handle coordinate calculation
    - **Property 2: Handle Coordinate Calculation Correctness**
    - **Validates: Requirements 3.1, 4.1, 4.2, 4.3, 4.4**
    - Generate random node rectangles and handle positions
    - Verify coordinates match expected formulas for each position
    - Minimum 100 iterations
  
  - [x] 2.3 Write property test for position fallback behavior
    - **Property 3: Position Fallback Behavior**
    - **Validates: Requirements 4.5**
    - Generate nodes with and without positionAbsolute
    - Verify system uses positionAbsolute when available, falls back to position
    - Minimum 100 iterations
  
  - [x] 2.4 Write property test for handle symmetry
    - **Property 4: Handle Symmetry**
    - **Validates: Requirements 10.5**
    - Generate random node pairs A→B
    - Verify that swapping to B→A reverses handle positions
    - Minimum 100 iterations
  
  - [x] 2.5 Write property test for consistency under axis-aligned movement
    - **Property 5: Handle Consistency Under Axis-Aligned Movement**
    - **Validates: Requirements 10.3**
    - Generate random node pairs and calculate handles
    - Move both nodes by same offset along same axis
    - Verify handle positions remain unchanged
    - Minimum 100 iterations

- [ ] 3. Implement unit tests for edge cases
  - [x] 3.1 Write unit tests for horizontal dominance scenarios
    - Test target to the right (expect Right → Left)
    - Test target to the left (expect Left → Right)
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 Write unit tests for vertical dominance scenarios
    - Test target below (expect Bottom → Top)
    - Test target above (expect Top → Bottom)
    - _Requirements: 1.3, 1.4_
  
  - [x] 3.3 Write unit tests for tie-breaking and edge cases
    - Test equal distances (expect horizontal preference)
    - Test identical positions (expect Right → Left default)
    - Test missing dimensions (expect fallback to 200x80)
    - _Requirements: 1.5, 8.2, 8.3_
  
  - [x] 3.4 Write unit tests for coordinate calculations
    - Test Top handle: (centerX, y)
    - Test Bottom handle: (centerX, y + height)
    - Test Left handle: (x, centerY)
    - Test Right handle: (x + width, centerY)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement performance benchmarks
  - [x] 5.1 Create performance test suite
    - Set up performance testing infrastructure
    - Create test harness for measuring calculation time
    - _Requirements: 2.4, 7.4_
  
  - [x] 5.2 Write performance test for 100-edge scenario
    - **Property 6: Performance Under Load**
    - **Validates: Requirements 2.4, 7.4**
    - Generate 100 random node pairs
    - Measure total calculation time for all pairs
    - Verify completion within 16ms (60fps target)
  
  - [x] 5.3 Write performance test for selective recalculation
    - Verify only connected edges recalculate when a node moves
    - Measure recalculation count during simulated drag
    - _Requirements: 7.2_

- [ ] 6. Implement debug logging and observability
  - [x] 6.1 Add conditional debug logging to getDynamicHandles
    - Add NEXT_PUBLIC_DEBUG_HANDLES environment variable check
    - Log node centers, dx, dy, and dominant axis
    - Log selected handle positions with edge/node IDs
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [x] 6.2 Add performance monitoring in debug mode
    - Measure calculation time per edge
    - Log warnings for calculations exceeding 1ms
    - Track total recalculation time per frame
    - _Requirements: 2.4, 7.4_
  
  - [x] 6.3 Add error handling and logging
    - Wrap calculations in try-catch
    - Log errors with full context (edge ID, node IDs, positions)
    - Return safe defaults on error (Right → Left)
    - _Requirements: 8.4_

- [ ] 7. Implement edge data preservation tests
  - [x] 7.1 Write property test for edge data preservation
    - **Property 7: Edge Data Preservation**
    - **Validates: Requirements 6.3**
    - Generate edges with various data properties (label, edgeType, pathType, labelT)
    - Recalculate handle positions
    - Verify edge data properties remain unchanged
    - Minimum 100 iterations
  
  - [x] 7.2 Write unit tests for backward compatibility
    - Test that legacy sourceHandle/targetHandle properties are ignored
    - Test that edge markers are preserved
    - Test that label positioning is maintained
    - _Requirements: 6.1, 6.2, 6.5_

- [ ] 8. Implement validation and error handling tests
  - [x] 8.1 Write property test for default dimensions fallback
    - **Property 8: Default Dimensions Fallback**
    - **Validates: Requirements 8.2**
    - Generate nodes with missing width/height
    - Verify system uses defaults (200x80)
    - Minimum 100 iterations
  
  - [x] 8.2 Write property test for valid position enum values
    - **Property 9: Valid Position Enum Values**
    - **Validates: Requirements 8.5**
    - Generate random valid node rectangles
    - Verify returned positions are always valid Position enum values
    - Minimum 100 iterations
  
  - [x] 8.3 Write unit tests for missing node handling
    - Test behavior when source node is missing
    - Test behavior when target node is missing
    - Verify fallback to default positions (Right → Left)
    - _Requirements: 8.1_

- [x] 9. Checkpoint - Ensure all tests pass and performance targets met
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement integration tests
  - [x] 10.1 Write property test for round-trip consistency
    - **Property 10: Round-Trip Consistency**
    - **Validates: Requirements 10.2**
    - Generate random node positions
    - Calculate handles → render edge → extract handles
    - Verify extracted handles match original calculation
    - Minimum 100 iterations
  
  - [x] 10.2 Write integration test for drag operation simulation
    - Simulate node drag events
    - Verify handle recalculation occurs
    - Verify edge paths update correctly
    - _Requirements: 2.1, 2.2, 2.3, 10.4_
  
  - [x] 10.3 Write integration test for SimpleFloatingEdge memoization
    - Verify useMemo prevents unnecessary recalculations
    - Test that only connected edges recalculate
    - Verify dependency array correctness
    - _Requirements: 7.1, 7.2, 7.5_

- [ ] 11. Optimize memoization in SimpleFloatingEdge
  - [x] 11.1 Review and optimize useMemo dependency arrays
    - Ensure minimal dependencies in edgeParams calculation
    - Verify sourceNode and targetNode trigger recalculation
    - Remove unnecessary dependencies
    - _Requirements: 7.1, 7.5_
  
  - [x] 11.2 Add memoization to getDynamicHandles if needed
    - Profile calculation performance
    - Add caching if performance targets not met
    - Document caching strategy
    - _Requirements: 7.1, 2.4_

- [x] 12. Final checkpoint - Verify all requirements met
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Update documentation
  - [x] 13.1 Document testing approach and coverage
    - Document property-based testing strategy
    - List all properties and what they validate
    - Provide examples of running tests
    - _Requirements: 10.1_
  
  - [x] 13.2 Document debug mode usage
    - Document NEXT_PUBLIC_DEBUG_HANDLES environment variable
    - Provide examples of debug output
    - Document performance monitoring features
    - _Requirements: 9.4_
  
  - [x] 13.3 Document performance characteristics
    - Document performance benchmarks and results
    - Document optimization strategies
    - Provide guidance for large diagrams
    - _Requirements: 2.4, 7.4_
  
  - [x] 13.4 Create troubleshooting guide
    - Document common issues and solutions
    - Document error handling behavior
    - Provide debugging procedures
    - _Requirements: 8.4, 9.1, 9.2, 9.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The core implementation already exists and is functional
- Focus is on validation, testing, and observability
- Property-based tests use `fast-check` library with minimum 100 iterations
- Performance target: 16ms for 100 edges (60fps)
- Debug logging controlled by NEXT_PUBLIC_DEBUG_HANDLES environment variable
- All tests reference specific requirements for traceability
