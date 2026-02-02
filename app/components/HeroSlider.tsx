'use client';
import { useEffect, useState } from 'react';

export default function HeroSlider({ images }: { images: any[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images]);

  // Handle empty state
  if (!images || images.length === 0) {
    return <div className="absolute inset-0 bg-slate-950" />;
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
      <div className="hero-overlay" />
      {images.map((img, i) => (
        <div
          key={i}
          style={{ backgroundImage: `url(${img?.url || ''})` }}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out slider-image ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
}