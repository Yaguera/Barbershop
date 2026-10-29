'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface HeroBannerProps {
  onBookClick?: () => void;
}

export function HeroBanner({ onBookClick }: HeroBannerProps) {
  return (
    <div className="w-full max-w-7xl mx-auto md:px-6 md:pt-6">
      <section className="w-full relative overflow-hidden min-h-[290px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[450px] md:rounded-3xl md:border md:border-white/10 md:shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col justify-end md:justify-center select-none">
        {/* Background Image */}
        <Image
          src="/images/splash_bg.png"
          alt="Cadeira e ambiente da Barbearia"
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          quality={90}
          priority
          className="object-cover object-center"
        />

        {/* Balanced gradient overlays preserving photo visibility with clear text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/50 to-transparent md:from-[#0D0D0D]/90 md:via-[#0D0D0D]/30 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/95 via-[#0D0D0D]/60 to-transparent z-10 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-20 w-full px-6 md:px-12 lg:px-16 pt-10 sm:pt-16 pb-6 md:py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md md:max-w-xl"
          >
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Experiência Clássica & Moderna</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-[#FFFFFF] leading-[1.15] tracking-tight drop-shadow-md">
              Seu estilo,<br />
              nosso <span className="text-[#D4AF37]">cuidado.</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base font-normal text-white/75 pt-2 md:pt-3 leading-relaxed max-w-xs md:max-w-md drop-shadow">
              Atendimento com especialistas e produtos de alta qualidade em um ambiente pensado para você.
            </p>

            <div className="pt-4 sm:pt-5 md:pt-7 flex items-center gap-4">
              <button
                type="button"
                onClick={onBookClick}
                className="bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold text-xs sm:text-sm uppercase tracking-wider py-3 px-5 sm:py-3.5 sm:px-6 md:py-4 md:px-8 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] inline-flex items-center gap-2.5 cursor-pointer"
              >
                <Calendar className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5] shrink-0" />
                <span>Agendar Horário</span>
              </button>
            </div>
          </motion.div>

          {/* Right-side Floating Glass Card (Desktop Only) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hidden lg:flex flex-col gap-3.5 bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-80 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
                Padrão VIP Barber
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#22C55E]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                Agenda Aberta
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[#D4AF37]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Zero Espera</p>
                  <p className="text-white/60 text-[11px] leading-snug mt-0.5">
                    Escolha o horário exato em tempo real direto na agenda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[#D4AF37]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Profissionais Master</p>
                  <p className="text-white/60 text-[11px] leading-snug mt-0.5">
                    Especialistas em visagismo, cortes clássicos, degradê e barboterapia.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[#D4AF37]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Reserva Garantida</p>
                  <p className="text-white/60 text-[11px] leading-snug mt-0.5">
                    Confirmação imediata e lembretes automáticos.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
