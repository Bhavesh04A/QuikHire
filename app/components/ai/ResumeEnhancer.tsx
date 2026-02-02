'use client';
import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, ArrowRight } from 'lucide-react';

export default function ResumeEnhancer() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnhance = async () => {
    if (!input) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'enhance_resume', 
            data: { text: input } 
        })
      });
      const data = await res.json();
      if (data.reply) setOutput(data.reply);
    } catch (e) {
      alert("Failed to enhance text.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Sparkles size={18} />
        </div>
        <h3 className="font-bold text-slate-800">AI Resume Enhancer</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Your Draft (Rough Notes)</label>
            <textarea 
                className="w-full h-32 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="e.g. I did sales for the company and increased profit."
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
        </div>
        <div className="relative">
            <label className="text-[10px] uppercase font-bold text-blue-600 mb-2 block">Professional Version</label>
            <div className="w-full h-32 p-3 rounded-xl bg-white border border-blue-100 text-sm text-slate-700 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-blue-400 gap-2">
                        <Loader2 className="animate-spin" size={16} /> Enhancing...
                    </div>
                ) : output || <span className="text-slate-300 italic">Result will appear here...</span>}
            </div>
            {output && (
                <button 
                    onClick={copyToClipboard} 
                    className="absolute top-8 right-2 p-1.5 bg-white border border-slate-100 rounded-md hover:bg-slate-50 text-slate-500"
                    title="Copy to clipboard"
                >
                    {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                </button>
            )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button 
            onClick={handleEnhance} 
            disabled={loading || !input}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
            <Sparkles size={16} /> Enhance Text
        </button>
      </div>
    </div>
  );
}