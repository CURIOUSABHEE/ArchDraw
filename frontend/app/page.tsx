'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Templates } from '@/components/landing/Templates';
import { ComponentsShowcase } from '@/components/landing/ComponentsShowcase';
import { UseCases } from '@/components/landing/UseCases';
import { FAQ } from '@/components/landing/FAQ';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

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
      <div className="min-h-screen bg-white font-sans" style={{ scrollBehavior: 'smooth' }}>
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
