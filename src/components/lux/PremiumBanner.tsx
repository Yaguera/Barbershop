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
          className="bg-[#141414] hover:bg-[#171717] rounded-lg p-4 sm:p-5 md:p-6 border border-white/[0.07] hover:border-white/15 flex items-center justify-between gap-4 relative overflow-hidden group transition-colors"
        >
          <div className="flex items-center gap-3.5 md:gap-4 z-10 min-w-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-[#C5A059] stroke-[1.8]" />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-sm md:text-[15px] font-semibold text-white tracking-tight leading-tight">
                Clube de Assinatura
              </h3>
              <p className="text-xs md:text-sm font-normal text-zinc-400 mt-0.5 line-clamp-1 md:line-clamp-2">
                Planos mensais com cortes ilimitados e condições exclusivas.
              </p>
            </div>
          </div>

          <div className="z-10 shrink-0">
            <button
              type="button"
              onClick={onLearnMoreClick}
              className="bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 hover:border-white/25 font-medium text-xs py-2 px-3.5 md:py-2.5 md:px-4 rounded-md transition-all duration-200 flex items-center gap-1 cursor-pointer"
            >
              <span>Conhecer</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </motion.div>

        {/* Card 2: Indique um Amigo (Desktop Only) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="hidden md:flex bg-[#141414] hover:bg-[#171717] rounded-lg p-6 border border-white/[0.07] hover:border-white/15 items-center justify-between gap-4 relative overflow-hidden group transition-colors"
        >
          <div className="flex items-center gap-4 z-10 min-w-0">
            <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#C5A059] stroke-[1.8]" />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-[15px] font-semibold text-white tracking-tight leading-tight">
                Indique um Amigo
              </h3>
              <p className="text-sm font-normal text-zinc-400 mt-0.5 line-clamp-2">
                Convide amigos para conhecer a barbearia pelo WhatsApp.
              </p>
            </div>
          </div>

          <div className="z-10 shrink-0">
            <button
              type="button"
              onClick={onReferClick}
              className="bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 hover:border-white/25 font-medium text-xs py-2.5 px-4 rounded-md transition-all duration-200 flex items-center gap-1 cursor-pointer"
            >
              <span>Indicar</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
