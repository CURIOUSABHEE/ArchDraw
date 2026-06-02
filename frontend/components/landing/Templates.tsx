'use client';

import { useRouter } from 'next/navigation';
import { Bot, Camera, Film, Car, Layers, Brain, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, type Variants } from 'framer-motion';

const templates: { Icon: LucideIcon; name: string; desc: string; nodes: string; tags: string[]; accent: string }[] = [
  { Icon: Bot,    name: 'ChatGPT Architecture', desc: 'LLM RAG pipeline, vector DB, streaming',          nodes: '14', tags: ['AI', 'LLM', 'RAG'],        accent: '#5A5A5A' },
  { Icon: Camera, name: 'Instagram',            desc: 'Feed service, media pipeline, Kafka, CDN',        nodes: '22', tags: ['Social', 'Kafka'],          accent: '#5A5A5A' },
  { Icon: Film,   name: 'Netflix',              desc: 'Video transcoding, CDN, recommendation ML',       nodes: '18', tags: ['Streaming', 'CDN', 'ML'],   accent: '#ef4444' },
  { Icon: Car,    name: 'Uber',                 desc: 'Real-time matching, maps API, location tracking', nodes: '26', tags: ['Real-time', 'Maps'],        accent: '#f59e0b' },
  { Icon: Layers, name: 'ArchFlow itself',      desc: 'The architecture of this very tool',              nodes: '23', tags: ['Next.js', 'Supabase'],      accent: '#10b981' },
  { Icon: Brain,  name: 'RAG Application',      desc: 'Vector DB, embeddings, LLM, retrieval pipeline', nodes: '10', tags: ['AI', 'Vector', 'RAG'],      accent: '#5A5A5A' },
];

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function Templates() {
  const router = useRouter();

  return (
    <section className="py-28 px-6 sm:px-12 lg:px-24" id="templates">
      <div className="max-w-6xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary">Templates</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Start from real-world architectures
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Learn system design by exploring how the world&apos;s biggest products are built.
          </p>
        </motion.header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {templates.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              className="p-5 flex flex-col justify-between cursor-pointer rounded-2xl bg-card transition-colors hover:bg-card/80 border border-transparent hover:border-border/50"
              style={{ boxShadow: '0 4px 16px hsl(var(--foreground) / 0.06)' }}
              onClick={() => router.push('/editor')}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.accent + '15' }}>
                      <t.Icon style={{ width: 15, height: 15, color: t.accent }} />
                    </div>
                    <h3 className="font-semibold text-foreground">{t.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-medium">{t.nodes} Nodes</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ borderColor: t.accent + '30', color: t.accent, backgroundColor: t.accent + '10' }}
                    >{tag}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-sm flex items-center gap-1 font-medium text-primary">
                Load template
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-14 text-center flex flex-wrap items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/editor')}
            className="px-5 py-2.5 text-sm font-medium border border-foreground/10 rounded-xl hover:bg-accent transition-colors"
          >
            Browse all templates →
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/tutorials')}
            className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-colors flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            Try interactive tutorials
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
