'use client';
import { createSyncClient } from '@sleekcms/client';
import { MapPin, Globe, ArrowLeft, Building2, Loader2, Briefcase } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CompanyDetailPage() {
  const { slug } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const createSlug = (name: string) => name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      
      try {
        const client = await createSyncClient({
          siteToken: process.env.NEXT_PUBLIC_SLEEKCMS_SITE_TOKEN!,
          env: 'latest',
        });

        // 1. Fetch CMS Lists
        let cmsCompanies = client.getEntry('companies');
        if (!Array.isArray(cmsCompanies)) cmsCompanies = cmsCompanies ? [cmsCompanies] : [];
        
        let cmsJobs = client.getEntry('jobs');
        if (!Array.isArray(cmsJobs)) cmsJobs = cmsJobs ? [cmsJobs] : [];

        // 2. Find Company in CMS
        let foundComp = cmsCompanies.find((c: any) => 
          String(c._id) === String(slug) || 
          String(c.slug) === String(slug) ||
          createSlug(c.name) === String(slug) 
        );
        
        let foundJobs: any[] = [];

        if (foundComp) {
          // ✅ FIX: Alias foundComp to a const variable inside the block.
          // This tells TypeScript: "I promise this variable is not null inside this block."
          const currentComp = foundComp; 

          foundJobs = cmsJobs.filter((j: any) => {
             // Use currentComp instead of foundComp
             const isSameId = j.company?._id && currentComp._id && String(j.company._id) === String(currentComp._id);
             const isSameName = j.company?.name === currentComp.name; 
             
             return (isSameId || isSameName) && j.status === 'active';
          });
        } else {
          // 3. Fallback to Firebase
          try {
            const docRef = doc(db, "users", String(slug));
            const snap = await getDoc(docRef);
            
            if (snap.exists() && snap.data().role === 'recruiter') {
              const data = snap.data();
              foundComp = { _id: snap.id, name: data.companyName, ...data, isFirebase: true };
              
              const q = query(collection(db, "jobs"), where("recruiterId", "==", slug), where("status", "==", "active"));
              const jobSnap = await getDocs(q);
              foundJobs = jobSnap.docs.map(d => ({ _id: d.id, ...d.data(), isFirebase: true }));
            }
          } catch(e) {
             console.error("Firebase lookup failed", e);
          }
        }

        setCompany(foundComp);
        setJobs(foundJobs);
      } catch (error) {
        console.error("Detail Error:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600"/></div>;
  if (!company) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Company Not Found</div>;

  return (
    <section className="fade-up space-y-12 py-10 px-4 max-w-6xl mx-auto">
      <Link href="/companies" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Companies
      </Link>

      <div className="flex flex-col md:flex-row gap-10 items-start border-b border-slate-100 pb-12 mt-5">
        <div className="w-32 h-32 rounded-[2rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center overflow-hidden shrink-0 p-2">
          {(company.logo?.url || company.companyLogo) ? (
            <img src={company.logo?.url || company.companyLogo} className="w-full h-full object-contain" alt={company.name} />
          ) : (
            <Building2 className="w-12 h-12 text-slate-300" />
          )}
        </div>
        
        <div className="flex-1">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tighter">
            {company.name}
          </h1>
          <div className="flex flex-wrap gap-6 text-slate-500 font-semibold text-sm">
            <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-500" /> {company.location || "Remote"}
            </span>
            {(company.website?.url || company.companyWebsite) && (
              <a href={company.website?.url || company.companyWebsite} target="_blank" className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                <Globe className="w-4 h-4" /> Visit Website
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <div>
            <h2 className="text-2xl font-black mb-6 text-slate-900">About the Company</h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap" 
                 dangerouslySetInnerHTML={{ __html: company.description || "No description available yet." }} />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-3xl font-black text-slate-900">Open Roles</h2>
               <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{jobs.length}</span>
            </div>
            
            <div className="grid gap-4">
              {jobs.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">No active openings at this moment.</p>
                </div>
              ) : (
                jobs.map((job: any) => (
                  <div key={job._id} className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between group hover:border-blue-500 transition-all bg-white shadow-sm hover:shadow-lg rounded-2xl gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{job.title}</h3>
                        <p className="text-sm font-medium text-slate-500">{job.location}</p>
                      </div>
                    </div>
                    <Link href={`/jobs/${job._id}`} className="btn-primary py-3 px-6 text-sm text-center">
                      View Details
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
           <div className="card p-8 bg-slate-50 border-slate-100 rounded-[2rem]">
              <h3 className="font-bold text-lg mb-4 text-slate-900">Quick Facts</h3>
              <ul className="space-y-4 text-sm text-slate-600">
                 <li className="flex justify-between border-b border-slate-200 pb-2">
                   <span>Headquarters</span>
                   <span className="font-bold">{company.location || 'N/A'}</span>
                 </li>
                 <li className="flex justify-between border-b border-slate-200 pb-2">
                   <span>Active Jobs</span>
                   <span className="font-bold text-blue-600">{jobs.length}</span>
                 </li>
                 <li className="flex justify-between">
                   <span>Source</span>
                   <span className="font-bold">{company.isFirebase ? 'Community' : 'Verified Partner'}</span>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </section>
  );
}