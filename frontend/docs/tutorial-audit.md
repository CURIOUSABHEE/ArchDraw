# Tutorial Feature Audit Report

## Summary

| Status | Item |
|--------|------|
| ✅ | Typo fixed: "Limimiter" → "Limiter" in factories.ts |
| ⚠️ | Two different factory patterns in use |
| ⚠️ | Some step ID duplicates in Uber tutorial |
| ✅ | Netflix tutorial well-structured |
| ⚠️ | ChatGPT uses createStep pattern differently |

---

## Issues Found

### 1. Typo Fixed ✅
- **File**: `lib/tutorial/factories.ts:441`
- **Issue**: `token_bucket_rate_limiter: 'Token Bucket Rate Limimiter'`
- **Fix**: Changed to `'Token Bucket Rate Limiter'`

### 2. Two Factory Patterns

**Pattern A**: `createStep/createLevel` (ChatGPT)
```typescript
createStep({
  nodeMatcher: clientMatcher('mobile'),
  fromMatchers: [],
  toMatchers: [],
})
```

**Pattern B**: `step/level/tutorial` (Netflix, Instagram, Uber, others)
```typescript
step({
  component: component('client_web', 'Web'),
  requiredNodes: ['client_web'],
  requiredEdges: [edge('client_web', 'dns')],
})
```

Both work due to fuzzy matching in GuidePanel, but it's fragile.

### 3. Step ID Duplicates in Uber
Level 2 starts with `id: 1` again. While levels are separate, this is inconsistent.

### 4. Validation Direction Semantics (ChatGPT)

The `createStep` function has specific validation logic:

| Scenario | What it validates |
|----------|-------------------|
| Only `fromMatchers` | Source → New Node (New node receives) |
| Only `toMatchers` | New Node → Target (New node sends to) |
| Both | Source → New → Target |

For `toMatchers: [serviceMatcher('Chat')]`:
- Validates: **New Node → Chat** (Chat is the destination)
- Means: New node sends TO Chat

This is architecturally correct for most cases (cache, logger, etc. send to Chat).

---

## Tutorial Structure Comparison

### Netflix (Best Structure)
- ✅ Opening message
- ✅ Celebration message  
- ✅ Connecting message
- ✅ Multiple instructional messages
- ✅ Clear action hints
- ✅ Proper step IDs (1-21, unique across levels)

### Instagram (Good Structure)
- ✅ Opening/celebration/connecting messages
- ✅ Multiple steps per level
- ⚠️ Step ID starts at 1 per level

### Uber (Minor Issues)
- ⚠️ Some steps missing `connectingMessage`
- ⚠️ Step IDs restart per level

### ChatGPT (Different Pattern)
- Uses `createStep` with ComponentMatcher
- Hints use `buildAction()` for generic guidance
- Works but different from others

---

## Recommendations

1. **Standardize tutorials** - Choose one factory pattern (recommend Pattern B for consistency)

2. **Add step ID validation** - Ensure unique IDs within each tutorial

3. **Add validation tests** - Test suite to verify each tutorial passes for correct completions

4. **Document factory patterns** - Comments explaining `fromMatchers` vs `toMatchers`

5. **Fix Uber step IDs** - Use unique IDs (22-30 for Level 2, 31-40 for Level 3)

---

## Validation Logic (Reference)

```
fromMatchers: [X]
├── Validates: X → New Node
├── Use when: New node receives from X
└── Example: Chat Service calls LLM → LLM receives from Chat

toMatchers: [X]
├── Validates: New Node → X  
├── Use when: New node sends to X
└── Example: Chat writes to NoSQL → NoSQL receives from Chat

fromMatchers: [X] + toMatchers: [Y]
├── Validates: X → New Node → Y
├── Use when: New node is middleman
└── Example: RAG retrieves from Vector and feeds LLM
```
