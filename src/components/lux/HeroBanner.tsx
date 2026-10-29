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
      <section className="w-full relative overflow-hidden min-h-[290px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[440px] md:rounded-lg md:border md:border-white/[0.08] flex flex-col justify-end md:justify-center select-none">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/55 to-transparent md:from-[#0D0D0D]/90 md:via-[#0D0D0D]/35 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/95 via-[#0D0D0D]/65 to-transparent z-10 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-20 w-full px-6 md:px-12 lg:px-14 pt-10 sm:pt-16 pb-6 md:py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md md:max-w-xl"
          >
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-zinc-300 text-[11px] font-medium uppercase tracking-widest mb-4 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              <span>Tradição & Precisão</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.15] tracking-tight">
              Seu estilo,<br />
              nosso <span className="text-[#C5A059]">cuidado.</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base font-normal text-zinc-300 pt-2 md:pt-3 leading-relaxed max-w-xs md:max-w-md">
              Atendimento com especialistas e produtos de alta qualidade em um ambiente pensado para você.
            </p>

            <div className="pt-4 sm:pt-5 md:pt-7 flex items-center gap-4">
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

          {/* Right-side Minimalist Info Card (Desktop Only) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hidden lg:flex flex-col gap-3.5 bg-[#121212]/85 backdrop-blur-xl border border-white/[0.08] rounded-lg p-6 w-80"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Atendimento
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Agendamento online
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-[#C5A059]">
                  <Clock className="w-4 h-4 stroke-[1.8]" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Pontualidade</p>
                  <p className="text-zinc-400 text-[11px] leading-snug mt-0.5">
                    Escolha o horário exato em tempo real direto na agenda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-[#C5A059]">
                  <CheckCircle2 className="w-4 h-4 stroke-[1.8]" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Especialistas</p>
                  <p className="text-zinc-400 text-[11px] leading-snug mt-0.5">
                    Profissionais dedicados em cortes clássicos, degradê e barba.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-[#C5A059]">
                  <ShieldCheck className="w-4 h-4 stroke-[1.8]" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Confirmação da reserva</p>
                  <p className="text-zinc-400 text-[11px] leading-snug mt-0.5">
                    Confira os detalhes antes de confirmar seu horário.
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
