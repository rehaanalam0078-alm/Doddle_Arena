import React from 'react';
import { sound } from '@/services/sound';

interface ColorPaletteProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export const PALETTE_COLORS = [
  { hex: '#1E1B4B', name: 'Deep Navy' },
  { hex: '#7C3AED', name: 'Primary Purple' },
  { hex: '#FF6B6B', name: 'Coral Red' },
  { hex: '#06B6D4', name: 'Turquoise' },
  { hex: '#F59E0B', name: 'Sunshine Yellow' },
  { hex: '#10B981', name: 'Emerald Green' },
  { hex: '#EC4899', name: 'Bubblegum Pink' },
  { hex: '#8B5CF6', name: 'Lavender' },
  { hex: '#3B82F6', name: 'Sky Blue' },
  { hex: '#78350F', name: 'Warm Brown' },
  { hex: '#9CA3AF', name: 'Slate Grey' },
  { hex: '#FFFFFF', name: 'Paper White' },
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onSelectColor,
}) => {
  return (
    <div className="flex items-center gap-1.5 flex-wrap bg-surface-container-lowest p-2 rounded-2xl border-2 border-outline-variant shadow-sm">
      {PALETTE_COLORS.map((col) => {
        const isSelected = selectedColor.toLowerCase() === col.hex.toLowerCase();
        return (
          <button
            key={col.hex}
            type="button"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-150 transform active:scale-90 relative ${
              isSelected
                ? 'scale-110 ring-4 ring-primary shadow-md z-10'
                : 'hover:scale-105 border border-outline-variant'
            }`}
            style={{ backgroundColor: col.hex }}
            onClick={() => {
              sound.playClick();
              onSelectColor(col.hex);
            }}
            title={col.name}
          >
            {isSelected && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                •
              </span>
            )}
          </button>
        );
      })}

      {/* Custom Color Input Trigger */}
      <label
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-primary flex items-center justify-center cursor-pointer hover:bg-surface-container transition-all active:scale-90"
        title="Custom Color"
      >
        <span className="material-symbols-outlined text-sm text-primary">palette</span>
        <input
          type="color"
          className="sr-only"
          value={selectedColor}
          onChange={(e) => onSelectColor(e.target.value)}
        />
      </label>
    </div>
  );
};
