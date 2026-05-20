'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  HeartHandshake, 
  Globe, 
  Leaf, 
  Droplet, 
  ShieldCheck, 
  Layers, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

export default function CulturxPage() {
  // State for Contact Form
  const [form, setForm] = useState({ name: '', email: '', type: 'Product enquiry', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for active Duality tab on mobile/interactive preview
  const [hoveredPanel, setHoveredPanel] = useState<'black' | 'white' | null>(null);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: '', email: '', type: 'Product enquiry', message: '' });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#fbf8ef] selection:bg-[#d4af37] selection:text-[#050505] font-sans antialiased overflow-x-hidden">
      {/* Dynamic CSS Styling Injection for Extra Premium Customizations */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --black: #050505;
          --charcoal: #0c0c0c;
          --white: #fbf8ef;
          --cream: #f4efe3;
          --gold: #d4af37;
          --darkgold: #9c741d;
          --soft: #d7d1c4;
          --line: rgba(212,175,55,.25);
          --text: #151515;
        }

        html {
          scroll-behavior: smooth;
        }

        .gold-glow {
          box-shadow: 0 0 40px rgba(212, 175, 55, 0.15);
        }

        .gold-border-glow:hover {
          border-color: rgba(212, 175, 55, 0.8);
          box-shadow: 0 0 25px rgba(212, 175, 55, 0.12);
        }

        .text-gold-gradient {
          background: linear-gradient(135deg, #fbf8ef 30%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gold-btn-gradient {
          background: linear-gradient(135deg, #d4af37 0%, #8f6f16 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gold-btn-gradient:hover {
          background: linear-gradient(135deg, #fbf8ef 0%, #d4af37 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
        }

        /* Glassmorphism Classes */
        .glass-dark {
          background: rgba(12, 12, 12, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .glass-light {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(156, 116, 29, 0.2);
        }
      ` }} />

      {/* FIXED NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col md:flex-row justify-between items-center px-[7%] py-4 bg-[#050505]/95 md:bg-[#050505]/80 border-b border-[rgba(212,175,55,.25)] backdrop-blur-md transition-all duration-300">
        <div className="flex justify-between items-center w-full md:w-auto">
          <a href="#" className="brand text-[#d4af37] font-bold text-xl tracking-[4px] hover:opacity-90 transition-opacity">
            CULTURX™
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 md:mt-0">
          {[
            { label: 'Duality', href: '#duality' },
            { label: 'Ecosystem', href: '#ecosystem' },
            { label: 'Products', href: '#products' },
            { label: 'Bodyworks', href: '#bodyworks' },
            { label: 'Philosophy', href: '#philosophy' },
            { label: 'Contact', href: '#contact' }
          ].map((link, idx) => (
            <a 
              key={idx}
              href={link.href} 
              className="text-[#fbf8ef] text-xs font-semibold uppercase tracking-[1.5px] hover:text-[#d4af37] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-6 pt-32 pb-20 md:pt-40 md:pb-32 bg-radial-gradient">
        {/* Luxury Atmospheric Background Effects */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_25%,rgba(212,175,55,0.18),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-[linear-gradient(180deg,#050505_0%,#0f0f0f_50%,#050505_100%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-[1050px] mx-auto space-y-8 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/5 text-[#d4af37] text-xs font-semibold uppercase tracking-[3px] animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Clinically Engineered for Gut Health
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-[4px] uppercase leading-none select-none text-gold-gradient py-2">
            CULTURX™
          </h1>
          
          <h2 className="text-2xl md:text-5xl font-extrabold uppercase tracking-[2px] leading-tight max-w-[950px] mx-auto text-[#fbf8ef]">
            Internal. External. <span className="text-[#d4af37]">Optimized.</span>
            <span className="block text-lg md:text-2xl font-light text-[#d7d1c4] tracking-[3px] normal-case mt-4">
              Integrated for Elite Human Performance.
            </span>
          </h2>
          
          <p className="max-w-[780px] mx-auto text-base md:text-xl text-[#d7d1c4] font-light leading-relaxed">
            Where Science Meets Fermentation. Precision-fermented kombucha, bioactive lipid systems, clinical bodywork and concierge recovery built into one premium optimization ecosystem.
          </p>

          <div className="pt-6">
            <a 
              href="#contact" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-[1.5px] text-[#050505] gold-btn-gradient"
            >
              Begin Recalibration
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* DUALITY SPLIT SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[640px] border-y border-[#d4af37]/20" id="duality">
        {/* Black System (Performance) */}
        <div 
          className={`panel flex flex-col justify-center px-[8%] py-16 md:py-24 transition-all duration-500 relative overflow-hidden bg-gradient-to-br from-[#050505] to-[#121212] group ${
            hoveredPanel === 'black' ? 'md:scale-[1.02] z-10' : hoveredPanel === 'white' ? 'opacity-40' : ''
          }`}
          onMouseEnter={() => setHoveredPanel('black')}
          onMouseLeave={() => setHoveredPanel(null)}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-48 h-48 text-[#d4af37]" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="text-[#d4af37] uppercase tracking-[3px] text-xs font-semibold">
              Black System
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-[2px] leading-none text-[#fbf8ef]">
              Performance.<br />
              <span className="text-[#d4af37] text-glow">Activation.</span><br />
              Execution.
            </h2>
            
            <div className="h-0.5 w-12 bg-[#d4af37]/65" />
            
            <p className="font-bold text-sm tracking-wider uppercase text-[#fbf8ef]/90">
              BLACK = PERFORMANCE
            </p>
            
            <p className="text-[#d7d1c4] text-base font-light leading-relaxed max-w-[480px]">
              The black identity anchors CulturX as a high-performance, luxury biohack brand: bold, controlled, elite and engineered for action.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-4">
              {['Go Crush It', 'External Performance', 'Human Excellence'].map((pill, idx) => (
                <span 
                  key={idx} 
                  className="inline-block px-4 py-2 border border-[#d4af37]/45 rounded-full text-[#d4af37] text-xs uppercase tracking-[2px] hover:bg-[#d4af37] hover:text-[#050505] transition-all duration-300 cursor-default"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* White System (Clinical Intelligence) */}
        <div 
          className={`panel flex flex-col justify-center px-[8%] py-16 md:py-24 transition-all duration-500 relative overflow-hidden bg-gradient-to-br from-[#ffffff] to-[#f4efe3] text-[#151515] group ${
            hoveredPanel === 'white' ? 'md:scale-[1.02] z-10 shadow-2xl' : hoveredPanel === 'black' ? 'opacity-40' : ''
          }`}
          onMouseEnter={() => setHoveredPanel('white')}
          onMouseLeave={() => setHoveredPanel(null)}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Leaf className="w-48 h-48 text-[#9c741d]" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="text-[#9c741d] uppercase tracking-[3px] text-xs font-semibold">
              White System
            </div>

            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-[2px] leading-none text-[#151515]">
              Clinical.<br />
              <span className="text-[#d4af37]">Regulation.</span><br />
              Intelligence.
            </h2>

            <div className="h-0.5 w-12 bg-[#9c741d]/65" />

            <p className="font-bold text-sm tracking-wider uppercase text-[#151515]/90">
              WHITE = CLINICAL INTELLIGENCE
            </p>

            <p className="text-[#333] text-base font-light leading-relaxed max-w-[480px]">
              The white identity gives the brand air, trust and clinical refinement: precision fermentation, education, product intelligence and internal order.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              {['Internal Order', 'External Excellence', 'Optimized From Within'].map((pill, idx) => (
                <span 
                  key={idx} 
                  className="inline-block px-4 py-2 border border-[#9c741d]/45 rounded-full text-[#9c741d] text-xs uppercase tracking-[2px] hover:bg-[#9c741d] hover:text-[#ffffff] transition-all duration-300 cursor-default"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM SECTION */}
      <section className="py-20 md:py-32 px-[9%] bg-[radial-gradient(circle_at_right,rgba(212,175,55,0.12),transparent_40%)]" id="ecosystem">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="space-y-4">
            <div className="text-[#d4af37] uppercase tracking-[3px] text-xs font-semibold">
              The Ecosystem
            </div>
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-[2px]">
              CulturX™ is a Movement.<br />
              <span className="text-[#d4af37] text-glow">Not Just a Supplement.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-dark rounded-[24px] p-8 space-y-6 hover:-translate-y-2 hover:border-[#d4af37]/70 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                <Droplet className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-wider text-[#fbf8ef]">Product</h3>
                <p className="text-[#d4af37] font-semibold text-sm">CulturX Ferments</p>
              </div>
              <p className="text-[#d7d1c4] font-light text-sm leading-relaxed">
                Precision-fermented kombucha, probiotic tonics and advanced gut elixirs engineered for internal regulation and microbiome optimization.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-dark rounded-[24px] p-8 space-y-6 hover:-translate-y-2 hover:border-[#d4af37]/70 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-wider text-[#fbf8ef]">Service</h3>
                <p className="text-[#d4af37] font-semibold text-sm">CulturX Clinical Bodywork</p>
              </div>
              <p className="text-[#d7d1c4] font-light text-sm leading-relaxed">
                External regulation through nervous system downregulation, lymphatic drainage, abdominal therapy, fascia work and circulation optimization.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-dark rounded-[24px] p-8 space-y-6 hover:-translate-y-2 hover:border-[#d4af37]/70 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-wider text-[#fbf8ef]">Platform</h3>
                <p className="text-[#d4af37] font-semibold text-sm">CulturX Concierge</p>
              </div>
              <p className="text-[#d7d1c4] font-light text-sm leading-relaxed">
                Hospitality, travel wellness, premium client recovery and distribution for the CulturX performance ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      <section className="py-20 md:py-32 px-[9%] bg-gradient-to-br from-[#ffffff] to-[#f4efe3] text-[#151515] border-t border-[#d4af37]/10" id="products">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="space-y-4">
            <div className="text-[#9c741d] uppercase tracking-[3px] text-xs font-semibold">
              CulturX Product System
            </div>
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-[2px]">
              Internal Order.<br />
              <span className="text-[#d4af37]">External Excellence.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Classic Ginger Kombucha',
                subtitle: 'Precision Fermented Kombucha',
                bullets: [
                  'Raw live cultures',
                  'Digestive regulation support',
                  'Classic ginger activation profile',
                  'Daily microbiome ritual'
                ]
              },
              {
                title: 'Veggie-Might Elixer™',
                subtitle: 'Advanced Functional Tonic',
                bullets: [
                  'Mineral-rich formulation',
                  'Cellular nourishment support',
                  'Internal recalibration system',
                  'Daily vitality enhancement'
                ]
              },
              {
                title: 'Trinity Salve-ation™',
                subtitle: 'Regenerative Recovery Formula',
                bullets: [
                  'Recovery and restoration positioning',
                  'Biomechanical support system',
                  'Elite regeneration concept',
                  'Premium wellness architecture'
                ]
              },
              {
                title: 'Polyphenol Lipid Complex™',
                subtitle: 'MCT + EVOO Hybrid',
                bullets: [
                  'High-polyphenol EVOO integration',
                  'Bioactive lipid delivery',
                  'Clean sustained energy',
                  'Performance optimization support'
                ]
              }
            ].map((prod, idx) => (
              <div 
                key={idx} 
                className="bg-white/80 border border-[#9c741d]/15 rounded-[24px] p-6 space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-[#9c741d]/10 flex items-center justify-center text-[#9c741d]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold uppercase tracking-tight text-[#151515] leading-tight">
                      {prod.title}
                    </h3>
                    <p className="text-[#9c741d] font-bold text-xs uppercase tracking-wider">{prod.subtitle}</p>
                  </div>
                </div>

                <ul className="space-y-2 border-t border-[#9c741d]/10 pt-4 flex-grow">
                  {prod.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2 text-xs text-[#333]">
                      <span className="text-[#9c741d] font-bold text-sm leading-none">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DUAL CAMPAIGNS */}
      <section className="grid grid-cols-1 md:grid-cols-2 border-y border-[#d4af37]/20">
        {/* Campaign 1: Oil */}
        <div className="py-24 px-[9%] bg-gradient-to-br from-[#050505] to-[#0f0f0f] flex flex-col justify-center space-y-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(212,175,55,0.08),transparent_40%)] pointer-events-none" />
          <div className="text-[#d4af37] uppercase tracking-[3px] text-xs font-semibold">
            Hero Oil Campaign
          </div>
          <h2 className="text-6xl md:text-8xl font-black uppercase leading-none select-none tracking-tight">
            Go<br /><span className="text-[#d4af37] text-glow">Crush It.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#d7d1c4] font-light leading-relaxed max-w-[480px]">
            CulturX Polyphenol Lipid Complex™ is the performance side of the ecosystem: a bioactive MCT + EVOO hybrid system for cellular energy, recovery and optimization.
          </p>
        </div>

        {/* Campaign 2: Kombucha */}
        <div className="py-24 px-[9%] bg-gradient-to-br from-[#ffffff] to-[#f4efe3] text-[#151515] flex flex-col justify-center space-y-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(156,116,29,0.08),transparent_40%)] pointer-events-none" />
          <div className="text-[#9c741d] uppercase tracking-[3px] text-xs font-semibold">
            Kombucha Campaign
          </div>
          <h2 className="text-6xl md:text-8xl font-black uppercase leading-none tracking-tight">
            Optimized<br /><span className="text-[#9c741d]">From Within.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#333] font-light leading-relaxed max-w-[480px]">
            CulturX Kombucha is the regulation side of the ecosystem: a live cultured daily ritual for internal order, balance and external excellence.
          </p>
        </div>
      </section>

      {/* BODYWORKS SECTION */}
      <section className="py-20 md:py-32 px-[9%]" id="bodyworks">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="space-y-4">
            <div className="text-[#d4af37] uppercase tracking-[3px] text-xs font-semibold">
              CulturX Bodyworks
            </div>
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-[2px]">
              Clinical Bodywork.<br />
              <span className="text-[#d4af37] text-glow">External Regulation.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'The Reset',
                price: '$300',
                duration: '60 min',
                description: 'Nervous system + circulation. Travel fatigue, stress and downregulation support.'
              },
              {
                title: 'The Gut Protocol',
                price: '$450',
                duration: '75 min',
                description: 'Abdominal + lymphatic focus. Bloating, digestion and detox support.'
              },
              {
                title: 'The Full System',
                price: '$600',
                duration: '90 min',
                description: 'Full body + gut + lymphatic. Premium flagship recovery protocol.'
              }
            ].map((work, idx) => (
              <div 
                key={idx} 
                className="glass-dark rounded-[24px] p-8 hover:-translate-y-2 hover:border-[#d4af37] transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold uppercase tracking-wider text-[#fbf8ef]">{work.title}</h3>
                    <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div className="flex items-baseline gap-2 border-y border-[#d4af37]/15 py-3">
                    <span className="text-[#d4af37] text-3xl font-black tracking-tight">{work.price}</span>
                    <span className="text-xs text-[#d7d1c4] font-semibold uppercase tracking-wider">· {work.duration}</span>
                  </div>
                  <p className="text-sm text-[#d7d1c4] font-light leading-relaxed">
                    {work.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / CONCIERGE */}
      <section className="py-20 md:py-32 px-[9%] bg-gradient-to-br from-[#ffffff] to-[#f4efe3] text-[#151515] border-t border-[#d4af37]/10">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="space-y-4">
            <div className="text-[#9c741d] uppercase tracking-[3px] text-xs font-semibold">
              How It Works
            </div>
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-[2px]">
              CulturX Concierge
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Therapist Side',
                bullets: [
                  'Apply + get vetted',
                  'Verified specialist skills',
                  'Activate in cities they travel to',
                  'Quality control is everything'
                ]
              },
              {
                title: 'Client Side',
                bullets: [
                  'Book via app or hotel concierge',
                  'Choose treatment type',
                  'Choose therapist profile',
                  'Select hotel room, time and location'
                ]
              },
              {
                title: 'Hotel Integration',
                bullets: [
                  'Hotels partner with the platform',
                  'Offer in-room clinical wellness treatments',
                  'Focus on gut–body connection, recovery and performance'
                ]
              }
            ].map((step, idx) => (
              <div 
                key={idx} 
                className="bg-white/80 border border-[#9c741d]/15 rounded-[24px] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-extrabold uppercase tracking-tight text-[#151515]">{step.title}</h3>
                  <div className="w-8 h-8 rounded-full bg-[#9c741d]/10 text-[#9c741d] flex items-center justify-center font-bold text-xs">
                    0{idx + 1}
                  </div>
                </div>

                <ul className="space-y-3 pt-2">
                  {step.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2.5 text-xs text-[#333]">
                      <span className="text-[#9c741d] font-bold text-sm leading-none">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY SECTION */}
      <section className="py-20 md:py-32 px-[9%]" id="philosophy">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="space-y-4">
            <div className="text-[#d4af37] uppercase tracking-[3px] text-xs font-semibold">
              Philosophy
            </div>
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-[2px]">
              The Bee. The Hive. The Elixir. The X.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'The Bee',
                desc: 'A Tireless Creator. A Systems Builder. Coordinated Intelligence. Biomechanical Precision. Geometric Structural Mastery.'
              },
              {
                title: 'The Hive',
                desc: 'Homogenous systems engineering strength through balance, sequence and structure.',
                accent: 'Optimization Cracked.'
              },
              {
                title: 'The Elixir',
                desc: 'Salve-ation. Recalibrating pH balance. Restoring you. The Formula for Superior Human Output.',
                accent: 'Activation.'
              },
              {
                title: 'The X',
                desc: 'The intersection of science and nature. Next-Gen Cognition & Peak Physical Function.',
                accent: 'Inactive DNA Codes Actioned.'
              }
            ].map((phil, idx) => (
              <div 
                key={idx} 
                className="glass-dark rounded-[24px] p-6 space-y-4 hover:border-[#d4af37]/70 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-[#fbf8ef] border-b border-[#d4af37]/15 pb-2">
                    {phil.title}
                  </h3>
                  <p className="text-xs text-[#d7d1c4] font-light leading-relaxed">
                    {phil.desc}
                  </p>
                </div>
                {phil.accent && (
                  <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest pt-2">
                    {phil.accent}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Duality Summary Box */}
          <div className="glass-dark rounded-[24px] p-8 border-l-4 border-l-[#d4af37] max-w-[850px] mx-auto text-center space-y-4">
            <h3 className="text-xl font-bold uppercase tracking-widest text-[#d4af37]">Internal Order. External Excellence.</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm font-semibold tracking-[2px] text-[#fbf8ef]">
              <span className="px-4 py-1.5 bg-[#000] border border-[#d4af37]/20 rounded-full">BLACK = PERFORMANCE</span>
              <span className="text-[#d4af37] hidden sm:inline">|</span>
              <span className="px-4 py-1.5 bg-[#fbf8ef] text-[#050505] rounded-full">WHITE = CLINICAL INTELLIGENCE</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="py-20 md:py-32 px-[9%] bg-gradient-to-br from-[#ffffff] to-[#f4efe3] text-[#151515] border-t border-[#d4af37]/10" id="contact">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="space-y-4 text-center md:text-left">
            <div className="text-[#9c741d] uppercase tracking-[3px] text-xs font-semibold">
              Contact
            </div>
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-[2px]">
              Begin the Recalibration.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Details Card */}
            <div className="bg-white/80 border border-[#9c741d]/15 rounded-[24px] p-8 shadow-sm space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-[#151515]">Contact Details</h3>
                <div className="h-0.5 w-12 bg-[#9c741d]/65" />
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-base font-extrabold text-[#151515]">Gabriela Popa</p>
                  <p className="text-xs text-[#9c741d] font-bold uppercase tracking-wider">Founder</p>
                </div>

                <div className="space-y-4 text-xs font-medium text-[#333]">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#9c741d]" />
                    <a href="mailto:GP@Culturx.com.au" className="hover:underline">GP@Culturx.com.au</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#9c741d]" />
                    <a href="tel:+61457788884" className="hover:underline">+61 457 788 884</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-[#9c741d]" />
                    <a href="https://www.culturx.com.au" target="_blank" rel="noopener noreferrer" className="hover:underline">www.culturx.com.au</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#9c741d]" />
                    <span>Melbourne, Victoria, Australia</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enquiries Card */}
            <div className="bg-white/80 border border-[#9c741d]/15 rounded-[24px] p-8 shadow-sm space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-[#151515]">Enquiries</h3>
                <div className="h-0.5 w-12 bg-[#9c741d]/65" />
              </div>

              <ul className="space-y-4 text-xs font-semibold text-[#333]">
                {[
                  'Product enquiries',
                  'Hotel partnerships',
                  'Corporate affiliates',
                  'Concierge bookings',
                  'Therapist applications'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#9c741d]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Form Card */}
            <div className="bg-white/80 border border-[#9c741d]/15 rounded-[24px] p-8 shadow-sm space-y-6 lg:col-span-1">
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-[#151515]">Contact Form</h3>
                <p className="text-xs text-[#666] font-medium">Submit your credentials for access.</p>
              </div>

              {submitted ? (
                <div className="bg-[#9c741d]/10 border border-[#9c741d]/20 rounded-xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-12 h-12 rounded-full bg-[#9c741d]/20 flex items-center justify-center mx-auto text-[#9c741d]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-[#151515] text-sm">Enquiry Submitted</p>
                    <p className="text-xs text-[#666] leading-relaxed">Our concierge will contact you within 24 hours to begin recalibration.</p>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      required
                      placeholder="Name" 
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#9c741d]/25 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/35 focus:border-[#d4af37] text-xs font-semibold transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <input 
                      type="email" 
                      required
                      placeholder="Email" 
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#9c741d]/25 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/35 focus:border-[#d4af37] text-xs font-semibold transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <select 
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#9c741d]/25 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/35 focus:border-[#d4af37] text-xs font-semibold transition-all cursor-pointer"
                    >
                      <option>Product enquiry</option>
                      <option>Concierge booking</option>
                      <option>Hotel partnership</option>
                      <option>Corporate affiliate</option>
                      <option>Therapist application</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <textarea 
                      required
                      rows={4} 
                      placeholder="Message" 
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#9c741d]/25 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/35 focus:border-[#d4af37] text-xs font-semibold transition-all resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-[1.5px] text-[#050505] gold-btn-gradient flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-[#050505] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Submit Enquiry
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-[7%] text-center text-xs font-semibold uppercase tracking-[1.5px] text-[#888] border-t border-[#d4af37]/25 bg-[#050505]">
        CULTURX™ — Internal. External. Optimized. Integrated for Elite Human Performance.
      </footer>
    </div>
  );
}
