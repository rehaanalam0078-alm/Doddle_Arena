import React, { useState } from 'react';
import { sound } from '@/services/sound';

interface WordItem {
  id: string;
  word: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface WordlistEditorViewProps {
  onBack: () => void;
}

export const WordlistEditorView: React.FC<WordlistEditorViewProps> = ({ onBack }) => {
  const [packName, setPackName] = useState('My Custom Party Pack');
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState('Objects');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [words, setWords] = useState<WordItem[]>([
    { id: '1', word: 'Pencil', category: 'Everyday Objects', difficulty: 'easy' },
    { id: '2', word: 'Flamingo', category: 'Animals & Nature', difficulty: 'medium' },
    { id: '3', word: 'Rollercoaster', category: 'Places & Rides', difficulty: 'hard' },
    { id: '4', word: 'Kaleidoscope', category: 'Everyday Objects', difficulty: 'hard' },
    { id: '5', word: 'Submarine', category: 'Places & Rides', difficulty: 'medium' },
  ]);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    sound.playClick();
    setWords((prev) => [
      ...prev,
      {
        id: `word_${Date.now()}`,
        word: newWord.trim(),
        category: newCategory.trim() || 'General',
        difficulty: newDifficulty,
      },
    ]);
    setNewWord('');
  };

  const handleDelete = (id: string) => {
    sound.playClick();
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleExportJson = () => {
    sound.playClick();
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ name: packName, words }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${packName.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.words)) {
          setWords(parsed.words);
          if (parsed.name) setPackName(parsed.name);
          sound.playCorrect();
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl tactile-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-3xl">edit_note</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface">
              Custom Wordpack Studio
            </h1>
            <p className="text-xs text-outline font-medium">
              Create and export curated mystery wordpacks for private rooms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2.5 tactile-btn-ghost rounded-xl text-xs font-bold"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Editor Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Add Word Form (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-3xl tactile-card flex flex-col gap-4">
          <h2 className="font-headline-md text-base font-bold text-on-surface">
            Add New Mystery Word
          </h2>

          <form onSubmit={handleAddWord} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Word or Phrase
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Flying Squirrel"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant font-bold text-sm focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Animals & Nature"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs font-medium focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setNewDifficulty(d)}
                    className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      newDifficulty === d
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-outline'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 py-3 tactile-btn-primary rounded-xl text-xs font-bold"
            >
              + Add to Pack
            </button>
          </form>

          {/* Import / Export actions */}
          <div className="pt-4 border-t border-outline-variant flex items-center justify-between gap-3">
            <button
              onClick={handleExportJson}
              className="flex-1 py-2.5 tactile-btn-ghost rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export JSON</span>
            </button>

            <label className="flex-1 py-2.5 tactile-btn-ghost rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-base">upload</span>
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Wordpack List (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-3xl tactile-card flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3">
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface">
                {packName}
              </h2>
              <span className="text-xs text-outline">{words.length} Words in Pack</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {words.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant"
              >
                <div>
                  <span className="font-bold text-sm text-on-surface block">{w.word}</span>
                  <span className="text-[11px] text-outline font-medium">
                    {w.category} •{' '}
                    <span className="uppercase font-bold text-primary">{w.difficulty}</span>
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="w-8 h-8 rounded-xl bg-surface-container hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-outline transition-colors"
                  title="Remove word"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
