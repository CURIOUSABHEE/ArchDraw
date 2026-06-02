'use client';

import { GraduationCap, FileText, BarChart2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

const cases: { Icon: LucideIcon; color: string; title: string; desc: string }[] = [
  { Icon: GraduationCap, color: '#595959', title: 'System Design Interviews',  desc: 'Practice drawing architectures for FAANG interviews. Use real templates as study guides.' },
  { Icon: FileText,      color: '#3b82f6', title: 'Engineering Documentation', desc: 'Replace Confluence diagrams with interactive, shareable architecture docs.' },
  { Icon: BarChart2,     color: '#595959', title: 'Technical Presentations',   desc: 'Export clean diagrams for pitch decks, RFCs, and engineering all-hands.' },
  { Icon: Users,         color: '#10b981', title: 'Team Onboarding',           desc: 'Help new engineers understand your system architecture from day one.' },
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

export function UseCases() {
  return (
    <section className="py-28 px-6" id="use-cases">
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
            <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary">Use Cases</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Built for every kind of systems thinker
            </h2>
          </header>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            {cases.map((c) => (
              <motion.div
                key={c.title}
                variants={cardVariants}
                whileHover={{ 
                  y: -5, 
                  boxShadow: `0 10px 30px -10px ${c.color}40`,
                  transition: { type: 'spring', stiffness: 300, damping: 20 }
                }}
                className="p-6 rounded-2xl bg-secondary soft-card cursor-default"
              >
                <div className="flex flex-col gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: c.color + '15' }}
                  >
                    <c.Icon style={{ width: 18, height: 18, color: c.color }} />
                  </motion.div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-foreground">{c.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
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