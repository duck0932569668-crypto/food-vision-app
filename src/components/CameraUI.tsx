"use client";

import { useState, useRef, ChangeEvent } from "react";

type FoodItem = {
  name: string;
  quantity: number;
  calories: number;
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
};

type AnalysisResult = {
  foods: FoodItem[];
  totalCalories: number;
};

export default function CameraUI() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setResult(null);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawCanvas(img);
    };
    img.src = url;
  };

  const drawCanvas = (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const MAX_WIDTH = window.innerWidth > 500 ? 400 : window.innerWidth - 80;
          const scale = MAX_WIDTH / img.width;
          const width = MAX_WIDTH;
          const height = img.height * scale;
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
        }
      }
  };

  const drawBoundingBoxes = (foods: FoodItem[]) => {
      const canvas = canvasRef.current;
      if (!canvas || !imgRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Redraw original image to clear old boxes
      drawCanvas(imgRef.current);
      
      // Draw boxes and text
      foods.forEach((food) => {
         if (food.boundingBox && food.boundingBox.length === 4) {
             const [ymin, xmin, ymax, xmax] = food.boundingBox;
             
             // Convert 0-1000 coordinates to canvas pixels
             const boxY = (ymin / 1000) * canvas.height;
             const boxX = (xmin / 1000) * canvas.width;
             const boxHeight = ((ymax - ymin) / 1000) * canvas.height;
             const boxWidth = ((xmax - xmin) / 1000) * canvas.width;
             
             ctx.strokeStyle = "#10b981"; // Emerald-500
             ctx.lineWidth = 3;
             ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
             
             // Draw label background
             ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
             const label = `${food.name} (${food.calories}kcal)`;
             ctx.font = "bold 14px sans-serif";
             const textWidth = ctx.measureText(label).width;
             ctx.fillRect(boxX, boxY - 24, textWidth + 10, 24);
             
             // Draw label text
             ctx.fillStyle = "#ffffff";
             ctx.fillText(label, boxX + 5, boxY - 7);
         }
      });
  };

  const handleAnalyze = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      setIsAnalyzing(true);
      try {
          const base64Image = canvas.toDataURL("image/jpeg", 0.8);
          const res = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: base64Image })
          });
          
          if (!res.ok) throw new Error("API responded with an error");
          
          const data: AnalysisResult = await res.json();
          setResult(data);
          
          drawBoundingBoxes(data.foods);
      } catch (err) {
          console.error(err);
          alert("分析失敗，請檢查網路狀態或重整頁面！");
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {!imageSrc ? (
        <label className="w-full cursor-pointer flex flex-col items-center justify-center p-10 border-2 border-dashed border-emerald-500/50 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-emerald-400 font-medium">開啟相機或上傳照片</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
      ) : (
        <div className="w-full flex flex-col items-center space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 w-full bg-slate-800 flex justify-center py-2">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg shadow-inner"></canvas>
            
            {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-emerald-400 font-medium mt-3">AI 視覺分析中...</span>
                </div>
            )}
          </div>
          
          {result && (
              <div className="w-full bg-slate-800/80 p-4 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-lg font-bold text-white mb-2 flex justify-between items-end border-b border-slate-700 pb-2">
                     <span>辨識結果</span>
                     <span className="text-2xl text-emerald-400">{result.totalCalories} <span className="text-sm text-slate-400">kcal</span></span>
                  </h3>
                  <ul className="space-y-2 mt-3">
                      {result.foods.map((f, i) => (
                          <li key={i} className="flex justify-between text-slate-300 items-center">
                              <span className="flex items-center space-x-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>{f.name} &times; {f.quantity}</span>
                              </span>
                              <span className="font-medium text-white">{f.calories} kcal</span>
                          </li>
                      ))}
                      {result.foods.length === 0 && (
                          <li className="text-slate-400 text-center py-2">未辨識到明確的食物</li>
                      )}
                  </ul>
              </div>
          )}
          
          <div className="flex w-full space-x-3 pt-2">
            <label className="flex-1 cursor-pointer py-3 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium border border-slate-700">
              重新拍攝
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex-1 py-3 text-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
              送出 AI 分析
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
