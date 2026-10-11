'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import Image from 'next/image';

interface HeroBannerProps {
  onBookClick?: () => void;
}

export function HeroBanner({ onBookClick }: HeroBannerProps) {
  return (
    <section className="w-full relative overflow-hidden min-h-[290px] sm:min-h-[360px] flex flex-col justify-end select-none">
      {/* Full Width Background Image */}
      <Image
        src="/images/splash_bg.png"
        alt="Cadeira e ambiente da Barbearia"
        fill
        sizes="100vw"
        quality={90}
        priority
        className="object-cover object-center"
      />

      {/* Balanced subtle gradient overlays preserving photo visibility with clear text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/50 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/90 via-[#0D0D0D]/40 to-transparent z-10 pointer-events-none" />

      {/* Left-Aligned Text Content Container */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 pt-10 sm:pt-16 pb-6 flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md"
        >
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#FFFFFF] leading-[1.18] tracking-tight drop-shadow-md">
            Seu estilo,<br />
            nosso <span className="text-[#D4AF37]">cuidado.</span>
          </h1>

          <p className="text-xs sm:text-sm font-normal text-white/75 pt-2 leading-relaxed max-w-xs drop-shadow">
            Atendimento com especialistas e produtos de alta qualidade.
          </p>

          <div className="pt-4 sm:pt-5">
            <button
              type="button"
              onClick={onBookClick}
              className="bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold text-xs sm:text-sm uppercase tracking-wider py-3 px-5 sm:py-3.5 sm:px-6 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] inline-flex items-center gap-2.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>Agendar Horário</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
