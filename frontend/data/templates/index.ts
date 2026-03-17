import { Node, Edge } from 'reactflow';
import { chatgptNodes, chatgptEdges } from './chatgpt';
import { instagramNodes, instagramEdges } from './instagram';
import { archflowNodes, archflowEdges } from './archflow';

export interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  icon: string; // emoji
  nodes: Node[];
  edges: Edge[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'archflow_self',
    name: 'ArchFlow Architecture',
    description: 'The system architecture of ArchFlow itself — Next.js, React Flow, Supabase, and Vercel.',
    tags: ['Next.js', 'Supabase', 'Vercel', 'SaaS'],
    icon: '🏗️',
    nodes: archflowNodes,
    edges: archflowEdges,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT-like Architecture',
    description: 'LLM-powered chat app with RAG pipeline, vector DB, streaming, and observability.',
    tags: ['AI', 'LLM', 'RAG', 'Microservices'],
    icon: '🤖',
    nodes: chatgptNodes,
    edges: chatgptEdges,
  },
  {
    id: 'instagram',
    name: 'Instagram-like Architecture',
    description: 'Social media platform with feed, media storage, Kafka streaming, and search.',
    tags: ['Social', 'Media', 'Kafka', 'Microservices'],
    icon: '📸',
    nodes: instagramNodes,
    edges: instagramEdges,
  },
];
