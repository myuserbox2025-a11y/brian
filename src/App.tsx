import React, { useState } from 'react';
import { 
  FileText, 
  Combine, 
  FileSignature, 
  RefreshCw, 
  Download, 
  Plus, 
  Trash2,
  Settings2,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { FileUpload } from '@/components/FileUpload';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { SignaturePlacer } from '@/components/SignaturePlacer';
import { mergePDFs, imagesToPDF, signPDF, getPageDimensions } from '@/lib/pdf-utils';
import { cn } from '@/lib/utils';

type Tool = 'merge' | 'convert' | 'sign';

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool>('merge');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [sigPosition, setSigPosition] = useState<{ x: number; y: number; width: number; height: number; pageIndex: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`成功添加 ${newFiles.length} 個文件`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(Array.from(e.target.files));
      // Reset input value to allow adding the same file again if needed
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error('請至少選擇兩個 PDF 文件進行合併');
      return;
    }
    setIsProcessing(true);
    try {
      const pdfBytesArray = await Promise.all(files.map(async f => new Uint8Array(await f.arrayBuffer())));
      const mergedBytes = await mergePDFs(pdfBytesArray);
      downloadBlob(mergedBytes, 'merged.pdf');
      toast.success('PDF 合併成功！');
    } catch (error) {
      console.error(error);
      toast.error('合併過程中出錯');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertImages = async () => {
    if (files.length === 0) {
      toast.error('請選擇要轉換的圖片');
      return;
    }
    setIsProcessing(true);
    try {
      const imageData = await Promise.all(files.map(async f => ({
        bytes: new Uint8Array(await f.arrayBuffer()),
        type: f.type
      })));
      const pdfBytes = await imagesToPDF(imageData);
      downloadBlob(pdfBytes, 'converted.pdf');
      toast.success('圖片轉換成功！');
    } catch (error) {
      console.error(error);
      toast.error('轉換過程中出錯');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSign = async () => {
    if (files.length === 0 || !signature || !sigPosition) {
      toast.error('請選擇 PDF 文件並提供簽名及其位置');
      return;
    }
    setIsProcessing(true);
    try {
      const pdfBytes = new Uint8Array(await files[0].arrayBuffer());
      
      const signedBytes = await signPDF(
        pdfBytes, 
        signature, 
        sigPosition.pageIndex, 
        sigPosition.x, 
        sigPosition.y, 
        sigPosition.width, 
        sigPosition.height
      );
      
      downloadBlob(signedBytes, 'signed.pdf');
      toast.success('簽名已添加！');
    } catch (error) {
      console.error(error);
      toast.error('簽名過程中出錯');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadBlob = (bytes: Uint8Array, fileName: string) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-primary/20">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">PDF Master</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>100% 本地處理</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>極速處理</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar / Tool Selection */}
            <div className="lg:col-span-3 space-y-4">
              <div className="space-y-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
                  PDF 工具箱
                </h2>
                {[
                  { id: 'merge', label: '合併 PDF', icon: Combine, desc: '將多個 PDF 合併為一' },
                  { id: 'convert', label: '圖片轉 PDF', icon: RefreshCw, desc: '將圖片轉換為 PDF' },
                  { id: 'sign', label: '簽名 PDF', icon: FileSignature, desc: '在 PDF 上添加電子簽名' },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(tool.id as Tool);
                      setFiles([]);
                      setSignature(null);
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left",
                      activeTool === tool.id 
                        ? "bg-white shadow-sm border border-primary/10 text-primary" 
                        : "hover:bg-white/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tool.icon className={cn("w-5 h-5 mt-0.5", activeTool === tool.id ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <div className="font-semibold text-sm">{tool.label}</div>
                      <div className="text-[11px] opacity-70 leading-tight">{tool.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <Card className="bg-primary/5 border-none shadow-none">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">隱私保證</CardTitle>
                  <CardDescription className="text-[11px]">
                    您的文件不會上傳到任何服務器。所有操作均在您的瀏覽器中本地完成。
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTool}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-none shadow-xl shadow-black/5 overflow-hidden">
                    <CardHeader className="bg-white border-b p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl font-bold">
                            {activeTool === 'merge' && '合併 PDF 文件'}
                            {activeTool === 'convert' && '將圖片轉換為 PDF'}
                            {activeTool === 'sign' && 'PDF 簽名'}
                          </CardTitle>
                          <CardDescription>
                            {activeTool === 'merge' && '選擇多個 PDF 文件，我們將把它們合併成一個文檔。'}
                            {activeTool === 'convert' && '選擇 JPG 或 PNG 圖片，我們將把它們轉換為 PDF 頁面。'}
                            {activeTool === 'sign' && '上傳 PDF 並在頁面上添加您的簽名。'}
                          </CardDescription>
                        </div>
                        {files.length > 0 && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setFiles([])}
                            className="rounded-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            清空
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {files.length === 0 ? (
                          <FileUpload 
                            onFilesAdded={handleFilesAdded}
                            accept={activeTool === 'convert' ? { 'image/*': ['.jpg', '.jpeg', '.png'] } : { 'application/pdf': ['.pdf'] }}
                          />
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                multiple 
                                accept={activeTool === 'convert' ? '.jpg,.jpeg,.png' : '.pdf'} 
                                onChange={handleInputChange}
                              />
                              {files.map((file, index) => (
                                <div 
                                  key={index}
                                  className="flex flex-col p-3 bg-white rounded-xl border shadow-sm group relative"
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-primary/5 rounded flex items-center justify-center shrink-0">
                                      {activeTool === 'convert' ? (
                                        <img 
                                          src={URL.createObjectURL(file)} 
                                          alt="thumbnail" 
                                          className="w-full h-full object-cover rounded"
                                          onLoad={(e) => URL.revokeObjectURL((e.target as any).src)}
                                        />
                                      ) : (
                                        <FileText className="w-4 h-4 text-primary" />
                                      )}
                                    </div>
                                    <div className="truncate flex-1">
                                      <p className="text-xs font-semibold truncate">{file.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button 
                                      onClick={() => removeFile(index)}
                                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {activeTool === 'convert' && (
                                    <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                                      <img 
                                        src={URL.createObjectURL(file)} 
                                        alt="preview" 
                                        className="w-full h-full object-contain"
                                        onLoad={(e) => URL.revokeObjectURL((e.target as any).src)}
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground h-full min-h-[100px]"
                              >
                                <Plus className="w-6 h-6" />
                                <span className="text-xs font-semibold">添加更多</span>
                              </button>
                            </div>

                            {activeTool === 'sign' && (
                              <div className="mt-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                      <FileSignature className="w-4 h-4" />
                                      1. 繪製您的簽名
                                    </h3>
                                    <SignatureCanvas onSave={(sig) => {
                                      setSignature(sig);
                                      toast.success('簽名已保存');
                                    }} />
                                  </div>
                                  <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                      <Settings2 className="w-4 h-4" />
                                      2. 預覽與放置
                                    </h3>
                                    {signature ? (
                                      <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded border p-1 shrink-0">
                                          <img src={signature} alt="Signature" className="w-full h-full object-contain" />
                                        </div>
                                        <p className="text-xs text-green-700 font-medium">簽名已就緒，請在下方預覽中拖拽放置。</p>
                                      </div>
                                    ) : (
                                      <div className="h-64 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                                        請先完成簽名
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {signature && (
                                  <div className="space-y-4 pt-6 border-t">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                      <ChevronRight className="w-4 h-4" />
                                      3. 拖拽簽名到合適位置
                                    </h3>
                                    <SignaturePlacer 
                                      pdfFile={files[0]} 
                                      signatureBase64={signature} 
                                      onPositionChange={setSigPosition} 
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="pt-6 border-t flex justify-end">
                              <Button 
                                size="lg" 
                                disabled={isProcessing || (activeTool === 'sign' && !signature)}
                                onClick={
                                  activeTool === 'merge' ? handleMerge :
                                  activeTool === 'convert' ? handleConvertImages :
                                  handleSign
                                }
                                className="rounded-full px-8 shadow-lg shadow-primary/20"
                              >
                                {isProcessing ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    處理中...
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    {activeTool === 'merge' && '合併並下載'}
                                    {activeTool === 'convert' && '轉換並下載'}
                                    {activeTool === 'sign' && '簽署並下載'}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        <footer className="mt-auto py-12 border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 opacity-50">
              <FileText className="w-5 h-5" />
              <span className="font-bold">PDF Master</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 PDF Master. 隱私優先，100% 瀏覽器端處理。
            </p>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <a href="#" className="hover:text-primary">使用條款</a>
              <a href="#" className="hover:text-primary">隱私政策</a>
              <a href="#" className="hover:text-primary">幫助中心</a>
            </div>
          </div>
        </footer>
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  );
}

