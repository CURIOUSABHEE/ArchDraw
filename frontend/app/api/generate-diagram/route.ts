import { NextRequest } from 'next/server';
import { callGroq, parseJSON, type GroqMessage } from '@/lib/ai/groqPool';
import { buildReactFlowDiagramRaw, sanitiseSynthesiserOutput } from '@/lib/ai/buildReactFlowDiagram';
import { applyGridLayout, enhanceEdges } from '@/lib/ai/layoutEngine';
import type { Node, Edge } from 'reactflow';
import type { SynthesiserOutput } from '@/lib/ai/agents/synthesiser';

interface GenerateRequest {
  description: string;
}

interface GenerateResponse {
  nodes: Node[];
  edges: Edge[];
  projectName: string;
  domain: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateRequest;
    const { description } = body;

    if (!description || description.trim().length < 10) {
      return new Response(JSON.stringify({
        error: 'Please provide a more detailed description of the system you want to diagram.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages: GroqMessage[] = [
      {
        role: 'user',
        content: `Generate a detailed system architecture diagram for: ${description}

You are an expert Software Architecture Diagram Generator. Generate a complete architecture diagram with ALL required components.

IMPORTANT RULES:
1. ALWAYS include at minimum 6-10 components
2. Include external services/APIs when relevant
3. Add edge labels describing the data flow
4. Place components in correct layers:
   - Layer A (Client/Edge): Frontend apps, CDN, Load Balancer, API Gateway, Mobile clients
   - Layer B (Services): Business logic services, microservices, auth services
   - Layer C (Data): Databases, caches, message queues, storage
   - Layer D (External): Third-party APIs, payment gateways, notification services

Return a JSON object with these EXACT keys:
{
  "nodes": [
    { "id": "unique_id", "componentKey": "component_key", "label": "Component Name", "sublabel": "optional role description", "layer": "A|B|C|D", "isCustom": false }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_id_1", "target": "node_id_2", "edgeType": "sync|async|event", "label": "data flow description" }
  ],
  "customNodeDefinitions": []
}

Example response for "e-commerce platform":
{
  "nodes": [
    { "id": "web_app", "componentKey": "client_web_mobile", "label": "Web Application", "sublabel": "Frontend for customers", "layer": "A", "isCustom": false },
    { "id": "mobile_app", "componentKey": "client_web_mobile", "label": "Mobile App", "sublabel": "iOS/Android app", "layer": "A", "isCustom": false },
    { "id": "cdn", "componentKey": "cdn", "label": "CDN", "sublabel": "Static asset delivery", "layer": "A", "isCustom": false },
    { "id": "api_gateway", "componentKey": "api_gateway", "label": "API Gateway", "sublabel": "Entry point & routing", "layer": "A", "isCustom": false },
    { "id": "auth_service", "componentKey": "auth_service", "label": "Auth Service", "sublabel": "JWT & session auth", "layer": "B", "isCustom": false },
    { "id": "product_service", "componentKey": "microservice", "label": "Product Service", "sublabel": "Product catalog", "layer": "B", "isCustom": false },
    { "id": "order_service", "componentKey": "microservice", "label": "Order Service", "sublabel": "Order processing", "layer": "B", "isCustom": false },
    { "id": "payment_service", "componentKey": "microservice", "label": "Payment Service", "sublabel": "Payment processing", "layer": "B", "isCustom": false },
    { "id": "postgres_db", "componentKey": "sql_db", "label": "PostgreSQL Database", "sublabel": "Primary data store", "layer": "C", "isCustom": false },
    { "id": "redis_cache", "componentKey": "in_memory_cache", "label": "Redis Cache", "sublabel": "Session & data cache", "layer": "C", "isCustom": false },
    { "id": "stripe", "componentKey": "external", "label": "Stripe Payment", "sublabel": "Payment gateway", "layer": "D", "isCustom": false }
  ],
  "edges": [
    { "id": "e1", "source": "web_app", "target": "cdn", "edgeType": "sync", "label": "static assets" },
    { "id": "e2", "source": "web_app", "target": "api_gateway", "edgeType": "sync", "label": "API requests" },
    { "id": "e3", "source": "mobile_app", "target": "api_gateway", "edgeType": "sync", "label": "API requests" },
    { "id": "e4", "source": "api_gateway", "target": "auth_service", "edgeType": "sync", "label": "authenticate" },
    { "id": "e5", "source": "api_gateway", "target": "product_service", "edgeType": "sync", "label": "product data" },
    { "id": "e6", "source": "api_gateway", "target": "order_service", "edgeType": "sync", "label": "orders" },
    { "id": "e7", "source": "order_service", "target": "payment_service", "edgeType": "sync", "label": "process payment" },
    { "id": "e8", "source": "payment_service", "target": "stripe", "edgeType": "event", "label": "payment" },
    { "id": "e9", "source": "product_service", "target": "postgres_db", "edgeType": "sync", "label": "product catalog" },
    { "id": "e10", "source": "product_service", "target": "redis_cache", "edgeType": "sync", "label": "cache hot products" }
  ],
  "customNodeDefinitions": []
}

Generate a complete architecture for: ${description}`,
      },
    ];

    const response = await callGroq({
      agentRole: 'synthesiser',
      model: 'llama-3.3-70b-versatile',
      messages,
      maxTokens: 4096,
      temperature: 0.1,
    });

    const synthesiserOutput = parseJSON<SynthesiserOutput>(response, 'synthesiser');
    const sanitised = sanitiseSynthesiserOutput(synthesiserOutput);
    
    const { nodes: rfNodes, edges: rfEdges } = buildReactFlowDiagramRaw(sanitised, []);
    const { nodes: laidOutNodes } = applyGridLayout(rfNodes);
    const enhancedEdges = enhanceEdges(rfEdges, laidOutNodes);

    return new Response(JSON.stringify({
      nodes: laidOutNodes,
      edges: enhancedEdges,
      projectName: 'Generated Architecture',
      domain: 'System Architecture',
    } as GenerateResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[GenerateDiagram] Error:', error);
    
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(JSON.stringify({
      error: message,
      hint: 'Please try again with a more specific description.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
