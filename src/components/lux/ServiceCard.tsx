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
        return <Star className="w-3.5 h-3.5 text-[#C5A059] stroke-[1.8]" />;
      case 'smile':
        return <Smile className="w-3.5 h-3.5 text-[#C5A059] stroke-[1.8]" />;
      case 'beard':
        return <User className="w-3.5 h-3.5 text-[#C5A059] stroke-[1.8]" />;
      default:
        return <Scissors className="w-3.5 h-3.5 text-[#C5A059] stroke-[1.8]" />;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-44 sm:w-48 md:w-full shrink-0 snap-start bg-[#151515] rounded-2xl border border-white/10 hover:border-white/20 hover:bg-[#181818] transition-colors flex flex-col overflow-hidden group cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
    >
      {/* Top Image */}
      <div className="h-26 sm:h-30 md:h-40 relative w-full bg-[#1C1C1C] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 180px, 280px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-65" />

        {/* Small icon overlapping image */}
        <div className="absolute bottom-2 left-2.5 md:bottom-3 md:left-3.5 w-6 h-6 md:w-7 md:h-7 rounded-md bg-[#141414]/90 border border-white/10 flex items-center justify-center z-10 backdrop-blur-xs">
          {getIcon()}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 md:p-4 flex flex-col justify-between flex-grow gap-2 md:gap-3">
        <div>
          <h3 className="text-xs sm:text-sm md:text-[15px] font-semibold text-zinc-100 tracking-tight line-clamp-2 leading-snug group-hover:text-white transition-colors">
            {name}
          </h3>
          {duration && (
            <div className="flex items-center gap-1 text-[11px] md:text-xs text-zinc-500 mt-1">
              <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-400 shrink-0" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        <div className="pt-2 md:pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs sm:text-sm md:text-base font-bold text-[#C5A059]">
            {priceFormatted}
          </span>
          <span className="text-[10px] md:text-xs font-medium text-zinc-500 group-hover:text-white md:px-2.5 md:py-1 md:rounded-md md:border md:border-transparent md:group-hover:border-white/15 md:group-hover:bg-white/[0.06] transition-all">
            Escolher
          </span>
        </div>
      </div>
    </button>
  );
}
