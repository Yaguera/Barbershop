'use client';

import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppointmentCardProps {
  date?: string;
  time?: string;
  barberName?: string;
  serviceName?: string;
  onDetailsClick?: () => void;
}

export function AppointmentCard({
  date = 'Hoje, 22 de Julho',
  time = '16:30',
  barberName = 'José Carlos - Master Barber',
  serviceName = 'Corte & Estilo VIP',
  onDetailsClick,
}: AppointmentCardProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="bg-[#171717] rounded-[18px] p-6 border border-[rgba(255,255,255,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:border-[#D4AF37]/30 transition-all duration-200"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1C1C] border border-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-[#D4AF37] stroke-[2]" />
            </div>

            <div className="flex flex-col">
              <span className="text-[13px] text-[#B3B3B3] font-normal uppercase tracking-wider">
                Próximo Agendamento
              </span>
              <h3 className="text-[18px] font-semibold text-[#FFFFFF] mt-0.5">
                {serviceName}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-[15px] font-normal text-[#FFFFFF]">
                <span>{date}</span>
                <span className="text-[#7A7A7A]">•</span>
                <span className="text-[#D4AF37] font-semibold">{time}</span>
              </div>
              <p className="text-[13px] text-[#7A7A7A] mt-1 font-normal">
                Com {barberName}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
              Confirmado
            </span>
          </div>
        </div>

        {/* Bottom Secondary Button: Ver detalhes com seta para direita */}
        <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <button
            type="button"
            onClick={onDetailsClick}
            className="w-full flex items-center justify-between text-[15px] font-semibold text-[#D4AF37] hover:text-[#E2BE4D] transition-colors group cursor-pointer"
          >
            <span>Ver detalhes</span>
            <ChevronRight className="w-5 h-5 stroke-[2] transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
