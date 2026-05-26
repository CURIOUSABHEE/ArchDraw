# Dynamic Handle Positioning - Testing Documentation

## Overview

This document describes the testing infrastructure and approach for the dynamic edge handle positioning feature. The test suite validates that edge handles are correctly positioned based on the spatial relationship between connected nodes.

## Testing Infrastructure

### Test Framework

- **Test Runner**: [Vitest](https://vitest.dev/) v4.1.7
- **Property-Based Testing**: [fast-check](https://fast-check.dev/) v4.8.0
- **Environment**: jsdom (for React component testing)
- **TypeScript Support**: Full TypeScript support via Vitest configuration

### Test Files

1. **`dynamicHandles.test.ts`** - Unit tests for specific examples and edge cases
2. **`dynamicHandles.property.test.ts`** - Property-based tests with randomized inputs
3. **`dynamicHandles.performance.test.ts`** - Performance benchmarks and load testing
4. **`dynamicHandles.debug.test.ts`** - Debug logging and error handling tests
5. **`dynamicHandles.integration.test.ts`** - Integration tests for full computation pipeline

### Configuration

The test configuration is defined in `vitest.config.ts`:

```typescript
{
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
}
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Files

```bash
# Run only dynamic handles tests
npm test -- lib/features/dynamicHandles

# Run only unit tests
npm test -- lib/features/dynamicHandles.test.ts

# Run only property-based tests
npm test -- lib/features/dynamicHandles.property.test.ts

# Run only performance tests
npm test -- lib/features/dynamicHandles.performance.test.ts
```

### Watch Mode

```bash
npm run test:watch
```

### UI Mode

```bash
npm run test:ui
```

## Test Coverage

### Unit Tests (`dynamicHandles.test.ts`)

The unit test suite covers specific scenarios and edge cases:

#### Handle Selection Tests

1. **Horizontal Dominance**
   - Target to the right → Right → Left handles
   - Target to the left → Left → Right handles

2. **Vertical Dominance**
   - Target below → Bottom → Top handles
   - Target above → Top → Bottom handles

3. **Edge Cases**
   - Equal distances (tie-breaking: prefer horizontal)
   - Identical positions (default: Right → Left)
   - Different node dimensions

#### Coordinate Calculation Tests

Tests for each handle position:
- Top handle: `(centerX, y)`
- Bottom handle: `(centerX, y + height)`
- Left handle: `(x, centerY)`
- Right handle: `(x + width, centerY)`

### Property-Based Tests (`dynamicHandles.property.test.ts`)

Property-based tests use `fast-check` to generate random inputs and verify that properties hold across all valid inputs. Each property test runs **100 iterations** minimum.

#### Property 1: Handle Selection Based on Spatial Relationship

**Validates**: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 3.4, 3.5, 3.6

Verifies that for any two node rectangles:
- Horizontal dominance (`|dx| >= |dy|`): Uses left/right handles based on direction
- Vertical dominance (`|dy| > |dx|`): Uses top/bottom handles based on direction
- Tie-breaking: Prefers horizontal handles when distances are equal

#### Property 2: Handle Coordinate Calculation Correctness

**Validates**: Requirements 3.1, 4.1, 4.2, 4.3, 4.4

Verifies that for any node rectangle and handle position, coordinates match expected formulas.

#### Property 4: Handle Symmetry

**Validates**: Requirements 10.5

Verifies that swapping source and target nodes reverses the handle positions:
- If A→B produces `(sourcePos, targetPos)`
- Then B→A produces `(targetPos, sourcePos)`

#### Property 5: Handle Consistency Under Axis-Aligned Movement

**Validates**: Requirements 10.3

Verifies that moving both nodes by the same offset preserves handle positions (relative spatial relationship unchanged).

#### Property 9: Valid Position Enum Values

**Validates**: Requirements 8.5

Verifies that all results are valid `Position` enum values (`Top`, `Right`, `Bottom`, `Left`).

## Performance Tests

### Performance Test Infrastructure (`dynamicHandles.performance.test.ts`)

The performance test suite provides infrastructure for measuring and validating the performance characteristics of dynamic handle calculations. This ensures the system meets the 60fps target (16ms per frame) during drag operations.

#### PerformanceTestHarness Class

A utility class that provides methods for performance measurement:

**Key Methods:**
- `measureExecutionTime(fn)`: Measures execution time of a function in milliseconds
- `measureMultipleRuns(fn, iterations)`: Runs a function multiple times and returns statistics (min, max, avg, median, total)
- `generateRandomNodeRect()`: Generates random node rectangles for testing
- `generateNodePairs(count)`: Generates multiple random node pairs
- `measureBatchCalculation(pairs)`: Measures time to calculate handles for multiple node pairs
- `formatTime(ms)`: Formats time values with appropriate units (ns, μs, ms)
- `logStats(label, stats)`: Logs performance statistics to console

#### Performance Test Categories

1. **Infrastructure Validation**
   - Verifies measurement accuracy
   - Validates random data generation
   - Tests statistics calculation

2. **Single Calculation Performance**
   - Measures time for individual handle calculations
   - Verifies single calculations complete in < 1ms
   - Calculates average time across 100 iterations

3. **Batch Calculation Performance**
   - Tests 10 edge calculations (< 5ms target)
   - Tests 50 edge calculations (< 10ms target)
   - Prepares for 100 edge test in Task 5.2

4. **Consistency Validation**
   - Verifies measurements are consistent across runs
   - Ensures performance is predictable

#### Running Performance Tests

```bash
# Run all performance tests
npm test -- lib/features/dynamicHandles.performance.test.ts

# Run with verbose output to see timing details
npx vitest --run lib/features/dynamicHandles.performance.test.ts --reporter=verbose
```

#### Performance Metrics

Current performance characteristics:
- **Single calculation**: < 1ms (typically < 0.1ms)
- **10 edges**: < 5ms (typically < 1ms)
- **50 edges**: < 10ms (typically < 1ms)
- **Consistency**: Within 10x variance across runs

These results indicate the system is well-positioned to meet the 16ms target for 100 edges (Task 5.2).



## Test Data Generation

### Node Rectangle Generator

Property-based tests use a custom arbitrary generator for node rectangles:

```typescript
const nodeRectArbitrary = fc.record({
  x: fc.double({ min: -1000, max: 1000, noNaN: true }),
  y: fc.double({ min: -1000, max: 1000, noNaN: true }),
  width: fc.double({ min: 1, max: 500, noNaN: true }),
  height: fc.double({ min: 1, max: 500, noNaN: true }),
});
```

This generates valid node rectangles with:
- Position coordinates: -1000 to 1000
- Dimensions: 1 to 500 (always positive)
- No NaN values

### Position Generator

```typescript
const positionArbitrary = fc.constantFrom(
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left
);
```

## Test Results

### Current Status

✅ **All tests passing** (46 tests total)
- 14 unit tests
- 13 property-based tests (1300+ total iterations)
- 14 performance tests
- 5 integration tests

### Performance

- Unit test execution time: ~43ms
- Property-based test execution time: ~50ms
- Performance test execution time: ~10ms
- Integration test execution time: ~5ms
- Total duration: ~1.5s (including setup and environment initialization)

## Adding New Tests

### Adding Unit Tests

Add new test cases to `dynamicHandles.test.ts`:

```typescript
it('should handle new scenario', () => {
  const sourceRect: NodeRect = { x: 0, y: 0, width: 100, height: 80 };
  const targetRect: NodeRect = { x: 200, y: 0, width: 100, height: 80 };

  const result = getDynamicHandles(sourceRect, targetRect);

  expect(result.sourcePosition).toBe(Position.Right);
  expect(result.targetPosition).toBe(Position.Left);
});
```

### Adding Property-Based Tests

Add new properties to `dynamicHandles.property.test.ts`:

```typescript
it('should verify new property', () => {
  fc.assert(
    fc.property(nodeRectArbitrary, nodeRectArbitrary, (sourceRect, targetRect) => {
      const result = getDynamicHandles(sourceRect, targetRect);
      
      // Add assertions here
      expect(result).toBeDefined();
    }),
    { numRuns: 100 }
  );
});
```

## Troubleshooting

### Tests Not Running

1. Ensure dependencies are installed:
   ```bash
   npm install
   ```

2. Check that `jsdom` is installed:
   ```bash
   npm install -D jsdom
   ```

### Property Tests Failing

Property-based tests may occasionally find edge cases. When a property test fails:

1. Check the counterexample provided by fast-check
2. Verify if it's a real bug or an incorrect test assumption
3. Add the counterexample as a unit test for regression testing

### Floating Point Precision

For coordinate calculations, use `toBeCloseTo()` instead of `toBe()` to handle floating-point precision:

```typescript
expect(coord.x).toBeCloseTo(expectedX, 10); // 10 decimal places
```

### Property 3: Position Fallback and Edge Cases

**Validates**: Requirements 4.5, 8.2

Verifies that edge case node rectangles (including zero dimensions) produce valid results without crashing.

### Property 7: Edge Data Preservation (Function Purity)

**Validates**: Requirements 6.3

Verifies the function is pure/deterministic: same inputs always produce same outputs, regardless of extraneous data.

### Property 8: Default Dimensions Robustness

**Validates**: Requirements 8.2

Verifies that nodes with zero width/height still produce valid position results without crashing.

### Property 10: Round-Trip Consistency (Handle Boundary)

**Validates**: Requirements 10.2

Verifies that for any two node rectangles, the source handle coordinate lies on the source node boundary and the target handle on the target node boundary.

## Integration Tests (`dynamicHandles.integration.test.ts`)

The integration test suite validates the full edge computation pipeline that mirrors `SimpleFloatingEdge` behavior:

1. **positionAbsolute Fallback**: Verifies `positionAbsolute` is preferred over `position`, and falls back to `position` when undefined
2. **Default Dimensions**: Verifies missing width/height defaults to 200x80
3. **Missing Node Handling**: Verifies fallback to default positions (Top/Bottom at 0,0) when source or target node is null
4. **Memoization Simulation**: Verifies identical inputs produce identical outputs, node movement triggers update, and unrelated node changes don't affect edge params

## Backward Compatibility Tests

Added in `dynamicHandles.test.ts`:
- Verifies dynamic handle calculation ignores legacy sourceHandle/targetHandle props
- Verifies zero-width/height node rects are handled gracefully

## Debug Logging Tests (`dynamicHandles.debug.test.ts`)

Covers:
- Debug disabled when `NEXT_PUBLIC_DEBUG_HANDLES` is not set or set to `false`
- Full logging when enabled: calculation details, selected handles, performance timing
- Vertical axis logging correctness
- Optional edge/node IDs
- Error handling: returns valid positions even with NaN inputs

## Performance Monitoring in Source

The `getDynamicHandles` function includes built-in performance monitoring:
- When `NEXT_PUBLIC_DEBUG_HANDLES=true`: logs `elapsedMs` per calculation
- Warns via `console.warn` if any single calculation exceeds 1ms
- Errors are caught and logged with full context, returning safe defaults (Right/Left)

## References

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [React Flow Documentation](https://reactflow.dev/)
- [Requirements Document](../../.kiro/specs/dynamic-edge-handle-positioning/requirements.md)
- [Design Document](../../.kiro/specs/dynamic-edge-handle-positioning/design.md)
