import CameraUI from '@/components/CameraUI';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 font-sans py-12">
      <div className="w-full max-w-md mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            NutriVision AI
          </h1>
          <p className="text-slate-400 text-sm">
            AI 智慧辨識食物與熱量預估，一拍即刻紀錄！
          </p>
        </header>

        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
          <CameraUI />
        </section>
      </div>
    </main>
  );
}
