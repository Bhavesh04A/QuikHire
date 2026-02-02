'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles, Loader2, Copy, Check, X, FileText } from 'lucide-react';

interface Props {
  jobTitle: string;
  companyName: string;
}

export default function CoverLetterGenerator({ jobTitle, companyName }: Props) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const generateLetter = async () => {
    if (!user) {
        alert("Please login to generate a cover letter.");
        return;
    }
    setLoading(true);
    
    try {
      // 1. Fetch User Profile to get Name and Skills
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      const userData = docSnap.exists() ? docSnap.data() : {};
      
      const userName = userData.name || user.displayName || "Candidate";
      // Extract skills from bio or experience if no explicit skills field
      const userSkills = userData.bio || userData.experience || "highly motivated professional";

      // 2. Call AI API
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_cover_letter',
          data: {
            userName,
            userSkills,
            jobTitle,
            companyName
          }
        })
      });

      const data = await response.json();
      if (data.reply) setLetter(data.reply);
      else throw new Error("No response");

    } catch (error) {
      console.error(error);
      alert("Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); if (!letter) generateLetter(); }}
        className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Sparkles size={16} /> Generate Cover Letter
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg"><FileText size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg">AI Cover Letter</h3>
                  <p className="text-xs text-slate-400">Tailored for {companyName}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <p className="text-sm font-bold animate-pulse">Analyzing your profile & job details...</p>
                </div>
              ) : (
                <textarea 
                  className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium text-sm"
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={generateLetter} 
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm"
              >
                Regenerate
              </button>
              <button 
                onClick={copyToClipboard}
                disabled={loading || !letter}
                className="btn-primary px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}