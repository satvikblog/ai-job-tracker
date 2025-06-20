import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AIGeneration {
  id: string;
  jobApplicationId: string;
  type: 'resume' | 'cover-letter';
  content: string;
  generatedOn: string;
  isUsed: boolean;
}

interface JobAnalysis {
  keywords: string[];
  skills: string[];
  requirements: string[];
  companyInfo: string;
  roleLevel: string;
  industry: string;
  salaryRange?: string;
  benefits?: string[];
  workMode?: string;
}

export function useAIGenerations() {
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeJobDescription = (jobDescription: string): JobAnalysis => {
    const text = jobDescription.toLowerCase();
    
    // Enhanced keyword extraction
    const techKeywords = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'python', 'java', 'c++', 'c#',
      'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible',
      'git', 'github', 'gitlab', 'bitbucket', 'agile', 'scrum', 'kanban', 'jira',
      'api', 'rest', 'graphql', 'microservices', 'serverless', 'lambda',
      'machine learning', 'ai', 'data science', 'analytics', 'big data', 'spark',
      'cybersecurity', 'devops', 'ci/cd', 'testing', 'automation',
      'frontend', 'backend', 'full-stack', 'mobile', 'ios', 'android', 'flutter', 'react native',
      'html', 'css', 'sass', 'less', 'webpack', 'babel', 'npm', 'yarn',
      'express', 'django', 'flask', 'spring', 'laravel', 'rails'
    ];

    const softSkills = [
      'communication', 'leadership', 'teamwork', 'collaboration', 'problem solving', 
      'analytical thinking', 'critical thinking', 'project management', 'time management',
      'adaptability', 'creativity', 'innovation', 'attention to detail', 'customer service',
      'presentation skills', 'mentoring', 'coaching', 'strategic thinking', 'decision making'
    ];

    const foundKeywords = techKeywords.filter(keyword => text.includes(keyword));
    const foundSkills = softSkills.filter(skill => text.includes(skill));

    // Extract requirements with better patterns
    const requirementPatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
      /bachelor'?s?\s*(?:degree)?/gi,
      /master'?s?\s*(?:degree)?/gi,
      /phd|doctorate/gi,
      /certification|certified/gi,
      /required|must\s*have|essential|mandatory/gi,
      /preferred|nice\s*to\s*have|bonus|plus/gi
    ];

    const requirements: string[] = [];
    requirementPatterns.forEach(pattern => {
      const matches = jobDescription.match(pattern);
      if (matches) {
        requirements.push(...matches.slice(0, 3)); // Limit matches per pattern
      }
    });

    // Enhanced role level detection
    let roleLevel = 'Mid-level';
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('staff')) {
      roleLevel = 'Senior';
    } else if (text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('intern')) {
      roleLevel = 'Junior';
    } else if (text.includes('manager') || text.includes('director') || text.includes('head of') || text.includes('vp')) {
      roleLevel = 'Management';
    } else if (text.includes('architect') || text.includes('expert') || text.includes('specialist')) {
      roleLevel = 'Expert';
    }

    // Industry detection
    let industry = 'Technology';
    if (text.includes('finance') || text.includes('banking') || text.includes('fintech')) {
      industry = 'Finance';
    } else if (text.includes('healthcare') || text.includes('medical') || text.includes('pharma')) {
      industry = 'Healthcare';
    } else if (text.includes('education') || text.includes('university') || text.includes('school')) {
      industry = 'Education';
    } else if (text.includes('retail') || text.includes('e-commerce') || text.includes('ecommerce')) {
      industry = 'Retail';
    } else if (text.includes('gaming') || text.includes('game') || text.includes('entertainment')) {
      industry = 'Gaming';
    } else if (text.includes('startup') || text.includes('venture')) {
      industry = 'Startup';
    }

    // Extract salary information
    const salaryPatterns = [
      /\$[\d,]+\s*-?\s*\$?[\d,]*\s*(?:per\s*year|annually|\/year)?/gi,
      /₹[\d,]+\s*-?\s*₹?[\d,]*\s*(?:lpa|per\s*annum|annually)?/gi,
      /[\d,]+k?\s*-?\s*[\d,]*k?\s*(?:usd|inr|eur|gbp)?/gi
    ];

    let salaryRange = '';
    for (const pattern of salaryPatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        salaryRange = match[0];
        break;
      }
    }

    // Extract benefits
    const benefitKeywords = [
      'health insurance', 'dental', 'vision', 'medical', '401k', 'retirement',
      'pto', 'vacation', 'sick leave', 'remote work', 'work from home',
      'flexible hours', 'stock options', 'equity', 'bonus', 'gym membership',
      'learning budget', 'conference', 'training', 'certification reimbursement'
    ];

    const benefits = benefitKeywords.filter(benefit => text.includes(benefit));

    // Work mode detection
    let workMode = 'On-site';
    if (text.includes('remote') || text.includes('work from home') || text.includes('distributed')) {
      workMode = 'Remote';
    } else if (text.includes('hybrid') || text.includes('flexible')) {
      workMode = 'Hybrid';
    }

    return {
      keywords: foundKeywords,
      skills: foundSkills,
      requirements: requirements.slice(0, 8), // Limit to top 8
      companyInfo: extractCompanyInfo(jobDescription),
      roleLevel,
      industry,
      salaryRange,
      benefits: benefits.slice(0, 5),
      workMode
    };
  };

  const extractCompanyInfo = (jobDescription: string): string => {
    const lines = jobDescription.split('\n');
    const companyLine = lines.find(line => 
      line.toLowerCase().includes('about') && 
      (line.toLowerCase().includes('company') || line.toLowerCase().includes('us'))
    );
    
    if (companyLine) {
      const index = lines.indexOf(companyLine);
      return lines.slice(index, index + 3).join(' ').substring(0, 300) + '...';
    }
    
    return 'Innovative technology company focused on delivering cutting-edge solutions and creating exceptional user experiences.';
  };

  const generateResumeContent = (analysis: JobAnalysis, jobTitle: string, companyName: string): string => {
    const { keywords, skills, roleLevel, industry, requirements } = analysis;

    // Generate clean, plain text format
    let content = `AI-OPTIMIZED RESUME SUGGESTIONS FOR ${jobTitle.toUpperCase()} AT ${companyName.toUpperCase()}\n\n`;
    
    content += `KEYWORD OPTIMIZATION\n`;
    content += `Based on the job description analysis, ensure your resume includes these critical keywords:\n\n`;
    
    content += `Technical Keywords:\n`;
    keywords.slice(0, 10).forEach(keyword => {
      content += `• ${keyword.toUpperCase()}\n`;
    });
    
    content += `\nSoft Skills:\n`;
    skills.slice(0, 6).forEach(skill => {
      content += `• ${skill.charAt(0).toUpperCase() + skill.slice(1)}\n`;
    });

    content += `\n\nPROFESSIONAL SUMMARY SUGGESTIONS\n`;
    content += `Craft a compelling summary that aligns with this ${roleLevel} ${jobTitle} role:\n\n`;
    content += `"Results-driven ${roleLevel.toLowerCase()} professional with expertise in ${keywords.slice(0, 3).join(', ')}. Proven track record of delivering high-quality solutions in the ${industry.toLowerCase()} industry. Strong background in ${skills.slice(0, 2).join(' and ')}, with a passion for innovation and continuous learning."\n\n`;

    content += `EXPERIENCE SECTION OPTIMIZATION\n\n`;
    content += `Action Verbs to Use:\n`;
    const actionVerbs = ['Developed', 'Implemented', 'Optimized', 'Led', 'Collaborated', 'Designed', 'Architected', 'Streamlined', 'Enhanced', 'Delivered', 'Managed', 'Coordinated', 'Facilitated', 'Mentored', 'Achieved'];
    actionVerbs.forEach(verb => {
      content += `• ${verb}\n`;
    });

    content += `\nQuantifiable Achievement Examples:\n`;
    content += `• "Improved system performance by 40% through optimization of ${keywords[0] || 'core technologies'}"\n`;
    content += `• "Led a team of 5+ developers to deliver projects 20% ahead of schedule"\n`;
    content += `• "Reduced deployment time by 60% by implementing CI/CD pipelines"\n`;
    content += `• "Increased user engagement by 35% through responsive design improvements"\n`;
    content += `• "Decreased bug reports by 50% through comprehensive testing strategies"\n`;

    content += `\n\nTECHNICAL SKILLS SECTION\n`;
    content += `Organize your skills to match the job requirements:\n\n`;
    content += `Programming Languages: ${keywords.filter(k => ['javascript', 'typescript', 'python', 'java', 'c++', 'c#'].includes(k)).join(', ') || 'JavaScript, Python, Java'}\n`;
    content += `Frameworks & Libraries: ${keywords.filter(k => ['react', 'vue', 'angular', 'node.js', 'express', 'django'].includes(k)).join(', ') || 'React, Node.js, Express'}\n`;
    content += `Databases: ${keywords.filter(k => ['postgresql', 'mongodb', 'mysql', 'redis'].includes(k)).join(', ') || 'PostgreSQL, MongoDB, Redis'}\n`;
    content += `Cloud & DevOps: ${keywords.filter(k => ['aws', 'azure', 'docker', 'kubernetes'].includes(k)).join(', ') || 'AWS, Docker, Kubernetes'}\n`;
    content += `Tools & Methodologies: ${keywords.filter(k => ['git', 'agile', 'scrum', 'jira'].includes(k)).join(', ') || 'Git, Agile, Scrum'}\n`;

    content += `\n\nEDUCATION & CERTIFICATIONS\n`;
    content += `Highlight relevant education and certifications:\n`;
    content += `• Include any certifications related to ${keywords.slice(0, 2).join(', ')}\n`;
    content += `• Mention relevant coursework or projects\n`;
    content += `• Add completion dates for recent certifications\n`;
    content += `• Include GPA if above 3.5 and recent graduate\n`;

    content += `\n\nATS OPTIMIZATION TIPS\n`;
    content += `1. Use standard section headings (Experience, Education, Skills)\n`;
    content += `2. Include exact keyword matches from the job description\n`;
    content += `3. Use bullet points for easy scanning\n`;
    content += `4. Avoid graphics, tables, or complex formatting\n`;
    content += `5. Save as both PDF and Word formats\n`;
    content += `6. Use 10-12 point font size\n`;
    content += `7. Keep to 1-2 pages maximum\n`;

    content += `\n\nTAILORING RECOMMENDATIONS FOR ${companyName.toUpperCase()}\n`;
    content += `• Research the company's recent projects and technologies\n`;
    content += `• Align your experience with their tech stack: ${keywords.slice(0, 4).join(', ')}\n`;
    content += `• Emphasize experience in ${industry.toLowerCase()} industry if applicable\n`;
    content += `• Highlight any relevant ${roleLevel.toLowerCase()}-level responsibilities\n`;
    if (analysis.workMode) {
      content += `• Mention experience with ${analysis.workMode.toLowerCase()} work if relevant\n`;
    }

    content += `\n\nIMPACT METRICS TO INCLUDE\n`;
    content += `• Performance improvements (speed, efficiency, accuracy percentages)\n`;
    content += `• Team size and project scope (number of team members, project duration)\n`;
    content += `• Budget management and cost savings (dollar amounts, percentage savings)\n`;
    content += `• User base growth and engagement metrics (user numbers, engagement rates)\n`;
    content += `• Code quality improvements (test coverage, bug reduction percentages)\n`;
    content += `• Revenue impact (sales increases, cost reductions)\n`;

    if (requirements.length > 0) {
      content += `\n\nKEY REQUIREMENTS TO ADDRESS\n`;
      requirements.forEach(req => {
        content += `• ${req}\n`;
      });
    }

    content += `\n\nFINAL CHECKLIST\n`;
    content += `□ Contact information is current and professional\n`;
    content += `□ Professional summary mentions ${keywords.slice(0, 3).join(', ')}\n`;
    content += `□ Each job experience has 3-5 quantified bullet points\n`;
    content += `□ Skills section matches job requirements\n`;
    content += `□ No spelling or grammar errors\n`;
    content += `□ Consistent formatting throughout\n`;
    content += `□ File saved as "FirstName_LastName_Resume.pdf"\n`;

    content += `\n\nRemember: Tailor each section to match the specific requirements mentioned in the job description while maintaining honesty and accuracy about your experience. Focus on achievements and impact rather than just responsibilities.`;

    return content;
  };

  const generateCoverLetterContent = (
    analysis: JobAnalysis, 
    jobTitle: string, 
    companyName: string,
    hiringManager: string,
    tone: string,
    personalExperience: string,
    whyCompany: string
  ): string => {
    const { keywords, skills, companyInfo, roleLevel, industry, benefits, workMode } = analysis;
    
    const greeting = hiringManager ? `Dear ${hiringManager},` : 'Dear Hiring Manager,';
    
    const toneAdjustments = {
      professional: {
        opening: "I am writing to express my strong interest in",
        enthusiasm: "I am excited about the opportunity to contribute to",
        closing: "I look forward to discussing how my experience can benefit",
        transition: "Furthermore,",
        confidence: "I am confident that"
      },
      friendly: {
        opening: "I'm thrilled to apply for",
        enthusiasm: "I'm genuinely excited about the possibility of joining",
        closing: "I'd love to chat about how I can contribute to",
        transition: "What's more,",
        confidence: "I believe"
      },
      enthusiastic: {
        opening: "I'm incredibly excited to apply for",
        enthusiasm: "I'm passionate about the opportunity to bring my skills to",
        closing: "I can't wait to discuss how my experience aligns with",
        transition: "Additionally,",
        confidence: "I'm thrilled that"
      },
      formal: {
        opening: "I wish to formally apply for",
        enthusiasm: "I would be honored to contribute to",
        closing: "I respectfully request the opportunity to discuss",
        transition: "Moreover,",
        confidence: "I am certain that"
      },
      creative: {
        opening: "Your search for a dynamic",
        enthusiasm: "I'm inspired by the opportunity to innovate with",
        closing: "Let's explore how my creative approach can enhance",
        transition: "Beyond that,",
        confidence: "I envision"
      }
    };

    const selectedTone = toneAdjustments[tone as keyof typeof toneAdjustments] || toneAdjustments.professional;

    // Generate clean, plain text cover letter
    let content = `${greeting}\n\n`;
    
    content += `${selectedTone.opening} the ${jobTitle} position at ${companyName}. With my background in ${keywords.slice(0, 3).join(', ')} and proven expertise in ${skills.slice(0, 2).join(' and ')}, I am confident I would be a valuable addition to your team.\n\n`;

    content += `WHY I'M THE RIGHT FIT:\n\n`;
    
    if (personalExperience) {
      content += `${personalExperience} My technical expertise includes proficiency in ${keywords.slice(0, 5).join(', ')}, which directly aligns with your requirements for this ${roleLevel.toLowerCase()} position.\n\n`;
    } else {
      content += `In my previous roles, I have developed strong proficiency in the key technologies you're seeking, including ${keywords.slice(0, 4).join(', ')}. I have successfully delivered projects that required ${skills.slice(0, 3).join(', ')}, consistently exceeding performance expectations and contributing to team success.\n\n`;
    }

    content += `Key qualifications that make me an ideal candidate:\n`;
    content += `• Expertise in ${keywords.slice(0, 3).join(', ')} with hands-on project experience\n`;
    content += `• Strong ${skills.slice(0, 2).join(' and ')} skills demonstrated through successful team collaborations\n`;
    content += `• Proven ability to deliver high-quality solutions in fast-paced ${industry.toLowerCase()} environments\n`;
    content += `• ${roleLevel}-level experience with a track record of driving measurable results\n`;
    if (workMode && workMode !== 'On-site') {
      content += `• Experience working effectively in ${workMode.toLowerCase()} environments\n`;
    }

    content += `\nWHAT DRAWS ME TO ${companyName.toUpperCase()}:\n\n`;
    
    if (whyCompany) {
      content += `${whyCompany} ${selectedTone.enthusiasm} ${companyName} and contribute to your continued success in the ${industry.toLowerCase()} space.\n\n`;
    } else {
      content += `${companyInfo} Your commitment to innovation and excellence in the ${industry.toLowerCase()} space aligns perfectly with my career goals and values. ${selectedTone.enthusiasm} ${companyName} and contribute to your mission of delivering exceptional solutions.\n\n`;
    }

    content += `${selectedTone.transition} I am particularly excited about the opportunity to work with ${keywords.slice(0, 2).join(' and ')} technologies and contribute to ${companyName}'s innovative projects. My passion for continuous learning and staying current with industry trends would enable me to make an immediate impact while growing with your organization.\n\n`;

    if (benefits && benefits.length > 0) {
      content += `I'm also drawn to ${companyName}'s comprehensive benefits package and commitment to employee growth, which aligns with my values of work-life balance and professional development.\n\n`;
    }

    content += `WHAT I BRING TO THE TABLE:\n\n`;
    content += `• Technical Excellence: Deep knowledge of ${keywords.slice(0, 4).join(', ')}\n`;
    content += `• Leadership Skills: Experience in ${skills.filter(s => s.includes('leadership') || s.includes('management') || s.includes('mentoring')).join(', ') || 'team collaboration and project coordination'}\n`;
    content += `• Problem-Solving: Analytical approach to complex technical challenges\n`;
    content += `• Communication: Ability to translate technical concepts for diverse audiences\n`;
    content += `• Adaptability: Quick learner who thrives in dynamic ${industry.toLowerCase()} environments\n\n`;

    content += `${selectedTone.confidence} my combination of technical expertise, ${skills.slice(0, 2).join(' and ')} skills, and passion for ${industry.toLowerCase()} innovation makes me an excellent fit for this role. I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${companyName}'s continued success.\n\n`;

    content += `${selectedTone.closing} ${companyName}'s goals and objectives. Thank you for considering my application. I look forward to hearing from you soon.\n\n`;

    content += `Best regards,\n[Your Name]\n\n`;

    content += `---\n`;
    content += `COVER LETTER OPTIMIZATION NOTES:\n`;
    content += `• This letter includes ${keywords.length} relevant keywords from the job description\n`;
    content += `• Tone: ${tone.charAt(0).toUpperCase() + tone.slice(1)}\n`;
    content += `• Industry focus: ${industry}\n`;
    content += `• Role level: ${roleLevel}\n`;
    if (workMode) {
      content += `• Work mode: ${workMode}\n`;
    }
    content += `• ATS-optimized with natural keyword integration\n`;
    content += `• Length: Approximately 350-400 words (ideal for cover letters)\n`;

    return content;
  };

  const generateContent = async (
    jobApplicationId: string,
    type: 'resume' | 'cover-letter',
    jobDescription: string,
    additionalData?: any
  ) => {
    setLoading(true);
    try {
      // Get user's OpenAI API key
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: settings } = await supabase
        .from('user_settings')
        .select('openai_api_key')
        .eq('user_id', user.id)
        .single();

      // Simulate AI processing time with realistic delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const analysis = analyzeJobDescription(jobDescription);
      
      let content = '';
      
      if (type === 'resume') {
        content = generateResumeContent(
          analysis,
          additionalData?.jobTitle || 'Software Engineer',
          additionalData?.companyName || 'Target Company'
        );
      } else {
        content = generateCoverLetterContent(
          analysis,
          additionalData?.jobTitle || 'Software Engineer',
          additionalData?.companyName || 'Target Company',
          additionalData?.hiringManager || '',
          additionalData?.tone || 'professional',
          additionalData?.personalExperience || '',
          additionalData?.whyCompany || ''
        );
      }

      const newGeneration: AIGeneration = {
        id: Date.now().toString(),
        jobApplicationId,
        type,
        content,
        generatedOn: new Date().toISOString(),
        isUsed: false,
      };

      // Save to database
      await supabase.from('ai_generations').insert({
        job_application_id: jobApplicationId,
        type,
        content,
        is_used: false
      });

      setGenerations(prev => [newGeneration, ...prev]);
      toast.success(`${type === 'resume' ? 'Resume suggestions' : 'Cover letter'} generated successfully!`);
      return newGeneration;
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveGeneration = async (id: string, content: string, isUsed: boolean = false) => {
    try {
      await supabase
        .from('ai_generations')
        .update({ content, is_used: isUsed })
        .eq('id', id);

      setGenerations(prev => 
        prev.map(gen => 
          gen.id === id ? { ...gen, content, isUsed } : gen
        )
      );
      toast.success('Content saved successfully!');
    } catch (error) {
      console.error('Error saving generation:', error);
      toast.error('Failed to save content');
      throw error;
    }
  };

  const exportContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Content exported successfully!');
  };

  return {
    generations,
    loading,
    generateContent,
    saveGeneration,
    exportContent,
    fetchGenerations: () => {},
  };
}