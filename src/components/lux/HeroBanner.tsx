'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroBannerProps {
  onBookClick?: () => void;
}

export function HeroBanner({ onBookClick }: HeroBannerProps) {
  const [activeSlide, setActiveSlide] = useState(1);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 pt-4 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[24px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden min-h-[380px] sm:min-h-[420px] flex flex-col lg:flex-row items-center justify-between"
      >
        {/* Right Side / Background Hero Image (Half width on desktop, full with gradient overlay on mobile) */}
        <div className="absolute inset-0 lg:relative lg:inset-auto lg:w-1/2 h-full min-h-[380px] order-1 lg:order-2">
          <Image
            src="/images/splash_bg.png"
            alt="Cadeira Premium de Barbeiro"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={90}
            priority
            className="object-cover object-center opacity-65 lg:opacity-85 scale-105"
          />
          {/* Gradient overlay to ensure text readability and half-width blending */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/80 to-transparent lg:from-[#151515] lg:via-[#151515]/50 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent lg:hidden" />
        </div>

        {/* Left Side: Impactful Title, Subtitle, and Gold Button */}
        <div className="relative z-10 w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center order-2 lg:order-1">
          <h1 className="text-[32px] sm:text-[36px] font-bold text-[#FFFFFF] leading-[1.15] tracking-tight">
            Seu estilo,<br />
            nosso <span className="text-[#D4AF37]">cuidado.</span>
          </h1>

          <p className="text-[15px] font-normal text-[#B3B3B3] pt-3 leading-relaxed max-w-sm">
            Agende seu horário de forma rápida e prática.
          </p>

          <div className="pt-6 sm:pt-8">
            <button
              type="button"
              onClick={onBookClick}
              className="bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-semibold text-[15px] py-4 px-8 rounded-[16px] shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-3 cursor-pointer"
            >
              <span>Agendar horário</span>
              <Calendar className="w-5 h-5 stroke-[2] shrink-0" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Banner Indicator (3 bolinhas, a central ativa) */}
      <div className="flex items-center justify-center gap-2 pt-5">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveSlide(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === idx
                ? 'w-6 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                : 'w-2 bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
