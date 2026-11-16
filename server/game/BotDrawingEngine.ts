import { Stroke, Point } from '../../shared/types.js';

interface BotDoodleTemplate {
  strokes: Array<{
    tool: 'brush' | 'line' | 'rectangle' | 'circle';
    color: string;
    size: number;
    points: Point[];
  }>;
}

export class BotDrawingEngine {
  /**
   * Generates a sequence of vector strokes for a given word or category.
   * Uses realistic human-like vector coordinates on the logical 1200x900 canvas.
   */
  public static generateStrokesForWord(word: string, category: string, turnId: string): Stroke[] {
    const normalized = word.toLowerCase().trim();
    const rawStrokes = this.getTemplateForWord(normalized, category);

    return rawStrokes.map((s, idx) => ({
      id: `bot_stk_${Date.now()}_${idx}`,
      tool: s.tool || 'brush',
      color: s.color || '#1E1B4B',
      size: s.size || 8,
      points: s.points,
      seq: idx + 1,
      timestamp: Date.now(),
      turnId,
    }));
  }

  private static getTemplateForWord(word: string, category: string): BotDoodleTemplate['strokes'] {
    // 1. Exact or keyword match templates
    if (word.includes('cat') || word.includes('kitten')) {
      return [
        // Head circle
        { tool: 'brush', color: '#1E1B4B', size: 8, points: this.createCircle(600, 450, 140) },
        // Left Ear
        { tool: 'brush', color: '#1E1B4B', size: 8, points: [{ x: 500, y: 350 }, { x: 480, y: 220 }, { x: 570, y: 320 }] },
        // Right Ear
        { tool: 'brush', color: '#1E1B4B', size: 8, points: [{ x: 630, y: 320 }, { x: 720, y: 220 }, { x: 700, y: 350 }] },
        // Eyes
        { tool: 'brush', color: '#06B6D4', size: 16, points: [{ x: 540, y: 430 }, { x: 540, y: 430 }] },
        { tool: 'brush', color: '#06B6D4', size: 16, points: [{ x: 660, y: 430 }, { x: 660, y: 430 }] },
        // Nose & Mouth
        { tool: 'brush', color: '#EC4899', size: 6, points: [{ x: 600, y: 480 }, { x: 585, y: 510 }, { x: 600, y: 520 }, { x: 615, y: 510 }] },
        // Whiskers
        { tool: 'brush', color: '#1E1B4B', size: 4, points: [{ x: 520, y: 480 }, { x: 380, y: 460 }] },
        { tool: 'brush', color: '#1E1B4B', size: 4, points: [{ x: 680, y: 480 }, { x: 820, y: 460 }] },
      ];
    }

    if (word.includes('house') || word.includes('home') || word.includes('castle')) {
      return [
        // House body square
        { tool: 'brush', color: '#F59E0B', size: 10, points: [{ x: 400, y: 450 }, { x: 800, y: 450 }, { x: 800, y: 750 }, { x: 400, y: 750 }, { x: 400, y: 450 }] },
        // Roof triangle
        { tool: 'brush', color: '#EF4444', size: 10, points: [{ x: 360, y: 460 }, { x: 600, y: 220 }, { x: 840, y: 460 }] },
        // Door
        { tool: 'brush', color: '#7C3AED', size: 8, points: [{ x: 550, y: 750 }, { x: 550, y: 580 }, { x: 650, y: 580 }, { x: 650, y: 750 }] },
        // Door knob
        { tool: 'brush', color: '#F59E0B', size: 12, points: [{ x: 630, y: 660 }, { x: 630, y: 660 }] },
        // Window
        { tool: 'brush', color: '#06B6D4', size: 6, points: [{ x: 450, y: 500 }, { x: 510, y: 500 }, { x: 510, y: 560 }, { x: 450, y: 560 }, { x: 450, y: 500 }] },
        // Chimney & Smoke
        { tool: 'brush', color: '#64748B', size: 8, points: [{ x: 720, y: 340 }, { x: 720, y: 200 }, { x: 770, y: 200 }, { x: 770, y: 390 }] },
      ];
    }

    if (word.includes('sun') || word.includes('sunny') || word.includes('summer')) {
      return [
        // Central Sun Circle
        { tool: 'brush', color: '#F59E0B', size: 14, points: this.createCircle(600, 450, 160) },
        // Ray Top
        { tool: 'brush', color: '#F59E0B', size: 10, points: [{ x: 600, y: 260 }, { x: 600, y: 140 }] },
        // Ray Bottom
        { tool: 'brush', color: '#F59E0B', size: 10, points: [{ x: 600, y: 640 }, { x: 600, y: 760 }] },
        // Ray Left
        { tool: 'brush', color: '#F59E0B', size: 10, points: [{ x: 410, y: 450 }, { x: 290, y: 450 }] },
        // Ray Right
        { tool: 'brush', color: '#F59E0B', size: 10, points: [{ x: 790, y: 450 }, { x: 910, y: 450 }] },
        // Diagonal Rays
        { tool: 'brush', color: '#F59E0B', size: 8, points: [{ x: 470, y: 320 }, { x: 380, y: 230 }] },
        { tool: 'brush', color: '#F59E0B', size: 8, points: [{ x: 730, y: 320 }, { x: 820, y: 230 }] },
        // Smiling Face
        { tool: 'brush', color: '#1E1B4B', size: 8, points: [{ x: 530, y: 480 }, { x: 600, y: 540 }, { x: 670, y: 480 }] },
      ];
    }

    if (word.includes('tree') || word.includes('forest') || word.includes('nature')) {
      return [
        // Trunk
        { tool: 'brush', color: '#78350F', size: 24, points: [{ x: 580, y: 520 }, { x: 570, y: 800 }, { x: 630, y: 800 }, { x: 620, y: 520 }] },
        // Foliage cloud bottom
        { tool: 'brush', color: '#10B981', size: 16, points: [{ x: 380, y: 540 }, { x: 820, y: 540 }] },
        // Foliage big puffy crown
        { tool: 'brush', color: '#10B981', size: 12, points: this.createCircle(600, 360, 200) },
        // Fruit / Apples
        { tool: 'brush', color: '#EF4444', size: 18, points: [{ x: 520, y: 320 }, { x: 520, y: 320 }] },
        { tool: 'brush', color: '#EF4444', size: 18, points: [{ x: 680, y: 340 }, { x: 680, y: 340 }] },
        { tool: 'brush', color: '#EF4444', size: 18, points: [{ x: 600, y: 240 }, { x: 600, y: 240 }] },
      ];
    }

    if (word.includes('car') || word.includes('vehicle') || word.includes('truck')) {
      return [
        // Car Body Base
        { tool: 'brush', color: '#3B82F6', size: 12, points: [{ x: 300, y: 550 }, { x: 900, y: 550 }, { x: 880, y: 640 }, { x: 320, y: 640 }, { x: 300, y: 550 }] },
        // Cabin Roof
        { tool: 'brush', color: '#3B82F6', size: 10, points: [{ x: 420, y: 550 }, { x: 500, y: 400 }, { x: 720, y: 400 }, { x: 800, y: 550 }] },
        // Left Wheel
        { tool: 'brush', color: '#1E1B4B', size: 14, points: this.createCircle(440, 650, 50) },
        // Right Wheel
        { tool: 'brush', color: '#1E1B4B', size: 14, points: this.createCircle(760, 650, 50) },
        // Headlight
        { tool: 'brush', color: '#F59E0B', size: 14, points: [{ x: 890, y: 570 }, { x: 900, y: 570 }] },
      ];
    }

    if (word.includes('rollercoaster') || word.includes('roller-coaster') || word.includes('coaster')) {
      return [
        // Loopy tracks
        { tool: 'brush', color: '#EF4444', size: 10, points: [
          { x: 150, y: 650 }, { x: 280, y: 250 }, { x: 420, y: 620 }, { x: 560, y: 380 },
          { x: 680, y: 200 }, { x: 780, y: 320 }, { x: 850, y: 520 }, { x: 1050, y: 650 }
        ]},
        // Support pylons
        { tool: 'brush', color: '#64748B', size: 6, points: [{ x: 280, y: 250 }, { x: 280, y: 750 }] },
        { tool: 'brush', color: '#64748B', size: 6, points: [{ x: 680, y: 200 }, { x: 680, y: 750 }] },
        // Train cart
        { tool: 'brush', color: '#7C3AED', size: 12, points: [{ x: 640, y: 205 }, { x: 720, y: 215 }] },
        // Passengers
        { tool: 'brush', color: '#F59E0B', size: 8, points: [{ x: 655, y: 185 }, { x: 655, y: 185 }] },
        { tool: 'brush', color: '#10B981', size: 8, points: [{ x: 695, y: 190 }, { x: 695, y: 190 }] },
      ];
    }

    // Default Fallback: Stylized artistic mystery icon based on category
    return [
      // Base frame oval
      { tool: 'brush', color: '#7C3AED', size: 10, points: this.createCircle(600, 450, 180) },
      // Star core
      { tool: 'brush', color: '#F59E0B', size: 8, points: [
        { x: 600, y: 320 }, { x: 640, y: 410 }, { x: 740, y: 420 }, { x: 660, y: 480 },
        { x: 690, y: 580 }, { x: 600, y: 520 }, { x: 510, y: 580 }, { x: 540, y: 480 },
        { x: 460, y: 420 }, { x: 560, y: 410 }, { x: 600, y: 320 }
      ]},
      // Accent sparkle dots
      { tool: 'brush', color: '#06B6D4', size: 12, points: [{ x: 420, y: 300 }, { x: 420, y: 300 }] },
      { tool: 'brush', color: '#EC4899', size: 12, points: [{ x: 780, y: 590 }, { x: 780, y: 590 }] },
    ];
  }

  private static createCircle(cx: number, cy: number, r: number, steps = 24): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      points.push({
        x: Math.round(cx + Math.cos(angle) * r),
        y: Math.round(cy + Math.sin(angle) * r),
      });
    }
    return points;
  }
}
