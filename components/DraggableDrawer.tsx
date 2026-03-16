"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

interface DraggableDrawerProps {
  onClose: () => void;
  children: ReactNode;
}

export function DraggableDrawer({ onClose, children }: DraggableDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    // Only allow dragging down
    if (delta > 0) {
      setTranslateY(delta);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    // If dragged more than 120px down, close
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
  }, [translateY, onClose]);

  // Mouse support for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startY.current = e.clientY;
    currentY.current = startY.current;
    setIsDragging(true);

    const handleMouseMove = (ev: MouseEvent) => {
      currentY.current = ev.clientY;
      const delta = currentY.current - startY.current;
      if (delta > 0) {
        setTranslateY(delta);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const finalDelta = currentY.current - startY.current;
      if (finalDelta > 120) {
        onClose();
      } else {
        setTranslateY(0);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - translateY / 400) }}
      />
      <div
        ref={panelRef}
        className={`relative bg-slate-900 border-t border-white/10 sm:border rounded-t-[32px] sm:rounded-[32px] p-4 sm:p-6 w-full max-w-lg pb-8 sm:pb-6 ${
          isDragging ? "" : "transition-transform duration-300 ease-out"
        }`}
        style={{
          transform: `translateY(${translateY}px)`,
          animation: translateY === 0 && !isDragging ? undefined : "none",
        }}
      >
        {/* Drag Handle */}
        <div
          className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing sm:cursor-default touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        <div className="mt-4 max-h-[75vh] sm:max-h-[85vh] overflow-y-auto hide-scrollbar -mx-2 px-2 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}
