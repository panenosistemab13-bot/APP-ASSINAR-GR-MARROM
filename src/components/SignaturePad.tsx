import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 200;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClear?.();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="glass rounded-[2.5rem] border-white/20 overflow-hidden touch-none relative bg-white/5 group">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair relative z-10"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
          <p className="text-4xl font-black text-white uppercase tracking-[1em] -rotate-12">Assine Aqui</p>
        </div>
        <div className="absolute bottom-4 right-6 pointer-events-none z-20">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Digital Signature Secure</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={clear}
          className="flex-1 py-5 px-6 glass border-white/10 rounded-2xl text-white/60 font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          Limpar Campo
        </button>
        <button
          onClick={save}
          className="flex-1 py-5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:scale-[1.02] transition-all active:scale-95"
        >
          Confirmar Assinatura
        </button>
      </div>
    </div>
  );
};
