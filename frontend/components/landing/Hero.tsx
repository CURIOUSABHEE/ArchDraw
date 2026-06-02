'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-secondary rounded-xl" />,
});

export function Hero() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Mouse tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  if (!isClient) {
    return (
      <section className="relative min-h-screen overflow-hidden pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
            <div className="h-[400px]" />
            <div className="h-[400px] bg-card rounded-2xl shadow-soft-4" />
          </div>
        </div>
      </section>
    );
  }

  // Define headline words
  const titleLine1 = "Design system architecture".split(" ");
  const titleLine2 = "in minutes.".split(" ");

  return (
    <section className="relative min-h-screen overflow-hidden pt-28">
      {/* Background Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-40 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] -z-10 pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-12 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
          <motion.div 
            className="flex flex-col justify-center"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Headline */}
            <h1 className="font-bold text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1] mb-6">
              <div className="flex flex-wrap gap-x-3 text-foreground">
                {titleLine1.map((word, index) => (
                  <motion.span key={index} variants={itemVariants}>{word}</motion.span>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 mt-2">
                {titleLine2.map((word, index) => (
                  <motion.span 
                    key={index} 
                    variants={itemVariants}
                    className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </h1>

            {/* Power Line */}
            <motion.p variants={itemVariants} className="text-xl font-semibold text-foreground mb-6">
              Stop drawing boxes. Start thinking in systems.
            </motion.p>

            {/* Subtext */}
            <motion.p variants={itemVariants} className="mb-8 text-lg leading-relaxed max-w-[520px] text-muted-foreground">
              Generate, edit, and scale system diagrams using AI and visual tools — no setup required.
              <br />
              <span className="text-muted-foreground">From microservices to data pipelines — design faster.</span>
            </motion.p>

            {/* CTA Row */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 flex-wrap mb-8">
              {initialized && user ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium rounded-xl transition-all hover:scale-[1.02] shadow-soft-2 hover:shadow-soft-3 bg-primary text-primary-foreground relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">Go to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </button>
              ) : (
                <button
                  onClick={() => router.push('/editor')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium rounded-xl transition-all hover:scale-[1.02] shadow-soft-2 hover:shadow-soft-3 bg-primary text-primary-foreground relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">Start designing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </button>
              )}
              <button
                onClick={() => router.push('/templates')}
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium rounded-xl hover:bg-accent transition-all bg-secondary text-secondary-foreground"
              >
                View templates
              </button>
            </motion.div>

            {/* Trust Row */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6 mt-4">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[hsl(var(--accent-green))]/20">
                  <svg className="w-3 h-3 text-[hsl(var(--accent-green))]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                No setup required
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[hsl(var(--accent-green))]/20">
                  <svg className="w-3 h-3 text-[hsl(var(--accent-green))]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                150+ architecture components
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-accent">
                  <Sparkles className="w-3 h-3 text-muted-foreground" />
                </div>
                AI-powered generation
              </span>
            </motion.div>
          </motion.div>

          {/* Right Side Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            className="relative perspective-[1000px]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              className="relative rounded-2xl overflow-hidden bg-card shadow-soft-4"
            >
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fbbf24' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
                </div>
                <div className="flex-1 mx-4">
                  <div className="rounded-lg px-3 py-1 text-[10px] text-center max-w-[180px] mx-auto bg-secondary text-muted-foreground">
                    archdraw.app/editor
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent">
                  <Sparkles className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] font-medium text-muted-foreground">Live preview</span>
                </div>
              </div>

              <div className="h-[380px] bg-card relative overflow-hidden">
                <HeroCanvas />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}