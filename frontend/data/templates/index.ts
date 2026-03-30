import { Node, Edge } from 'reactflow';
import { chatgptNodes, chatgptEdges } from './chatgpt';
import { instagramNodes, instagramEdges } from './instagram';
import { archdrawNodes, archdrawEdges } from './archdraw';
import { videoStreamingNodes, videoStreamingEdges } from './video-streaming';
import { netflixNodes, netflixEdges } from './netflix';

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
    id: 'archdraw_self',
    name: 'ArchDraw Architecture',
    description: 'The system architecture of ArchDraw itself — Next.js, React Flow, Supabase, and Vercel.',
    tags: ['Next.js', 'Supabase', 'Vercel', 'SaaS'],
    icon: '🏗️',
    nodes: archdrawNodes,
    edges: archdrawEdges,
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
  {
    id: 'video_streaming',
    name: 'Video Streaming',
    description: 'Simple video streaming with CDN, API Gateway, Playback Service, Cache, and Database.',
    tags: ['Video', 'Streaming', 'CDN', 'Microservices'],
    icon: '🎬',
    nodes: videoStreamingNodes,
    edges: videoStreamingEdges,
  },
  {
    id: 'netflix',
    name: 'Netflix Streaming',
    description: 'FAANG-level Netflix architecture with 7 layers: Client, Edge, Gateway, Microservices (grouped by domain), Data, Streaming Pipeline, Analytics. Clean layered structure for system design interviews.',
    tags: ['Netflix', 'Streaming', 'FAANG', 'System Design', 'Microservices', 'CDN'],
    icon: '🎥',
    nodes: netflixNodes,
    edges: netflixEdges,
  },
];
