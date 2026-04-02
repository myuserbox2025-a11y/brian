import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Draggable from 'react-draggable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Set worker source using Vite's ?url import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface SignaturePlacerProps {
  pdfFile: File;
  signatureBase64: string;
  onPositionChange: (pos: { x: number; y: number; width: number; height: number; pageIndex: number }) => void;
}

export const SignaturePlacer: React.FC<SignaturePlacerProps> = ({ 
  pdfFile, 
  signatureBase64, 
  onPositionChange 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [sigWidth, setSigWidth] = useState(150);
  const [sigHeight, setSigHeight] = useState(50);
  const [sigPos, setSigPos] = useState({ x: 50, y: 50 });
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const nodeRef = useRef(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const loadPdf = async () => {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const loadedPdf = await loadingTask.promise;
      setPdf(loadedPdf);
      setNumPages(loadedPdf.numPages);
    };
    loadPdf();
  }, [pdfFile]);

  useEffect(() => {
    if (pdf) {
      renderPage();
    }
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageIndex, scale]);

  const renderPage = async () => {
    if (!pdf || !canvasRef.current) return;

    // Cancel previous render task if it exists
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }
    
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    setPageDimensions({ width: viewport.width, height: viewport.height });

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    const renderTask = page.render(renderContext);
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;
      renderTaskRef.current = null;
      // Initial position update after render
      updateParent(sigPos.x, sigPos.y, sigWidth, sigHeight);
    } catch (error: any) {
      if (error.name === 'RenderingCancelledException') {
        console.log('Rendering cancelled');
      } else {
        console.error('Rendering error:', error);
      }
    }
  };

  const updateParent = (x: number, y: number, w: number, h: number) => {
    if (!pageDimensions.width || !pageDimensions.height) return;
    
    // PDF coordinates are from bottom-left
    // UI coordinates are from top-left
    // pdfPoint = uiPixel / scale
    
    const pdfX = x / scale;
    // In UI, y is distance from top. In PDF, y is distance from bottom.
    // pdfY = (uiPageHeight - uiY - uiSigHeight) / scale
    const pdfY = (pageDimensions.height - y - h) / scale;
    const pdfW = w / scale;
    const pdfH = h / scale;
    
    onPositionChange({
      x: pdfX,
      y: pdfY,
      width: pdfW,
      height: pdfH,
      pageIndex
    });
  };

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    setSigPos({ x: data.x, y: data.y });
    updateParent(data.x, data.y, sigWidth, sigHeight);
  };

  const handleResize = (val: number[]) => {
    const newWidth = val[0];
    const newHeight = newWidth / 3; // Keep aspect ratio roughly 3:1
    setSigWidth(newWidth);
    setSigHeight(newHeight);
    updateParent(sigPos.x, sigPos.y, newWidth, newHeight);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            disabled={pageIndex === 0}
            onClick={() => setPageIndex(prev => prev - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">第 {pageIndex + 1} 頁 / 共 {numPages} 頁</span>
          <Button 
            variant="outline" 
            size="icon" 
            disabled={pageIndex === numPages - 1}
            onClick={() => setPageIndex(prev => prev + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 w-48">
          <span className="text-xs text-muted-foreground shrink-0">簽名大小</span>
          <Slider 
            defaultValue={[sigWidth]} 
            max={400} 
            min={50} 
            step={1} 
            onValueChange={handleResize}
          />
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative border rounded-lg overflow-auto bg-muted/20 flex justify-center p-4 max-h-[600px]"
      >
        <div className="relative shadow-2xl">
          <canvas ref={canvasRef} className="block" />
          
          <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            onDrag={handleDrag}
            position={sigPos}
          >
            <div 
              ref={nodeRef}
              className="absolute top-0 left-0 cursor-move border-2 border-primary/50 bg-primary/5 group"
              style={{ width: sigWidth, height: sigHeight }}
            >
              <img 
                src={signatureBase64} 
                alt="Signature" 
                className="w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute -top-6 left-0 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                拖拽以放置簽名
              </div>
            </div>
          </Draggable>
        </div>
      </div>
    </div>
  );
};
