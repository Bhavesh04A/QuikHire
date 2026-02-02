'use client';
import { useState, useEffect } from 'react';
import { createSyncClient } from '@sleekcms/client';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [cmsData, setCmsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    type: '', // Will default to first option after load
    message: '' 
  });

  // 1. Fetch Contact Info from SleekCMS
  useEffect(() => {
    async function fetchContactInfo() {
      try {
        const client = await createSyncClient({
          siteToken: process.env.NEXT_PUBLIC_SLEEKCMS_SITE_TOKEN!,
          env: 'latest',
        });
        const data = client.getPage('/contact');
        setCmsData(data);
        
        // Set default inquiry type if available
        if (data?.inquiry_types) {
           // ✅ FIX: Force String() to ensure .split() works
           const types = Array.isArray(data.inquiry_types) 
             ? data.inquiry_types 
             : String(data.inquiry_types).split(',');
           
           if (types.length > 0) setFormData(prev => ({ ...prev, type: types[0].trim() }));
        }
      } catch (error) {
        console.error("CMS Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContactInfo();
  }, []);

  // 2. Submit Form to Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        ...formData,
        timestamp: new Date().toISOString(),
        status: 'new'
      });
      alert("Message sent! Our team will contact you shortly.");
      setFormData({ name: '', email: '', type: formData.type, message: '' }); 
    } catch (error) { 
      console.error("Firebase Error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to parse options safely
  const getOptions = () => {
    if (!cmsData?.inquiry_types) return [];
    
    // Case 1: It's already an array
    if (Array.isArray(cmsData.inquiry_types)) {
      return cmsData.inquiry_types.map((opt: any) => typeof opt === 'string' ? opt : JSON.stringify(opt));
    }
    
    // Case 2: It's a comma-separated string
    // ✅ FIX: Force String() here too for safety
    if (typeof cmsData.inquiry_types === 'string') {
      return cmsData.inquiry_types.split(',').map((s: string) => s.trim());
    }

    return [];
  };

  const options = getOptions();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8"/></div>;

  return (
    <section className="max-w-7xl mx-auto py-15 px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        
        {/* LEFT COLUMN: CMS Content */}
        <div>
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            Contact Us
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
            {cmsData?.title || "Get in Touch"}
          </h1>
          <p className="text-xl text-slate-500 mb-12 leading-relaxed">
            {cmsData?.subtitle || "Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
          </p>
          
          <div className="space-y-8">
            <div className="flex items-start gap-6 group">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Mail size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Email Us</p>
                <a href={`mailto:${cmsData?.email_address}`} className="text-slate-500 hover:text-blue-600 transition-colors">
                  {cmsData?.email_address || "support@quickhire.com"}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-6 group">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Phone size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Call Us</p>
                <p className="text-slate-500">
                  {cmsData?.phone_number || "+1 (555) 000-0000"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 group">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <MapPin size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Visit HQ</p>
                <p className="text-slate-500 max-w-xs">
                  {cmsData?.office_location || "123 Tech Street, San Francisco, CA"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Firebase Form */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
            <MessageSquare className="text-blue-600"/> Send a Message
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                required 
                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none font-medium"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                required 
                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none font-medium"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Subject</label>
              <div className="relative">
                <select 
                  className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none font-medium appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  {options.length > 0 ? (
                      options.map((type: string, i: number) => (
                        <option key={i} value={type}>{type}</option>
                      ))
                  ) : (
                    <>
                      <option>Job Seeker Support</option>
                      <option>Recruiter Partnerships</option>
                      <option>Technical Issue</option>
                      <option>General Inquiry</option>
                    </>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Message</label>
              <textarea 
                placeholder="How can we help you?" 
                required 
                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-32 resize-none transition-all outline-none font-medium"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="btn-primary w-full py-4 flex justify-center items-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {submitting ? <Loader2 className="animate-spin"/> : <><Send className="w-5 h-5" /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}