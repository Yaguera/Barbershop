'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Crown, Gift } from 'lucide-react';

interface PremiumBannerProps {
  onLearnMoreClick?: () => void;
  onReferClick?: () => void;
}

export function PremiumBanner({ onLearnMoreClick, onReferClick }: PremiumBannerProps) {
  return (
    <section className="w-full max-w-7xl mx-auto py-2 pb-6 md:py-4">
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Card 1: Clube de Assinatura (Mobile + Desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="bg-gradient-to-r from-[#151515] via-[#1C1C1C] to-[#151515] rounded-2xl p-4 sm:p-5 md:p-6 border border-white/5 hover:border-[#D4AF37]/30 shadow-xl flex items-center justify-between gap-4 relative overflow-hidden group transition-colors"
        >
          {/* Subtle background golden glow */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-3.5 md:gap-4 z-10 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 shadow-inner">
              <Crown className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37] stroke-[2.2]" />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-sm md:text-base font-bold text-white tracking-tight leading-tight">
                Clube de Assinatura
              </h3>
              <p className="text-xs md:text-sm font-normal text-white/60 mt-0.5 line-clamp-1 md:line-clamp-2">
                Planos mensais com cortes ilimitados e condições exclusivas.
              </p>
            </div>
          </div>

          <div className="z-10 shrink-0">
            <button
              type="button"
              onClick={onLearnMoreClick}
              className="bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-extrabold text-[11px] md:text-xs uppercase tracking-wider py-2 px-3.5 sm:px-4 md:py-2.5 md:px-5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>Conhecer</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </motion.div>

        {/* Card 2: Indique um Amigo (Desktop Only - complements QuickAccess hidden on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="hidden md:flex bg-gradient-to-r from-[#151515] via-[#1C1C1C] to-[#151515] rounded-2xl p-6 border border-white/5 hover:border-[#D4AF37]/30 shadow-xl items-center justify-between gap-4 relative overflow-hidden group transition-colors"
        >
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-4 z-10 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 shadow-inner">
              <Gift className="w-6 h-6 text-[#D4AF37] stroke-[2.2]" />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight leading-tight">
                Indique um Amigo
              </h3>
              <p className="text-sm font-normal text-white/60 mt-0.5 line-clamp-2">
                Convide amigos para conhecer a barbearia pelo WhatsApp.
              </p>
            </div>
          </div>

          <div className="z-10 shrink-0">
            <button
              type="button"
              onClick={onReferClick}
              className="bg-[#1C1C1C] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0D0D0D] border border-[#D4AF37]/40 font-extrabold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>Indicar</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
