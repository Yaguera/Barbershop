'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroBannerProps {
  onBookClick?: () => void;
}

export function HeroBanner({ onBookClick }: HeroBannerProps) {
  return (
    <section className="w-full relative overflow-hidden min-h-[420px] sm:min-h-[480px] flex flex-col justify-between select-none">
      {/* Full Width Background Image */}
      <Image
        src="/images/splash_bg.png"
        alt="Cadeira Premium de Barbeiro"
        fill
        sizes="100vw"
        quality={95}
        priority
        className="object-cover object-center"
      />

      {/* Top Gradient Fade (Mescla suave com o Header/Fundo #0D0D0D) */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent z-10 pointer-events-none" />

      {/* Bottom Gradient Fade (Mescla suave com o fundo #0D0D0D da parte inferior) */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/85 to-transparent z-10 pointer-events-none" />

      {/* Left/Side Dark Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/80 to-transparent z-10 pointer-events-none" />

      {/* Overall subtle contrast tint */}
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

      {/* Left-Aligned Text Content Container */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-6 flex-1 flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md"
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#FFFFFF] leading-[1.15] tracking-tight drop-shadow-md">
            Seu estilo,<br />
            nosso <span className="text-[#D4AF37]">cuidado.</span>
          </h1>

          <p className="text-xs sm:text-sm font-normal text-white/70 pt-2.5 leading-relaxed max-w-xs drop-shadow">
            Agende seu horário de forma rápida e prática.
          </p>

          <div className="pt-6">
            <button
              type="button"
              onClick={onBookClick}
              className="bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] inline-flex items-center gap-2.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>AGENDAR HORÁRIO</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
