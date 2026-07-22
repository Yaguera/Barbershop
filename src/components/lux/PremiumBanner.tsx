'use client';

import React from 'react';
import { Crown, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumBannerProps {
  onLearnMoreClick?: () => void;
}

export function PremiumBanner({ onLearnMoreClick }: PremiumBannerProps) {
  return (
    <section className="w-full max-w-6xl mx-auto py-3 pb-8">
      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-[#151515] via-[#1C1C1C] to-[#151515] rounded-2xl p-4 sm:p-5 border border-white/5 shadow-xl flex items-center justify-between gap-4 relative overflow-hidden group"
        >
          {/* Subtle background golden glow */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-3.5 z-10 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 shadow-inner">
              <Crown className="w-5 h-5 text-[#D4AF37] stroke-[2.2]" />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-[#FFFFFF] tracking-tight leading-tight truncate">
                Seja Premium
              </h3>
              <p className="text-[11px] font-normal text-white/60 mt-0.5 truncate">
                Benefícios exclusivos para você!
              </p>
            </div>
          </div>

          <div className="z-10 shrink-0">
            <button
              type="button"
              onClick={onLearnMoreClick}
              className="bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-extrabold text-[11px] uppercase tracking-wider py-2 px-4 rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>SAIBA MAIS</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
