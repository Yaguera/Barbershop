'use client';

import { Clock, Scissors, Smile, Star, User } from 'lucide-react';
import Image from 'next/image';

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
  name,
  priceFormatted,
  duration,
  imageUrl = '/images/service_image.png',
  iconType = 'scissors',
  onClick,
}: ServiceCardProps) {
  const getIcon = () => {
    switch (iconType) {
      case 'star':
        return <Star className="w-3.5 h-3.5 text-[#D4AF37] stroke-[2]" />;
      case 'smile':
        return <Smile className="w-3.5 h-3.5 text-[#D4AF37] stroke-[2]" />;
      case 'beard':
        return <User className="w-3.5 h-3.5 text-[#D4AF37] stroke-[2]" />;
      default:
        return <Scissors className="w-3.5 h-3.5 text-[#D4AF37] stroke-[2]" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="w-38 sm:w-44 shrink-0 snap-start bg-[#151515] rounded-2xl border border-white/5 shadow-xl hover:-translate-y-1 hover:border-[#D4AF37]/40 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer"
    >
      {/* Top Image */}
      <div className="h-26 sm:h-30 relative w-full bg-[#1C1C1C] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="180px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent opacity-60" />

        {/* Small circular icon overlapping image */}
        <div className="absolute bottom-2 left-2.5 w-6 h-6 rounded-full bg-[#1C1C1C]/90 border border-white/10 flex items-center justify-center shadow-md z-10 backdrop-blur-xs">
          {getIcon()}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 flex flex-col justify-between flex-grow bg-[#151515] gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-2 leading-snug">
            {name}
          </h3>
          {duration && (
            <div className="flex items-center gap-1 text-[11px] text-white/50 mt-1">
              <Clock className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-extrabold text-[#D4AF37]">
            {priceFormatted}
          </span>
          <span className="text-[10px] font-semibold text-white/40 group-hover:text-white transition-colors">
            Escolher
          </span>
        </div>
      </div>
    </div>
  );
}
