'use client';
import { createSyncClient } from '@sleekcms/client';
import Link from 'next/link';
import { MapPin, ArrowRight, ShieldCheck, Building2, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cmsTitle, setCmsTitle] = useState("Hiring Companies");

  // Helper: Create safe URL slug from name
  const createSlug = (name: string) => {
    return name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'company';
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch CMS Data
        const client = await createSyncClient({
          siteToken: process.env.NEXT_PUBLIC_SLEEKCMS_SITE_TOKEN!,
          env: 'latest',
        });
        
        const page = client.getPage('/companies');
        
        if (page?.title) {
            setCmsTitle(String(page.title));
        }

        let cmsData = client.getEntry('companies');
        
        const cmsList = (Array.isArray(cmsData) ? cmsData : (cmsData ? [cmsData] : []))
          .map((comp: any) => ({
             ...comp,
             slug: createSlug(comp.name), 
             isFirebase: false
          }));

        // 2. Fetch Firebase Recruiters
        let fbList: any[] = [];
        try {
          const q = query(collection(db, "users"), where("role", "==", "recruiter"));
          const snap = await getDocs(q);
          fbList = snap.docs.map(doc => ({ 
            _id: doc.id, 
            ...doc.data(), 
            slug: doc.id, 
            isFirebase: true 
          }));
        } catch (e) {
          console.error("Firebase Error:", e);
        }

        // 3. Combine & Set State
        setCompanies([...cmsList, ...fbList]);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const stripHtml = (html: string) => html?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8"/></div>;

  return (
    <section className="fade-up py-10 space-y-12 max-w-7xl mx-auto px-4">
      <header className="mb-16 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">
          {cmsTitle}
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Discover companies that are actively hiring through our unified portal.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {companies.map((company: any, index: number) => (
          <Link
            key={company._id || index}
            href={`/companies/${company.slug}`} 
            className="card group hover:border-blue-500 flex flex-col relative p-6 bg-white border border-slate-100 rounded-3xl transition-all shadow-sm hover:shadow-xl"
          >
            {!company.isFirebase && (
              <div className="absolute top-4 right-4 text-blue-600 bg-blue-50 p-1.5 rounded-full" title="Official Partner">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}

            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                {company.logo?.url || company.companyLogo ? (
                  <img src={company.logo?.url || company.companyLogo} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="text-slate-300" size={32} />
                )}
              </div>
              <span className="p-2 rounded-full bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors leading-tight">
              {company.name || company.companyName || "Unnamed Company"}
            </h2>
            
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-4">
              <MapPin className="w-4 h-4" />
              {company.location || "Remote / Various"}
            </div>

            <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-6">
              {company.description ? stripHtml(company.description) : "View company profile and active job listings."}
            </p>
            
            <div className="mt-auto pt-4 border-t border-slate-50 text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-600">
              View Profile
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}