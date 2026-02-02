'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BrainCircuit, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  seekerId: string;
  jobTitle: string;
}

export default function ApplicantScorer({ seekerId, jobTitle }: Props) {
  const [score, setScore] = useState<{ score: number; reason: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const analyzeCandidate = async () => {
    if (score) {
        setExpanded(!expanded);
        return;
    }
    
    setLoading(true);
    try {
      // 1. Fetch Candidate Profile (Bio & Experience)
      const userDoc = await getDoc(doc(db, "users", seekerId));
      if (!userDoc.exists()) throw new Error("Candidate profile not found");
      
      const userData = userDoc.data();
      const resumeText = `Bio: ${userData.bio || "N/A"}\nExperience: ${userData.experience || "N/A"}`;

      // 2. Call AI
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'score_applicant',
          data: {
            jobDescription: jobTitle, // Using Title as proxy for full JD for speed
            resumeText: resumeText
          }
        })
      });

      const data = await response.json();
      // Parse the JSON response from AI
      const result = JSON.parse(data.reply);
      setScore(result);
      setExpanded(true);
    } catch (error) {
      console.error(error);
      alert("Could not analyze candidate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={analyzeCandidate}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
          score ? (score.score > 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700') 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
        }`}
      >
        {loading ? <Loader2 size={14} className="animate-spin"/> : <BrainCircuit size={14} />}
        {loading ? "Analyzing..." : (score ? `${score.score}% Match` : "AI Score")}
        {score && (expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
      </button>

      {/* Score Popover */}
      {expanded && score && (
        <div className="absolute top-full mt-2 left-0 z-20 w-64 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-slate-400">Analysis</span>
                <span className={`text-lg font-black ${score.score > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {score.score}/100
                </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {score.reason}
            </p>
        </div>
      )}
    </div>
  );
}