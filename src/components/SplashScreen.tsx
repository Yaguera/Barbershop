'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Show splash for 2.5 seconds
    const timer1 = setTimeout(() => {
      setOpacity(0);
    }, 2000);

    // Unmount after fade out transition (500ms)
    const timer2 = setTimeout(() => {
      setIsVisible(false);
      onFinish();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-preto-profundo transition-opacity duration-500 ease-in-out"
      style={{ opacity }}
    >
      {/* Background Image with heavy blur */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/splash_bg.png"
          alt="Barbershop Background"
          fill
          className="object-cover opacity-40 blur-sm scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-preto-profundo via-preto-profundo/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container with Glassmorphism */}
        <div className="w-32 h-32 rounded-full glass-heavy flex items-center justify-center p-1 shadow-[0_0_40px_rgba(245,197,66,0.15)] mb-8 animate-pulse">
          <div className="w-full h-full rounded-full overflow-hidden border border-dourado-premium/30">
            <Image
              src="/logo.png"
              alt="Logo"
              width={128}
              height={128}
              className="object-cover"
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-widest text-branco mb-2 text-center uppercase">
          Corte & <span className="text-dourado-premium">Estilo</span>
        </h1>
        <p className="text-cinza-chumbo text-sm uppercase tracking-[0.3em] font-medium text-branco/60">
          Barbearia Premium
        </p>

        {/* Loading indicator */}
        <div className="mt-12 w-48 h-1 bg-cinza-grafite rounded-full overflow-hidden">
          <div className="h-full bg-dourado-premium rounded-full animate-[loading_2s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Custom Keyframes for loading bar if not using arbitrary tailwind */}
      <style jsx>{`
        @keyframes loading {
          0% {
            width: 0%;
            transform: translateX(-100%);
          }
          50% {
            width: 50%;
            transform: translateX(50%);
          }
          100% {
            width: 100%;
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
