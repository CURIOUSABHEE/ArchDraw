'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { Features } from '@/components/landing/Features';

// Below-fold sections — lazy loaded
const HowItWorks        = dynamic(() => import('@/components/landing/HowItWorks').then(m => ({ default: m.HowItWorks })), { loading: () => <div className="min-h-[400px]" /> });
const Templates         = dynamic(() => import('@/components/landing/Templates').then(m => ({ default: m.Templates })), { loading: () => <div className="min-h-[400px]" /> });
const ComponentsShowcase = dynamic(() => import('@/components/landing/ComponentsShowcase').then(m => ({ default: m.ComponentsShowcase })), { loading: () => <div className="min-h-[400px]" /> });
const UseCases          = dynamic(() => import('@/components/landing/UseCases').then(m => ({ default: m.UseCases })), { loading: () => <div className="min-h-[400px]" /> });
const FAQ               = dynamic(() => import('@/components/landing/FAQ').then(m => ({ default: m.FAQ })), { loading: () => <div className="min-h-[400px]" />, ssr: false });
const CTASection        = dynamic(() => import('@/components/landing/CTASection').then(m => ({ default: m.CTASection })), { loading: () => <div className="min-h-[200px]" /> });
const Footer            = dynamic(() => import('@/components/landing/Footer').then(m => ({ default: m.Footer })), { loading: () => <div className="min-h-[100px]" /> });

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ArchFlow',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'Visual system architecture design tool for engineers',
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen font-sans">
        <Navbar />
        <main>
          <Hero />
          <SocialProof />
          <Features />
          <HowItWorks />
          <Templates />
          <ComponentsShowcase />
          <UseCases />
          <FAQ />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
}
