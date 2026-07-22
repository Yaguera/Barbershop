'use client';

import React from 'react';
import Image from 'next/image';
import { Scissors, Star, Smile, User } from 'lucide-react';

interface ServiceCardProps {
  id?: string;
  name: string;
  priceFormatted: string;
  duration?: string;
  imageUrl?: string;
  iconType?: 'scissors' | 'beard' | 'star' | 'smile';
  onClick?: () => void;
}

export function ServiceCard({
  name = 'Corte de Cabelo',
  priceFormatted = 'R$ 40,00',
  imageUrl = '/images/service_image.png',
  iconType = 'scissors',
  onClick,
}: ServiceCardProps) {
  const getIcon = () => {
    switch (iconType) {
      case 'star':
        return <Star className="w-4 h-4 text-[#D4AF37] stroke-[2]" />;
      case 'smile':
        return <Smile className="w-4 h-4 text-[#D4AF37] stroke-[2]" />;
      case 'beard':
        return <User className="w-4 h-4 text-[#D4AF37] stroke-[2]" />;
      default:
        return <Scissors className="w-4 h-4 text-[#D4AF37] stroke-[2]" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="w-36 sm:w-44 shrink-0 snap-start bg-[#151515] rounded-2xl border border-white/5 shadow-xl hover:-translate-y-1 hover:border-[#D4AF37]/40 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer"
    >
      {/* Top Image */}
      <div className="h-28 sm:h-32 relative w-full bg-[#1C1C1C] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="180px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent opacity-60" />

        {/* Small circular icon overlapping image bottom left */}
        <div className="absolute -bottom-3 left-3 w-7 h-7 rounded-full bg-[#1C1C1C] border border-white/10 flex items-center justify-center shadow-md z-10">
          {getIcon()}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 pt-4 sm:p-3.5 sm:pt-5 flex flex-col justify-between flex-grow bg-[#151515]">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#FFFFFF] tracking-tight truncate">
            {name}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-normal text-white/50 mt-1 leading-none">
            A partir de
          </p>
        </div>

        <div className="mt-1">
          <span className="text-xs sm:text-sm font-extrabold text-[#D4AF37]">
            {priceFormatted}
          </span>
        </div>
      </div>
    </div>
  );
}
