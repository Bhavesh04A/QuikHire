import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, data, message, role } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    const groq = new Groq({ apiKey });
    
    let systemContent = "You are an expert Career and HR AI Assistant.";
    let userContent = "";
    let jsonMode = false;

    // --- 1. JD GENERATOR ---
    if (action === 'generate_jd') {
      systemContent = "You are an expert Technical Recruiter. Write professional job descriptions in Markdown.";
      userContent = `Write a Job Description for: ${data.title} in ${data.location} (${data.type}). Include Role, Responsibilities, Requirements, and Perks. No placeholders.`;
    } 
    
    // --- 2. RESUME ENHANCER ---
    else if (action === 'enhance_resume') {
        systemContent = "You are a Professional Resume Writer. Rewrite the text to be punchy, results-oriented, and professional using active verbs. Output ONLY the improved text.";
        userContent = `Rewrite this resume point: "${data.text}"`;
    }

    // --- 3. COVER LETTER GENERATOR ---
    else if (action === 'generate_cover_letter') {
        systemContent = "You are a Career Coach. Write a personalized, professional cover letter. Keep it under 200 words.";
        userContent = `
          Candidate Name: ${data.userName}
          Candidate Skills: ${data.userSkills}
          Job Title: ${data.jobTitle}
          Company: ${data.companyName}
          
          Write a cover letter explaining why the candidate is a great fit.
        `;
    }

    // --- 4. APPLICANT SCORER ---
    else if (action === 'score_applicant') {
        jsonMode = true;
        systemContent = "You are a Senior Hiring Manager. Analyze the candidate match. Output JSON only.";
        userContent = `
          Job Description: ${data.jobDescription}
          Candidate Resume/Profile: ${data.resumeText}
          
          Analyze the fit. Return ONLY a JSON object with this exact format:
          {
            "score": (number 0-100),
            "reason": "One short sentence explaining the score."
          }
        `;
    }

    // --- 5. SMART JOB MATCH (NEW) ---
    else if (action === 'job_match') {
        jsonMode = true;
        systemContent = "You are a Recruitment AI. Match the candidate to the best jobs. Output JSON only.";
        userContent = `
          Candidate Profile: ${data.userProfile}
          
          Available Jobs:
          ${JSON.stringify(data.jobs)}
          
          Return a JSON object containing an array called "matches".
          Format:
          {
            "matches": [
              { "jobId": "exact_id_from_list", "reason": "Short reason why" }
            ]
          }
        `;
    }

    // --- 6. CHATBOT (Default) ---
    else {
      systemContent = role === 'recruiter' 
        ? "You are an HR Assistant. Help with hiring tasks."
        : "You are a Career Coach. Help with job search.";
      userContent = message;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: jsonMode ? { type: "json_object" } : undefined 
    });

    const text = completion.choices[0]?.message?.content || "No response generated.";

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}