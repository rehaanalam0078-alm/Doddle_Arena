import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stroke, DrawingTool, Point } from '@/types/game';

interface DrawingCanvasProps {
  isInteractive: boolean; // true for drawer, false for guessers/spectators
  currentTool?: DrawingTool;
  currentColor?: string;
  currentBrushSize?: number;
  strokes: Stroke[];
  onEmitStroke?: (stroke: Stroke) => void;
  showGrid?: boolean;
  zoomScale?: number;
}

const LOGICAL_WIDTH = 1200;
const LOGICAL_HEIGHT = 900;

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isInteractive,
  currentTool = 'brush',
  currentColor = '#1E1B4B',
  currentBrushSize = 8,
  strokes,
  onEmitStroke,
  showGrid = false,
  zoomScale = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<Point[]>([]);
  const startPointRef = useRef<Point | null>(null);

  // Redraw all strokes on canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with crisp paper white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Render strokes
    for (const stroke of strokes) {
      renderStroke(ctx, stroke);
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Render a single stroke
  const renderStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const { tool, color, size, points } = stroke;
    if (!points || points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = size * 1.5;
    } else {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = size;
    }

    if (tool === 'brush' || tool === 'eraser') {
      if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      }
    } else if (tool === 'line') {
      if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
      }
    } else if (tool === 'rectangle') {
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[points.length - 1];
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      }
    } else if (tool === 'circle') {
      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[points.length - 1];
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (tool === 'fill') {
      // Flood fill representation
      floodFill(ctx, Math.round(points[0].x), Math.round(points[0].y), color);
    }

    ctx.restore();
  };

  // Flood fill algorithm
  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColorHex: string
  ) => {
    try {
      const imgData = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      const data = imgData.data;

      const fillR = parseInt(fillColorHex.slice(1, 3), 16) || 0;
      const fillG = parseInt(fillColorHex.slice(3, 5), 16) || 0;
      const fillB = parseInt(fillColorHex.slice(5, 7), 16) || 0;

      const startIndex = (startY * LOGICAL_WIDTH + startX) * 4;
      const targetR = data[startIndex];
      const targetG = data[startIndex + 1];
      const targetB = data[startIndex + 2];

      if (targetR === fillR && targetG === fillG && targetB === fillB) return;

      const match = (idx: number) => {
        return (
          Math.abs(data[idx] - targetR) < 30 &&
          Math.abs(data[idx + 1] - targetG) < 30 &&
          Math.abs(data[idx + 2] - targetB) < 30
        );
      };

      const pixelStack: [number, number][] = [[startX, startY]];
      const seen = new Uint8Array(LOGICAL_WIDTH * LOGICAL_HEIGHT);

      while (pixelStack.length > 0) {
        const [x, y] = pixelStack.pop()!;
        if (x < 0 || x >= LOGICAL_WIDTH || y < 0 || y >= LOGICAL_HEIGHT) continue;

        const pos = y * LOGICAL_WIDTH + x;
        if (seen[pos]) continue;
        seen[pos] = 1;

        const idx = pos * 4;
        if (match(idx)) {
          data[idx] = fillR;
          data[idx + 1] = fillG;
          data[idx + 2] = fillB;
          data[idx + 3] = 255;

          pixelStack.push([x + 1, y]);
          pixelStack.push([x - 1, y]);
          pixelStack.push([x, y + 1]);
          pixelStack.push([x, y - 1]);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Flood fill cross-origin note:', e);
    }
  };

  // Convert mouse/touch event into logical 1200x900 coordinate
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;

    const x = Math.max(0, Math.min(LOGICAL_WIDTH, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(LOGICAL_HEIGHT, (e.clientY - rect.top) * scaleY));

    return { x, y };
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isInteractive) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    const pt = getCoordinates(e);
    setIsDrawing(true);
    startPointRef.current = pt;
    currentPointsRef.current = [pt];

    if (currentTool === 'fill') {
      const stroke: Stroke = {
        id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tool: 'fill',
        color: currentColor,
        size: currentBrushSize,
        points: [pt],
        seq: Date.now(),
      };
      if (onEmitStroke) onEmitStroke(stroke);
      setIsDrawing(false);
      return;
    }

    // Draw single point immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, currentBrushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isInteractive || !isDrawing) return;
    const pt = getCoordinates(e);
    currentPointsRef.current.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'brush' || currentTool === 'eraser') {
      const pts = currentPointsRef.current;
      if (pts.length >= 2) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
        ctx.lineWidth = currentTool === 'eraser' ? currentBrushSize * 1.5 : currentBrushSize;

        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Geometric shapes preview: redraw previous strokes and overlay live shape
      redraw();
      renderStroke(ctx, {
        id: 'preview',
        tool: currentTool,
        color: currentColor,
        size: currentBrushSize,
        points: [startPointRef.current!, pt],
        seq: 0,
      });
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isInteractive || !isDrawing) return;
    setIsDrawing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    const pts = currentPointsRef.current;
    if (pts.length === 0) return;

    const stroke: Stroke = {
      id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tool: currentTool,
      color: currentColor,
      size: currentBrushSize,
      points: [...pts],
      seq: Date.now(),
    };

    if (onEmitStroke) {
      onEmitStroke(stroke);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl select-none bg-surface-container-low"
    >
      <div
        className="relative shadow-lg border-2 border-outline-variant rounded-2xl overflow-hidden bg-white transition-transform duration-150"
        style={{
          width: '100%',
          maxWidth: '1000px',
          aspectRatio: '4 / 3',
          transform: `scale(${zoomScale})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          className={`w-full h-full block ${
            isInteractive
              ? currentTool === 'eraser'
                ? 'cursor-cell'
                : currentTool === 'fill'
                ? 'cursor-pointer'
                : 'cursor-crosshair'
              : 'cursor-default'
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Optional Alignment Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(to right, #7C3AED 1px, transparent 1px), linear-gradient(to bottom, #7C3AED 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        )}
      </div>
    </div>
  );
};
