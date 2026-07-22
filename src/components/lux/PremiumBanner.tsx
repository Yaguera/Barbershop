'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumBannerProps {
  onLearnMoreClick?: () => void;
}

export function PremiumBanner({ onLearnMoreClick }: PremiumBannerProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-6 pb-28">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-[#1C1C1C] rounded-[18px] p-6 sm:p-8 border border-[rgba(255,255,255,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group"
      >
        {/* Subtle background ambient golden light */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-60" />

        <div className="flex items-center gap-5 z-10 w-full sm:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center shrink-0 shadow-[0_4px_20px_rgba(212,175,55,0.15)]">
            <Crown className="w-7 h-7 text-[#D4AF37] stroke-[2]" />
          </div>

          <div className="flex flex-col">
            <h3 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] tracking-tight">
              Seja Premium
            </h3>
            <p className="text-[15px] font-normal text-[#B3B3B3] mt-1">
              Benefícios exclusivos para você
            </p>
          </div>
        </div>

        <div className="z-10 w-full sm:w-auto">
          <button
            type="button"
            onClick={onLearnMoreClick}
            className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-semibold text-[15px] py-3.5 px-7 rounded-[16px] shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Saiba mais
          </button>
        </div>
      </motion.div>
    </section>
  );
}
