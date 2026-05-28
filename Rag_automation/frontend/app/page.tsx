import DocumentUpload from '@/components/DocumentUpload';
import ChatWindow from '@/components/ChatWindow';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      {/* Background gradients for premium feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 flex flex-col gap-12">
        <header className="text-center space-y-4 pt-8">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
            <span className="text-indigo-400 font-medium tracking-wide text-sm px-2">Knowledge Assistant v1.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text drop-shadow-sm">
            Company RAG Intelligence
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Upload your company documents and interact with them in real-time. Powered by advanced vector search and Groq's high-speed inference.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-200">1. Upload Knowledge</h3>
              <p className="text-sm text-slate-400">Add documents to your company's vector database.</p>
            </div>
            <DocumentUpload />
            
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm mt-8">
              <h4 className="font-medium text-slate-200 mb-2">System Status</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Vector Database (Qdrant) Connected
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Groq Inference Engine Active
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  OpenAI Agents SDK Ready
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-200">2. Query Assistant</h3>
              <p className="text-sm text-slate-400">Ask questions based on the uploaded context.</p>
            </div>
            <ChatWindow />
          </div>
        </div>
      </div>
    </main>
  );
}
