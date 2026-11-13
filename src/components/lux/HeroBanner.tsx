'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import Image from 'next/image';

interface HeroBannerProps {
  onBookClick?: () => void;
}

export function HeroBanner({ onBookClick }: HeroBannerProps) {
  return (
    <div className="w-full max-w-7xl mx-auto md:px-6 md:pt-6">
      <section className="w-full relative overflow-hidden min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[460px] md:rounded-2xl flex flex-col justify-end md:justify-center select-none">
        {/* Background Image */}
        <Image
          src="/images/splash_bg.png"
          alt="Barbeiro atendendo cliente em ambiente da Barbearia"
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          quality={90}
          priority
          className="object-cover object-center"
        />

        {/* Balanced gradient overlays preserving photo visibility with clear text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0D0D0D]/80 via-transparent to-transparent z-10 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-20 w-full px-6 md:px-12 lg:px-14 pt-12 sm:pt-16 pb-8 md:py-14 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md md:max-w-xl"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.12] tracking-tight">
              Seu estilo,<br />
              nosso <span className="text-[#C5A059]">cuidado.</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base font-normal text-zinc-300 pt-3 md:pt-4 leading-relaxed max-w-xs sm:max-w-sm md:max-w-md">
              Atendimento com especialistas e produtos de alta qualidade em um ambiente pensado para você.
            </p>

            <div className="pt-5 md:pt-7 flex items-center gap-4">
              <button
                type="button"
                onClick={onBookClick}
                className="min-h-12 bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-semibold text-sm py-3 px-6 rounded-xl transition-colors inline-flex items-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Calendar className="w-4 h-4 stroke-[2] shrink-0" />
                <span>Agendar Horário</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
