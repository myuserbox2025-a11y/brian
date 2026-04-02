import React, { useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureBase64: string) => void;
  onClear?: () => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(0, 0, 0)',
      });

      const resizeCanvas = () => {
        if (canvasRef.current) {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
          canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
          canvasRef.current.getContext('2d')?.scale(ratio, ratio);
          signaturePadRef.current?.clear();
        }
      };

      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();

      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    onClear?.();
  };

  const handleSave = () => {
    if (signaturePadRef.current?.isEmpty()) {
      return;
    }
    const dataUrl = signaturePadRef.current?.toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg bg-white overflow-hidden h-64 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="w-4 h-4 mr-2" />
          清除
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Check className="w-4 h-4 mr-2" />
          確認簽名
        </Button>
      </div>
    </div>
  );
};
