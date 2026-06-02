'use client';

import { Boxes, Zap, LayoutTemplate, Link2, Download, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

const features: { Icon: LucideIcon; color: string; title: string; desc: string }[] = [
  { Icon: Boxes,          color: '#595959', title: '150+ Components',    desc: 'Pre-built nodes for every layer — auth, databases, queues, AI services, cloud infra and more.' },
  { Icon: Zap,            color: '#3b82f6', title: 'Smart Auto Layout',  desc: "One click to organize your entire diagram with Dagre's hierarchical layout algorithm." },
  { Icon: LayoutTemplate, color: '#595959', title: 'Real-time Templates', desc: 'Start from battle-tested architectures — ChatGPT, Instagram, Netflix and more.' },
  { Icon: Link2,          color: '#10b981', title: 'Share with a Link',  desc: 'Generate a shareable URL for any diagram. Anyone can view and interact — no account needed.' },
  { Icon: Download,       color: '#f59e0b', title: 'Export as PNG',      desc: 'Export high-resolution images for docs, presentations, or Notion pages. 3× resolution.' },
  { Icon: LayoutGrid,     color: '#06b6d4', title: 'Multiple Canvases',  desc: 'Work on different systems simultaneously with tabbed canvases. Switch instantly.' },
];

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export function Features() {
  return (
    <section className="py-28 px-6" id="features">
      <div className="max-w-5xl mx-auto">
        {/* Floating card container */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="bg-card rounded-3xl p-8 md:p-12 shadow-soft-3"
        >
          <header className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Everything you need to diagram faster
            </h2>
          </header>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={cardVariants}
                whileHover={{ 
                  y: -5, 
                  boxShadow: `0 10px 30px -10px ${f.color}40`,
                  transition: { type: 'spring', stiffness: 300, damping: 20 }
                }}
                className="p-6 rounded-2xl bg-secondary soft-card cursor-default"
              >
                <div className="flex flex-col gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: f.color + '15' }}
                  >
                    <f.Icon style={{ width: 18, height: 18, color: f.color }} />
                  </motion.div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}