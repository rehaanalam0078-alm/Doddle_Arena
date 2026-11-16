import React, { useState } from 'react';
import { DrawingTool } from '@/types/game';
import { ColorPalette } from './ColorPalette';
import { sound } from '@/services/sound';

interface DrawingToolbarProps {
  currentTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  currentBrushSize: number;
  onSelectBrushSize: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const BRUSH_SIZES = [
  { size: 4, label: '4px' },
  { size: 8, label: '8px' },
  { size: 16, label: '16px' },
  { size: 32, label: '32px' },
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  currentBrushSize,
  onSelectBrushSize,
  onUndo,
  onRedo,
  onClear,
  canUndo = true,
  canRedo = true,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const tools: { id: DrawingTool; icon: string; label: string }[] = [
    { id: 'brush', icon: 'brush', label: 'Freehand Brush' },
    { id: 'eraser', icon: 'ink_eraser', label: 'Eraser' },
    { id: 'fill', icon: 'format_color_fill', label: 'Fill Bucket' },
    { id: 'line', icon: 'horizontal_rule', label: 'Straight Line' },
    { id: 'rectangle', icon: 'crop_square', label: 'Rectangle' },
    { id: 'circle', icon: 'circle', label: 'Circle' },
  ];

  return (
    <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto px-2">
      {/* Top Bar: Tools, Brush Sizes, History Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-surface-container-lowest p-2 rounded-2xl border-2 border-outline-variant shadow-sm">
        {/* Drawing Tools Selection */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
          {tools.map((t) => {
            const isActive = currentTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm font-bold scale-105'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
                onClick={() => {
                  sound.playClick();
                  onSelectTool(t.id);
                }}
                title={t.label}
              >
                <span className="material-symbols-outlined text-xl">{t.icon}</span>
              </button>
            );
          })}
        </div>

        {/* Brush Diameter Stepped Dots */}
        <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl">
          {BRUSH_SIZES.map((b) => {
            const isSelected = currentBrushSize === b.size;
            return (
              <button
                key={b.size}
                type="button"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary-fixed border-2 border-primary scale-110 shadow-sm'
                    : 'hover:bg-surface-container-high'
                }`}
                onClick={() => {
                  sound.playClick();
                  onSelectBrushSize(b.size);
                }}
                title={`Brush Size: ${b.label}`}
              >
                <span
                  className="rounded-full bg-on-surface"
                  style={{
                    width: Math.max(3, b.size / 2.5),
                    height: Math.max(3, b.size / 2.5),
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Undo / Redo / Clear Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="w-9 h-9 tactile-btn-ghost rounded-xl flex items-center justify-center text-on-surface"
            onClick={() => {
              sound.playClick();
              onUndo();
            }}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <span className="material-symbols-outlined text-xl">undo</span>
          </button>

          <button
            type="button"
            className="w-9 h-9 tactile-btn-ghost rounded-xl flex items-center justify-center text-on-surface"
            onClick={() => {
              sound.playClick();
              onRedo();
            }}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <span className="material-symbols-outlined text-xl">redo</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 tactile-btn-secondary text-xs rounded-xl flex items-center gap-1"
            onClick={() => {
              sound.playClick();
              setShowClearConfirm(true);
            }}
            title="Clear Entire Canvas"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar: Palette Swatches */}
      <ColorPalette selectedColor={currentColor} onSelectColor={onSelectColor} />

      {/* Clear Canvas Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 tactile-card max-w-sm w-full text-center flex flex-col items-center gap-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-on-surface">Clear Canvas?</h3>
              <p className="text-xs text-outline mt-1 font-medium">
                Are you sure you want to erase your entire drawing? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                className="flex-1 tactile-btn-ghost py-2.5 rounded-xl font-bold text-xs"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 tactile-btn-secondary py-2.5 rounded-xl font-bold text-xs"
                onClick={() => {
                  onClear();
                  setShowClearConfirm(false);
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
