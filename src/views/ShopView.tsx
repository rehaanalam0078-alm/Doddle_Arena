import React, { useState } from 'react';
import { sound } from '@/services/sound';

interface ShopViewProps {
  userXp: number;
  onBackToLobby: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({ userXp, onBackToLobby }) => {
  const [items, setItems] = useState([
    {
      id: 'hat_beret',
      name: 'Artist Beret',
      type: 'hat',
      priceXP: 500,
      icon: 'palette',
      unlocked: true,
      description: 'The signature beret of passionate painters.',
    },
    {
      id: 'hat_headphones',
      name: 'Neon DJ Beats',
      type: 'hat',
      priceXP: 1200,
      icon: 'headphones',
      unlocked: true,
      description: 'Listen to synth beats while sketching masterpieces.',
    },
    {
      id: 'hat_crown',
      name: 'Imperial Golden Crown',
      type: 'hat',
      priceXP: 5000,
      icon: 'military_tech',
      unlocked: false,
      description: 'Forged for weekly tournament champions.',
    },
    {
      id: 'hat_sunglasses',
      name: 'Vibrant Sunset Shades',
      type: 'hat',
      priceXP: 800,
      icon: 'visibility',
      unlocked: true,
      description: 'Cool shades with purple UV gradient lenses.',
    },
    {
      id: 'brush_rainbow',
      name: 'Rainbow Prism Trail',
      type: 'brush_trail',
      priceXP: 2500,
      icon: 'auto_awesome',
      unlocked: false,
      description: 'Strokes shimmer with dynamic iridescent particles.',
    },
  ]);

  const handleUnlock = (id: string, price: number) => {
    if (userXp < price) {
      sound.playClose();
      alert(`You need ${price.toLocaleString()} XP to unlock this cosmetic.`);
      return;
    }
    sound.playCorrect();
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unlocked: true } : item))
    );
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl tactile-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-3xl">storefront</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface">
              Cosmetics & Perks Boutique
            </h1>
            <p className="text-xs text-outline font-medium">
              Unlock exclusive hats, shades, and brush particle effects with your earned match XP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-black text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base fill-icon">monetization_on</span>
            <span>{userXp.toLocaleString()} XP Available</span>
          </div>
          <button
            onClick={onBackToLobby}
            className="px-4 py-2.5 tactile-btn-ghost rounded-xl text-xs font-bold"
          >
            ← Lobby
          </button>
        </div>
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl tactile-card bg-surface-container-lowest flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    item.unlocked
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {item.unlocked ? 'UNLOCKED' : `${item.priceXP} XP`}
                </span>
              </div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface">
                {item.name}
              </h3>
              <p className="text-xs text-outline font-medium mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant">
              {item.unlocked ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-surface-container text-outline rounded-xl font-bold text-xs cursor-default"
                >
                  ✓ Equipped in Wardrobe
                </button>
              ) : (
                <button
                  onClick={() => handleUnlock(item.id, item.priceXP)}
                  className="w-full py-2.5 tactile-btn-primary rounded-xl font-bold text-xs"
                >
                  Unlock with {item.priceXP} XP →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
