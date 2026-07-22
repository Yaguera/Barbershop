'use client';

import React from 'react';
import Image from 'next/image';
import { Scissors } from 'lucide-react';

interface ServiceCardProps {
  id?: string;
  name: string;
  priceFormatted: string;
  duration?: string;
  imageUrl?: string;
  onClick?: () => void;
}

export function ServiceCard({
  name = 'Corte de cabelo',
  priceFormatted = 'R$ 40,00',
  duration = '45 min',
  imageUrl = '/images/service_image.png',
  onClick,
}: ServiceCardProps) {
  return (
    <div
      onClick={onClick}
      className="w-72 sm:w-80 shrink-0 snap-start bg-[#151515] rounded-[18px] border border-[rgba(255,255,255,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:border-[#D4AF37]/40 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer"
    >
      {/* Top Image (Ocupa cerca de 65% do card visualmente) */}
      <div className="h-48 sm:h-52 relative w-full bg-[#1C1C1C] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="320px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent opacity-60" />

        {/* Canto inferior esquerdo: Ícone circular com background preto translúcido */}
        <div className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-[rgba(255,255,255,0.12)] flex items-center justify-center shadow-lg">
          <Scissors className="w-5 h-5 text-[#D4AF37] stroke-[2]" />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col justify-between flex-grow bg-[#151515]">
        <div>
          <h3 className="text-[18px] font-semibold text-[#FFFFFF] tracking-tight line-clamp-1">
            {name}
          </h3>
          <p className="text-[13px] font-normal text-[#7A7A7A] mt-1">
            A partir de • {duration}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <span className="text-[24px] font-bold text-[#D4AF37]">
            {priceFormatted}
          </span>
          <span className="text-[13px] font-semibold text-[#B3B3B3] group-hover:text-[#FFFFFF] transition-colors">
            Agendar →
          </span>
        </div>
      </div>
    </div>
  );
}
