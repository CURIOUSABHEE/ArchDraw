'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  { q: 'Is ArchFlow really free?', a: 'Yes. ArchFlow is completely free during beta. You can create unlimited diagrams, use all templates, and export without any limits.' },
  { q: 'Do I need an account to use it?', a: 'No. You can start designing immediately without signing up. Create an account only when you want to save, share, or download your diagrams.' },
  { q: 'How is this different from Lucidchart or draw.io?', a: 'ArchFlow is purpose-built for software architecture — not general diagrams. Every component, template, and feature is designed for engineers thinking about systems.' },
  { q: 'Can I share my diagrams with teammates?', a: 'Yes. Click Share to generate a public link. Anyone with the link can view and interact with your diagram without needing an account.' },
  { q: 'What export formats are supported?', a: 'Currently PNG at 3× resolution (print-ready quality). PDF and SVG exports are on the roadmap.' },
  { q: 'Is my data secure?', a: 'Your diagrams are stored securely in Supabase (PostgreSQL). Guest diagrams are stored locally in your browser. We never sell your data.' },
];

export function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const els = section.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-28 px-4 sm:px-6 lg:px-8 bg-background" id="faq">
      <div className="max-w-2xl mx-auto h-px mb-20 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-2xl mx-auto">
        <header className="reveal text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4 text-primary">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Frequently asked questions</h2>
        </header>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className={`reveal reveal-delay-${Math.min(i + 1, 5)} rounded-xl border border-border/50 bg-card px-4 overflow-hidden`}
            >
              <AccordionTrigger className="hover:no-underline text-left">
                <span className="font-medium text-foreground">{faq.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
