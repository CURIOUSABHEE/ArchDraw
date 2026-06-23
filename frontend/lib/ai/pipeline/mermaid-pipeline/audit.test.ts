import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as pregen from './stage1-pregen';
import { parseMermaid } from './mermaidParser';
import { validateMermaid } from './stage3-validate';
import { translateMermaidToReactFlowJSON } from '@/lib/mermaid/aiAdapter';
import { apiKeyManager } from '../../utils/apiKeyManager';

describe('Tier 1 Unit & Regression Tests', () => {
  const mockStyleConfig = {
    primaryColor: '#2563EB',
    secondaryColor: '#4F46E5',
    background: '#F9FAFB',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Inter',
    theme: 'default',
  };

  beforeAll(() => {
    vi.spyOn(pregen, 'runEdgeAgent').mockResolvedValue({
      edges: [
        { from: 'React Frontend', to: 'Node Backend', label: 'API calls', bidirectional: false },
        { from: 'Node Backend', to: 'MongoDB Database', label: 'reads/writes', bidirectional: false }
      ],
      edgeCount: 2,
    });

    vi.spyOn(pregen, 'runInventoryAgent').mockResolvedValue({
      nodes: ['Web Client', 'CDN', 'Gateway', 'Load Balancer', 'Auth API', 'Cart API', 'DB Node', 'Cache Node', 'Queue', 'Worker'],
      groups: ['Presentation Client Layer', 'Application Compute Tier'],
      nodeCount: 10
    });
  });

  // TEST 1.1 — EDGE AGENT NULL OUTPUT TEST
  it('TEST 1.1: edge agent generates connections for multi-node prompts', async () => {
    const prompt = 'Show a system with a React Frontend, a Node Backend, and a MongoDB Database.';
    const edgeConfig = await pregen.runEdgeAgent(prompt);
    
    expect(edgeConfig.edges).toBeDefined();
    expect(edgeConfig.edges.length).toBeGreaterThanOrEqual(2);
    for (const edge of edgeConfig.edges) {
      expect(edge.from).toBeTruthy();
      expect(edge.to).toBeTruthy();
    }
  });

  // TEST 1.2 — INVENTORY COUNT PRESERVATION TEST
  it('TEST 1.2: inventory agent preserves expected number of components', async () => {
    const prompt = 'Draw a diagram with exactly: Web Client, CDN, Gateway, Load Balancer, Auth API, Cart API, DB Node, Cache Node, Queue, Worker.';
    const inventory = await pregen.runInventoryAgent(prompt);
    
    expect(inventory.nodes.length).toBeGreaterThanOrEqual(10);
    expect(inventory.nodeCount).toBeGreaterThanOrEqual(10);
  });

  // TEST 1.3 — MERMAID SYNTAX VALIDITY TEST
  it('TEST 1.3: parseMermaid parses valid Mermaid correctly without throwing', () => {
    const validMermaid = `
      graph TD
        subgraph CLIENT["Client Container"]
          CV["Customer View\\nNext.js"]
        end
        subgraph SERVER["Application Server"]
          AUTH["/api/auth"]
        end
        CV --> AUTH
    `;
    expect(() => parseMermaid(validMermaid)).not.toThrow();
    const parsed = parseMermaid(validMermaid);
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.edges).toHaveLength(1);
    expect(parsed.subgraphs).toHaveLength(2); // CLIENT and SERVER
  });

  // TEST 1.4 — TRANSLATOR ROUND-TRIP TEST
  it('TEST 1.4: translator maps exact counts from Mermaid to React Flow', async () => {
    const mermaidCode = `
      graph TD
        subgraph G1
          N1["Node 1"]
          N2["Node 2"]
          N3["Node 3"]
        end
        subgraph G2
          N4["Node 4"]
          N5["Node 5"]
        end
        N1 --> N2
        N2 --> N3
        N3 --> N4
        N4 --> N5
    `;
    const { nodes, edges } = await translateMermaidToReactFlowJSON(mermaidCode, mockStyleConfig);
    const leafNodes = nodes.filter(n => n.type !== 'frameNode');
    const frameNodes = nodes.filter(n => n.type === 'frameNode');

    expect(leafNodes).toHaveLength(5);
    expect(frameNodes).toHaveLength(2);
    expect(edges).toHaveLength(4);
  });

  // TEST 1.5 — POSITION UNIQUENESS TEST
  it('TEST 1.5: no two leaf nodes share identical coordinates', async () => {
    const mermaidCode = `
      graph TD
        subgraph G1
          N1["Node 1"]
          N2["Node 2"]
        end
        N1 --> N2
    `;
    const { nodes } = await translateMermaidToReactFlowJSON(mermaidCode, mockStyleConfig);
    const leafNodes = nodes.filter(n => n.type !== 'frameNode');
    
    const positions = leafNodes.map(n => `${n.position.x},${n.position.y}`);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(leafNodes.length);
  });

  // TEST 1.6 — ORPHAN NODE TEST
  it('TEST 1.6: validation flags orphan nodes', () => {
    const mermaidWithOrphan = `
      graph TD
        subgraph G1
          N1["Node 1"]
          N2["Node 2"]
        end
        N1 --> N1
    `;
    const inventoryConfig = {
      nodes: ['Node 1', 'Node 2'],
      groups: ['G1'],
      nodeCount: 2,
    };
    const edgeConfig = {
      edges: [
        { from: 'Node 1', to: 'Node 2', label: 'connect', bidirectional: false }
      ],
      edgeCount: 1,
    };
    
    const result = validateMermaid(mermaidWithOrphan, inventoryConfig, edgeConfig);
    expect(result.isValid).toBe(false);
    expect(result.repairInstructions).toContain('ORPHAN NODES DETECTED');
  });

  // REGRESSION TEST R1 — THE VERTICAL STACK BUG
  it('REGRESSION TEST R1: ELK staggers ungrouped nodes', async () => {
    const twentySixNodeMermaid = `
      graph TD
        N1["Node 1"]
        N2["Node 2"]
        N3["Node 3"]
        N4["Node 4"]
    `;
    const { nodes } = await translateMermaidToReactFlowJSON(twentySixNodeMermaid, mockStyleConfig);
    const leafNodes = nodes.filter(n => n.type !== 'frameNode');
    
    // ELK should produce unique positions for each node
    const positions = leafNodes.map(n => `${n.position.x},${n.position.y}`);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(leafNodes.length);
  });

  // REGRESSION TEST R2 — THE ZERO EDGES BUG
  it('REGRESSION TEST R2: validateMermaid flags zero edges for multi-node diagram', () => {
    const zeroEdgesMermaid = `
      graph TD
        subgraph G1
          N1["Node 1"]
          N2["Node 2"]
        end
    `;
    const inventoryConfig = {
      nodes: ['Node 1', 'Node 2'],
      groups: ['G1'],
      nodeCount: 2,
    };
    const edgeConfig = {
      edges: [
        { from: 'Node 1', to: 'Node 2', label: 'connect', bidirectional: false }
      ],
      edgeCount: 1,
    };
    
    const result = validateMermaid(zeroEdgesMermaid, inventoryConfig, edgeConfig);
    expect(result.isValid).toBe(false);
    expect(result.repairInstructions).toContain('CRITICAL: Zero edges generated for multi-node diagram');
  });
});

describe('Pipeline Diagnostic Fixes', () => {
  it('forces erDiagram format to graph TD when architecture keywords are present', async () => {
    const spy = vi.spyOn(apiKeyManager, 'executeWithRetry').mockResolvedValue(
      JSON.stringify({
        format: 'mermaid',
        diagramType: 'erDiagram',
        optionalVariants: [],
      })
    );

    const result = await pregen.runFormatAgent('Show a microservices-based e-commerce platform');
    expect(result.diagramType).toBe('graph TD');

    spy.mockRestore();
  });

  it('keeps erDiagram format when explicit database schema requests are present without general architecture keywords', async () => {
    const spy = vi.spyOn(apiKeyManager, 'executeWithRetry').mockResolvedValue(
      JSON.stringify({
        format: 'mermaid',
        diagramType: 'erDiagram',
        optionalVariants: [],
      })
    );

    const result = await pregen.runFormatAgent('Show a database schema for user profiles');
    expect(result.diagramType).toBe('erDiagram');

    spy.mockRestore();
  });

  it('caps groups based on node count to prevent layout over-engineering', async () => {
    const spy = vi.spyOn(apiKeyManager, 'executeWithRetry');
    
    spy.mockResolvedValueOnce(JSON.stringify({
      format: 'mermaid',
      diagramType: 'graph TD',
      optionalVariants: []
    }));
    
    spy.mockResolvedValueOnce(JSON.stringify({
      primaryColor: '#2563EB',
      secondaryColor: '#4F46E5',
      background: '#F9FAFB',
      fontFamily: 'Inter',
      theme: 'default'
    }));
    
    spy.mockResolvedValueOnce(JSON.stringify({
      nodes: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10'],
      groups: ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6'],
      nodeCount: 10
    }));
    
    spy.mockResolvedValueOnce(JSON.stringify({
      edges: [
        { from: 'N1', to: 'N2', label: 'connect', bidirectional: false }
      ]
    }));

    const result = await pregen.runStage1PreGeneration('test prompt');
    
    // For 10 nodes, cap is 3 groups
    expect(result.inventoryConfig.groups.length).toBeLessThanOrEqual(3);
    expect(result.inventoryConfig.groups).toEqual(['Group 1', 'Group 2', 'Group 3']);

    spy.mockRestore();
  });

  it('prioritizes validation repairs sequentially (Nodes > Edges > Groups)', () => {
    const inventoryConfig = {
      nodes: ['Customer View', 'PostgreSQL', 'Auth Service'],
      groups: ['Client Tier', 'Services Tier', 'Data Tier'],
      nodeCount: 3,
    };

    const edgeConfig = {
      edges: [
        { from: 'Customer View', to: 'Auth Service', label: 'login', bidirectional: false },
      ],
      edgeCount: 1,
    };

    // Missing 'Auth Service' and 'PostgreSQL' (node issues)
    // Missing 'Services Tier' and 'Data Tier' (group issues)
    const brokenMermaid = `
      graph TD
        subgraph CLIENT["Client Tier"]
          CV["Customer View\\nNext.js"]
        end
    `;

    const result = validateMermaid(brokenMermaid, inventoryConfig, edgeConfig);
    expect(result.isValid).toBe(false);
    expect(result.nodeIssues.length).toBeGreaterThan(0);
    expect(result.groupIssues.length).toBeGreaterThan(0);
    
    // repairInstructions should contain Node issues but NOT Group issues
    expect(result.repairInstructions).toContain('MISSING NODES');
    expect(result.repairInstructions).not.toContain('MISSING GROUPS');
  });

  // REGRESSION TEST R4 — NODE LOSS OSCILLATION REGRESSION
  it('REGRESSION TEST R4: ensures final node count and edges count are capped and correct without oscillation', async () => {
    // When input is large, check that node count is capped to 20
    const spy = vi.spyOn(apiKeyManager, 'executeWithRetry');
    
    spy.mockResolvedValueOnce(JSON.stringify({
      format: 'mermaid',
      diagramType: 'graph TD',
      optionalVariants: []
    }));
    spy.mockResolvedValueOnce(JSON.stringify({
      primaryColor: '#2563EB',
      secondaryColor: '#4F46E5',
      background: '#F9FAFB',
      fontFamily: 'Inter',
      theme: 'default'
    }));
    // 25 nodes
    const largeNodesList = Array.from({ length: 25 }, (_, i) => `Node${i + 1}`);
    spy.mockResolvedValueOnce(JSON.stringify({
      nodes: largeNodesList,
      groups: ['Group 1', 'Group 2'],
      nodeCount: 25
    }));
    spy.mockResolvedValueOnce(JSON.stringify({
      edges: [
        { from: 'Node1', to: 'Node2', label: 'calls', bidirectional: false },
        { from: 'Node2', to: 'Node3', label: 'calls', bidirectional: false }
      ]
    }));

    const result = await pregen.runStage1PreGeneration('large system design', 'large');
    expect(result.inventoryConfig.nodes.length).toBe(20); // capped to 20
    expect(result.inventoryConfig.nodeCount).toBe(20);
    expect(result.inventoryConfig.splitMode).toBe(true);
    expect(result.edgeConfig.edges.length).toBeGreaterThan(0);
    
    spy.mockRestore();
  });

  // REGRESSION TEST R5 — MISSING NODE REFERENCE REGRESSION
  it('REGRESSION TEST R5: pre-check auto-corrects edge source/target with close matches in nodeIdMap', () => {
    const brokenMermaid = `
      graph TD
        subgraph SERVICES["Services Tier"]
          MessageQueue["Message Queue\\nKafka"]
          PaymentProcessing["Payment Processing\\nStripe"]
        end
        MessageQueu -->|"pub"| PaymentProcessin
    `;

    const inventoryConfig = {
      nodes: ['Message Queue', 'Payment Processing'],
      groups: ['Services Tier'],
      nodeCount: 2,
    };

    const edgeConfig = {
      edges: [
        { from: 'Message Queue', to: 'Payment Processing', label: 'pub', bidirectional: false },
      ],
      edgeCount: 1,
    };

    const result = validateMermaid(brokenMermaid, inventoryConfig, edgeConfig);
    // Should be valid because of the D6 pre-check auto-correcting close matches
    expect(result.isValid).toBe(true);
  });

  // REGRESSION TEST R6 — SELF LOOP EDGE REGRESSION
  it('REGRESSION TEST R6: pre-generation filters out self-loop edges', async () => {
    const spy = vi.spyOn(apiKeyManager, 'executeWithRetry');
    spy.mockResolvedValueOnce(JSON.stringify({
      format: 'mermaid',
      diagramType: 'graph TD',
      optionalVariants: []
    }));
    spy.mockResolvedValueOnce(JSON.stringify({
      primaryColor: '#2563EB',
      secondaryColor: '#4F46E5',
      background: '#F9FAFB',
      fontFamily: 'Inter',
      theme: 'default'
    }));
    spy.mockResolvedValueOnce(JSON.stringify({
      nodes: ['Service A', 'Service B'],
      groups: ['Group 1'],
      nodeCount: 2
    }));
    // Edge containing a self loop: Service A -> Service A
    spy.mockResolvedValueOnce(JSON.stringify({
      edges: [
        { from: 'Service A', to: 'Service B', label: 'calls', bidirectional: false },
        { from: 'Service A', to: 'Service A', label: 'self calls', bidirectional: false }
      ]
    }));

    const result = await pregen.runStage1PreGeneration('prompt with self loop');
    expect(result.edgeConfig.edges).toHaveLength(1);
    expect(result.edgeConfig.edges[0].from).toBe('Service A');
    expect(result.edgeConfig.edges[0].to).toBe('Service B');

    spy.mockRestore();
  });

  // REGRESSION TEST R7 — EDGE COUNT MISMATCH REGRESSION
  it('REGRESSION TEST R7: validateMermaid flags edge count mismatch when counts differ', () => {
    const mermaid = `
      graph TD
        subgraph G1["Group 1"]
          NodeA["Node A\\nTech"]
          NodeB["Node B\\nTech"]
        end
        NodeA --> NodeB
    `;
    const inventoryConfig = {
      nodes: ['Node A', 'Node B'],
      groups: ['Group 1'],
      nodeCount: 2,
    };
    // Expected edge count is 2, but only 1 edge in mermaid
    const edgeConfig = {
      edges: [
        { from: 'Node A', to: 'Node B', label: 'link', bidirectional: false },
        { from: 'Node B', to: 'Node A', label: 'backlink', bidirectional: false }
      ],
      edgeCount: 2,
    };

    const result = validateMermaid(mermaid, inventoryConfig, edgeConfig);
    expect(result.isValid).toBe(false);
    expect(result.repairInstructions).toContain('EDGE COUNT MISMATCH');
  });

  // REGRESSION TEST R8 — ORPHAN NODE AUTO-CONNECTION IN PRE-GENERATION
  it('REGRESSION TEST R8: pre-generation automatically connects orphan nodes to prevent deadlocks', async () => {
    const spy = vi.spyOn(apiKeyManager, 'executeWithRetry');
    spy.mockResolvedValueOnce(JSON.stringify({
      format: 'mermaid',
      diagramType: 'graph TD',
      optionalVariants: []
    }));
    spy.mockResolvedValueOnce(JSON.stringify({
      primaryColor: '#2563EB',
      secondaryColor: '#4F46E5',
      background: '#F9FAFB',
      fontFamily: 'Inter',
      theme: 'default'
    }));
    // 4 nodes
    spy.mockResolvedValueOnce(JSON.stringify({
      nodes: ['Gateway Node', 'Connected Node', 'Orphan Service', 'Database Node'],
      groups: ['Group 1'],
      nodeCount: 4
    }));
    // Edges leaving 'Orphan Service' and 'Database Node' as orphans
    spy.mockResolvedValueOnce(JSON.stringify({
      edges: [
        { from: 'Gateway Node', to: 'Connected Node', label: 'calls', bidirectional: false }
      ]
    }));

    const result = await pregen.runStage1PreGeneration('prompt with orphans');
    
    // There should be no orphan nodes in edgeConfig
    const connected = new Set<string>();
    for (const edge of result.edgeConfig.edges) {
      connected.add(edge.from);
      connected.add(edge.to);
    }
    
    // Every node must be connected in the output edgeConfig
    expect(connected.has('Gateway Node')).toBe(true);
    expect(connected.has('Connected Node')).toBe(true);
    expect(connected.has('Orphan Service')).toBe(true);
    expect(connected.has('Database Node')).toBe(true);

    // Database Node should be the target because of its name keyword
    const dbEdge = result.edgeConfig.edges.find(e => e.to === 'Database Node');
    expect(dbEdge).toBeDefined();
    expect(dbEdge?.label).toBe('reads / writes');

    // Connected Node should be the hub (compute node rather than gateway)
    expect(dbEdge?.from).toBe('Connected Node');

    spy.mockRestore();
  });

  // REGRESSION TEST R9 — BYPASS BIDIRECTIONAL EDGE COUNT MISMATCH CHECK
  it('REGRESSION TEST R9: validator ignores bidirectional edge count mismatch', () => {
    const inventoryConfig = {
      nodes: ['Customer View', 'PostgreSQL', 'Auth Service'],
      groups: ['Client Tier', 'Services Tier', 'Data Tier'],
      nodeCount: 3,
      bidirectionalEdgeCount: 5, // Expects 5, but we only have 0 or 1
    };

    const edgeConfig = {
      edges: [
        { from: 'Customer View', to: 'Auth Service', label: 'login', bidirectional: false },
        { from: 'Auth Service', to: 'PostgreSQL', label: 'lookup', bidirectional: false },
      ],
      edgeCount: 2,
    };

    // Valid diagram structure but with 0 bidirectional edges instead of the expected 5
    const mermaid = `
      graph TD
        subgraph CLIENT["Client Tier"]
          CV["Customer View\\nNext.js"]
        end
        subgraph SERVICES["Services Tier"]
          AUTH["Auth Service\\nExpress"]
        end
        subgraph DB["Data Tier"]
          PG[("PostgreSQL")]
        end
        CV -->|"login"| AUTH
        AUTH -->|"lookup"| PG
    `;

    const result = validateMermaid(mermaid, inventoryConfig, edgeConfig);
    // Should pass because bidirectional edge count mismatch check is completely removed
    expect(result.isValid).toBe(true);
    expect(result.bidiIssues).toEqual([]);
  });

  // REGRESSION TEST R10 — PREVENT NODE MAPPING SUBSTRING COLLISION
  it('REGRESSION TEST R10: prioritizes exact matches to prevent substring collision between short and long node names', () => {
    const inventoryConfig = {
      nodes: ['User', 'User Authentication Service'],
      groups: ['Client Tier', 'Services Tier'],
      nodeCount: 2,
    };

    const edgeConfig = {
      edges: [
        { from: 'User', to: 'User Authentication Service', label: 'logins', bidirectional: false },
      ],
      edgeCount: 1,
    };

    // Customer client is represented as "User", backend as "User Authentication Service"
    // If loose substring matching matches "User" to "User Authentication Service" (User ID), it will result in collision.
    const mermaid = `
      graph TD
        subgraph CLIENT["Client Tier"]
          User["User\\nWeb Browser"]
        end
        subgraph SERVICES["Services Tier"]
          UserAuth["User Authentication Service\\nExpress"]
        end
        User -->|"logins"| UserAuth
    `;

    const result = validateMermaid(mermaid, inventoryConfig, edgeConfig);
    // If priority mapping works, User -> User and User Authentication Service -> UserAuth.
    // The edge from User to UserAuth matches the edgeConfig from 'User' to 'User Authentication Service' (1 expected, 1 found).
    expect(result.isValid).toBe(true);
    expect(result.nodeIssues).toEqual([]);
    expect(result.edgeIssues).toEqual([]);
  });
});

describe('sanitizeAndAlignEdges & ensureNoOrphanEdges Unit Tests', () => {
  it('deletes reverse client flows but flips gateway reverse connections if needed', () => {
    const nodes = ['Client App', 'API Gateway', 'User DB'];
    const edges = [
      { from: 'API Gateway', to: 'Client App', label: 'sends response', bidirectional: false },
      { from: 'User DB', to: 'Client App', label: 'callback', bidirectional: false }
    ];

    const sanitized = pregen.sanitizeAndAlignEdges(nodes, edges);

    // Gateway -> Client should be flipped to Client -> Gateway
    const flippedEdge = sanitized.find(e => e.from === 'Client App' && e.to === 'API Gateway');
    expect(flippedEdge).toBeDefined();

    // User DB -> Client should be completely deleted (no client bypass allowed, database shouldn't connect to client)
    const dbEdge = sanitized.find(e => e.from === 'User DB');
    expect(dbEdge).toBeUndefined();
  });

  it('resolves gateway bypass by routing client direct requests via outer/inner gateways', () => {
    const nodes = ['Client App', 'Load Balancer', 'API Gateway', 'Auth Service'];
    const edges = [
      { from: 'Client App', to: 'Auth Service', label: 'login', bidirectional: false }
    ];

    const sanitized = pregen.sanitizeAndAlignEdges(nodes, edges);

    // Client App should connect to Load Balancer (outer gateway)
    const clientToLb = sanitized.find(e => e.from === 'Client App' && e.to === 'Load Balancer');
    expect(clientToLb).toBeDefined();

    // Load Balancer should connect to API Gateway (inner gateway)
    const lbToApi = sanitized.find(e => e.from === 'Load Balancer' && e.to === 'API Gateway');
    expect(lbToApi).toBeDefined();

    // API Gateway should connect to Auth Service (target node)
    const apiToAuth = sanitized.find(e => e.from === 'API Gateway' && e.to === 'Auth Service');
    expect(apiToAuth).toBeDefined();

    // Bypass edge Client App -> Auth Service should be removed
    const directEdge = sanitized.find(e => e.from === 'Client App' && e.to === 'Auth Service');
    expect(directEdge).toBeUndefined();
  });

  it('eliminates replica chaining and load balances traffic individually', () => {
    const nodes = ['API Gateway', 'Server Replica 1', 'Server Replica 2', 'User DB'];
    const edges = [
      { from: 'API Gateway', to: 'Server Replica 1', label: 'route', bidirectional: false },
      { from: 'Server Replica 1', to: 'Server Replica 2', label: 'sync', bidirectional: false },
      { from: 'Server Replica 1', to: 'User DB', label: 'write', bidirectional: false }
    ];

    const sanitized = pregen.sanitizeAndAlignEdges(nodes, edges);

    // Server Replica 1 -> Server Replica 2 (horizontal chaining) should be deleted
    const chainingEdge = sanitized.find(e => e.from === 'Server Replica 1' && e.to === 'Server Replica 2');
    expect(chainingEdge).toBeUndefined();

    // Load balancer / Gateway should route to both replicas
    const toReplica1 = sanitized.find(e => e.from === 'API Gateway' && e.to === 'Server Replica 1');
    const toReplica2 = sanitized.find(e => e.from === 'API Gateway' && e.to === 'Server Replica 2');
    expect(toReplica1).toBeDefined();
    expect(toReplica2).toBeDefined();

    // Downstream DB connection should be duplicated for both replicas
    const replica1ToDb = sanitized.find(e => e.from === 'Server Replica 1' && e.to === 'User DB');
    const replica2ToDb = sanitized.find(e => e.from === 'Server Replica 2' && e.to === 'User DB');
    expect(replica1ToDb).toBeDefined();
    expect(replica2ToDb).toBeDefined();
  });

  it('connects disconnected gateways to backend compute services', () => {
    const nodes = ['Client App', 'API Gateway', 'Payment Service', 'User DB'];
    const edges = [
      { from: 'Client App', to: 'API Gateway', label: 'request', bidirectional: false }
    ];

    const sanitized = pregen.sanitizeAndAlignEdges(nodes, edges);

    // API Gateway should route request to Payment Service (compute service)
    const apiToPayment = sanitized.find(e => e.from === 'API Gateway' && e.to === 'Payment Service');
    expect(apiToPayment).toBeDefined();
  });
});

