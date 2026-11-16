import { describe, it, expect } from 'vitest';
import { BotDrawingEngine } from '../server/game/BotDrawingEngine.js';

describe('BotDrawingEngine', () => {
  it('generates authentic sequenced vector strokes for known words', () => {
    const turnId = 'turn_test_123';
    const strokes = BotDrawingEngine.generateStrokesForWord('cat', 'Animals', turnId);

    expect(strokes.length).toBeGreaterThanOrEqual(5);
    expect(strokes[0].turnId).toBe(turnId);
    expect(strokes[0].points.length).toBeGreaterThan(0);
    // Logical canvas coordinate bounds check (1200 x 900)
    for (const stroke of strokes) {
      for (const pt of stroke.points) {
        expect(pt.x).toBeGreaterThanOrEqual(0);
        expect(pt.x).toBeLessThanOrEqual(1200);
        expect(pt.y).toBeGreaterThanOrEqual(0);
        expect(pt.y).toBeLessThanOrEqual(900);
      }
    }
  });

  it('generates fallback doodle strokes for arbitrary words', () => {
    const turnId = 'turn_test_456';
    const strokes = BotDrawingEngine.generateStrokesForWord('supercalifragilistic', 'General', turnId);

    expect(strokes.length).toBeGreaterThanOrEqual(3);
    expect(strokes[0].turnId).toBe(turnId);
    for (const stroke of strokes) {
      expect(stroke.points.length).toBeGreaterThan(0);
    }
  });
});
