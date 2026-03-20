'use client';

import { Trophy, Check, ArrowRight, Sparkles } from 'lucide-react';
import type { TutorialData } from '@/data/tutorials';

interface TutorialCompleteProps {
  tutorial: TutorialData;
  onRetry: () => void;
  onNext: () => void;
  onGoToCanvas: () => void;
}

const NEXT_TUTORIALS: Record<string, { id: string; title: string; reason: string }> = {
  'url-shortener': { id: 'chatgpt-architecture', title: 'ChatGPT Architecture', reason: 'Go deeper into LLM systems with the multi-level ChatGPT tutorial →' },
  'rag-application': { id: 'chatgpt-architecture', title: 'ChatGPT Architecture', reason: 'Understand the LLM foundation that powers RAG systems →' },
  'ai-agent-system': { id: 'chatgpt-architecture', title: 'ChatGPT Architecture', reason: 'See how agents fit into the broader LLM system design landscape →' },
  'chatgpt-architecture': { id: 'instagram-architecture', title: 'Instagram Architecture', reason: 'Explore how social platforms handle massive write volumes →' },
  'instagram-architecture': { id: 'netflix-architecture', title: 'Netflix Architecture', reason: 'See how streaming platforms optimize for read-heavy workloads →' },
  'netflix-architecture': { id: 'uber-architecture', title: 'Uber Architecture', reason: 'Learn how real-time and geospatial systems work at scale →' },
  'uber-architecture': { id: 'whatsapp-architecture', title: 'WhatsApp Architecture', reason: 'Understand how messaging systems achieve billion-user scale →' },
  'whatsapp-architecture': { id: 'stripe-architecture', title: 'Stripe Architecture', reason: 'Build financial systems with ACID guarantees and idempotency →' },
  'stripe-architecture': { id: 'youtube-architecture', title: 'YouTube Architecture', reason: 'Learn how video platforms handle upload pipelines and CDN →' },
  'youtube-architecture': { id: 'spotify-architecture', title: 'Spotify Architecture', reason: 'Explore how audio streaming systems work →' },
  'spotify-architecture': { id: 'discord-architecture', title: 'Discord Architecture', reason: 'Understand real-time voice and text communication at scale →' },
  'discord-architecture': { id: 'notion-architecture', title: 'Notion Architecture', reason: 'Learn how collaborative editing handles conflict resolution →' },
  'notion-architecture': { id: 'twitter-architecture', title: 'Twitter Architecture', reason: 'Master the fan-out problem in social media systems →' },
  'twitter-architecture': { id: 'airbnb-architecture', title: 'Airbnb Architecture', reason: 'Explore two-sided marketplace architecture and search →' },
  'airbnb-architecture': { id: 'linkedin-architecture', title: 'LinkedIn Architecture', reason: 'Learn how professional networks handle graph traversal at scale →' },
  'linkedin-architecture': { id: 'shopify-architecture', title: 'Shopify Architecture', reason: 'Understand e-commerce platform architecture for merchants →' },
  'shopify-architecture': { id: 'doordash-architecture', title: 'DoorDash Architecture', reason: 'See how delivery platforms handle routing and logistics →' },
  'doordash-architecture': { id: 'figma-architecture', title: 'Figma Architecture', reason: 'Explore how collaborative design tools handle CRDTs →' },
  'figma-architecture': { id: 'zoom-architecture', title: 'Zoom Architecture', reason: 'Understand video conferencing at massive scale →' },
  'zoom-architecture': { id: 'github-architecture', title: 'GitHub Architecture', reason: 'Learn how code collaboration platforms are built →' },
  'github-architecture': { id: 'openclaw-architecture', title: 'OpenClaw Architecture', reason: 'Explore multi-tenant SaaS architecture →' },
  'openclaw-architecture': { id: 'url-shortener', title: 'URL Shortener', reason: 'Practice the classic interview question with hashing and caching →' },
};

const LEARNED: Record<string, { heading: string; items: string[] }> = {
  'url-shortener': {
    heading: 'What you learned about URL shorteners',
    items: [
      'Why consistent hashing keeps redirect caches hot',
      'How write batching prevents database saturation',
      'Why semantic caching saves 30-60% of compute on common queries',
    ],
  },
  'rag-application': {
    heading: 'What you learned about RAG systems',
    items: [
      'Why chunking strategy determines 80% of RAG quality',
      'How vector similarity enables semantic search across different wording',
      'Why semantic caching dramatically reduces LLM API costs',
    ],
  },
  'ai-agent-system': {
    heading: 'What you learned about AI agent systems',
    items: [
      'How multi-agent orchestration decomposes complex goals into sub-tasks',
      'Why token budgets at the gateway prevent runaway agent loops',
      'How agent memory enables context-aware, persistent behavior',
    ],
  },
  'chatgpt-architecture': {
    heading: 'What you learned about ChatGPT architecture',
    items: [
      'How LLMs connect to real-time data via RAG pipelines',
      'Why vector databases enable semantic search over private data',
      'How load balancers and observability make AI systems production-ready',
    ],
  },
  'instagram-architecture': {
    heading: 'What you learned about Instagram architecture',
    items: [
      'How CDNs serve media at global scale with 95%+ cache hit rates',
      'Why Kafka decouples microservices for independent scaling',
      'How feed pre-computation enables instant timeline loads',
    ],
  },
  'netflix-architecture': {
    heading: 'What you learned about Netflix architecture',
    items: [
      'How edge caching reduces origin traffic to near zero',
      'Why stateless services scale horizontally without coordination',
      'How recommendation ML models rank content for personalized homescreens',
    ],
  },
  'uber-architecture': {
    heading: 'What you learned about Uber architecture',
    items: [
      'How geospatial indexes enable real-time driver-passenger matching',
      'Why microservice orchestration handles complex trip workflows',
      'How real-time pricing balances supply and demand instantly',
    ],
  },
  'whatsapp-architecture': {
    heading: 'What you learned about WhatsApp architecture',
    items: [
      'Why end-to-end encryption means servers never see plaintext messages',
      'How store-and-forward enables 30-day message delivery guarantees',
      'Why presence detection needs its own dedicated service at billion-user scale',
    ],
  },
  'stripe-architecture': {
    heading: 'What you learned about Stripe architecture',
    items: [
      'How idempotency keys prevent double charges in distributed systems',
      'Why double-entry bookkeeping creates an immutable, auditable ledger',
      'How webhook retry with exponential backoff guarantees reliable notifications',
    ],
  },
  'youtube-architecture': {
    heading: 'What you learned about YouTube architecture',
    items: [
      'Why 20+ transcoded versions per video enable adaptive bitrate streaming',
      'How signed URLs provide elegant video DRM without server proxying',
      'Why per-title encoding reduces CDN costs while improving quality',
    ],
  },
  'spotify-architecture': {
    heading: 'What you learned about Spotify architecture',
    items: [
      'How event sourcing captures every play as an immutable event',
      'Why Apache Kafka enables fan-out to dozens of downstream consumers',
      'How ML models personalize playlists at 600M user scale',
    ],
  },
  'discord-architecture': {
    heading: 'What you learned about Discord architecture',
    items: [
      'Why WebRTC requires a signaling channel before peer-to-peer media can flow',
      'How TURN servers relay traffic for 15-20% of users behind strict firewalls',
      'Why Cassandra partitions messages by channel_id for fast range queries',
    ],
  },
  'notion-architecture': {
    heading: 'What you learned about Notion architecture',
    items: [
      'How operational transforms let two people edit the same sentence simultaneously',
      'Why block-level operations make conflict resolution tractable',
      'How pre-signed URLs let clients upload files directly to storage',
    ],
  },
  'twitter-architecture': {
    heading: 'What you learned about Twitter architecture',
    items: [
      'Why hybrid push/pull fan-out caps write amplification for celebrity accounts',
      'How Snowflake IDs enable distributed, time-ordered tweet lookups',
      'Why Redis sorted sets make timeline reads sub-millisecond',
    ],
  },
  'airbnb-architecture': {
    heading: 'What you learned about Airbnb architecture',
    items: [
      'Why search ranking uses ML models instead of simple filters',
      'How availability blocking handles concurrent booking conflicts',
      'Why two-sided marketplaces need fraud prevention on both host and guest sides',
    ],
  },
  'linkedin-architecture': {
    heading: 'What you learned about LinkedIn architecture',
    items: [
      'How distributed graph databases traverse billions of professional connections',
      'Why feed ranking combines engagement signals with recency and quality',
      'How Kafka enables real-time activity streams across millions of users',
    ],
  },
  'shopify-architecture': {
    heading: 'What you learned about Shopify architecture',
    items: [
      'How multi-tenant SaaS separates merchant data with strict isolation',
      'Why inventory locking prevents overselling during flash sales',
      'How checkout orchestration coordinates payments, taxes, and fulfillment atomically',
    ],
  },
  'doordash-architecture': {
    heading: 'What you learned about DoorDash architecture',
    items: [
      'How delivery assignment optimizes for distance, driver load, and delivery time',
      'Why geofencing creates delivery zones with dynamic pricing',
      'How ETA prediction combines distance, traffic, and historical data',
    ],
  },
  'figma-architecture': {
    heading: 'What you learned about Figma architecture',
    items: [
      'How CRDTs enable conflict-free collaborative editing without a central server',
      'Why operational transforms and CRDTs are two approaches to the same problem',
      'How canvas rendering optimization handles millions of objects at 60fps',
    ],
  },
  'zoom-architecture': {
    heading: 'What you learned about Zoom architecture',
    items: [
      'Why dedicated media servers are needed for large meetings despite P2P architecture',
      'How TURN relay ensures connectivity for enterprise users behind strict firewalls',
      'Why WebRTC connection establishment requires STUN/TURN server infrastructure',
    ],
  },
  'github-architecture': {
    heading: 'What you learned about GitHub architecture',
    items: [
      'How Git object storage enables distributed version control at scale',
      'Why CI runners need ephemeral environments for security and isolation',
      'How code review automation integrates with the git workflow',
    ],
  },
  'openclaw-architecture': {
    heading: 'What you learned about multi-tenant SaaS architecture',
    items: [
      'How tenant isolation is enforced at the database and application layer',
      'Why multi-region deployment requires careful data synchronization',
      'How SaaS pricing tiers drive different architectural tradeoffs',
    ],
  },
};

export function TutorialComplete({ tutorial, onRetry, onNext, onGoToCanvas }: TutorialCompleteProps) {
  const learned = LEARNED[tutorial.id] ?? null;
  const next = NEXT_TUTORIALS[tutorial.id] ?? null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="max-w-md w-full mx-4 text-center rounded-2xl p-8"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="relative">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <Trophy className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="absolute -top-1 -right-4">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">
          Great work!
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          You just designed the {tutorial.title.replace('How to Design ', '')} from scratch.
        </p>

        {learned && (
          <div
            className="text-left rounded-xl p-4 mb-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">{learned.heading}</p>
            <div className="space-y-2">
              {learned.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={onGoToCanvas}
            className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{ background: '#4f46e5' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#6366f1')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
          >
            Open this diagram in Canvas →
          </button>

          {next && (
            <button
              onClick={onNext}
              className="w-full py-2.5 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <span>Try next: {next.title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {!next && (
            <button
              onClick={onNext}
              className="w-full py-2.5 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <span>Back to tutorials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onRetry}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Retry this tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
