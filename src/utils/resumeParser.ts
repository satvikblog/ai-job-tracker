import * as pdfjsLib from 'pdfjs-dist';

export interface ResumeSection {
  type: 'skills' | 'experience' | 'education' | 'projects' | 'achievements' | 'summary' | 'contact' | 'other';
  title: string;
  content: string;
}

export interface ParsedResume {
  sections: ResumeSection[];
  rawText: string;
}

// Section identification patterns
const sectionPatterns = {
  skills: [
    /\b(skills|technical skills|core competencies|technologies|proficiencies|expertise)\b/i,
  ],
  experience: [
    /\b(experience|work experience|employment|professional experience|work history)\b/i,
  ],
  education: [
    /\b(education|academic background|qualifications|academic credentials|degrees)\b/i,
  ],
  projects: [
    /\b(projects|personal projects|key projects|portfolio|project experience)\b/i,
  ],
  achievements: [
    /\b(achievements|accomplishments|awards|honors|recognitions|certifications)\b/i,
  ],
  summary: [
    /\b(summary|profile|professional summary|career objective|objective|about me)\b/i,
  ],
  contact: [
    /\b(contact|contact information|personal information|contact details)\b/i,
  ],
};

/**
 * Categorizes resume text into sections
 */
export function categorizeResumeSections(text: string): ParsedResume {
  // Normalize line breaks and remove extra whitespace
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Split text into lines
  const lines = normalizedText.split('\n');
  
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let currentContent: string[] = [];
  
  // Identify potential section headers
  const potentialHeaders: { line: string; index: number; type: ResumeSection['type'] }[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) return;
    
    // Check if this line looks like a section header
    const isHeader = 
      // All caps or title case with limited length
      (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 30) ||
      // Has colon at the end
      trimmedLine.endsWith(':') ||
      // Underlined with dashes or equals
      (index < lines.length - 1 && 
        (lines[index + 1].trim().match(/^[-=]{3,}$/) || 
         lines[index - 1]?.trim().match(/^[-=]{3,}$/)));
    
    if (isHeader) {
      // Determine section type
      let sectionType: ResumeSection['type'] = 'other';
      
      for (const [type, patterns] of Object.entries(sectionPatterns)) {
        if (patterns.some(pattern => pattern.test(trimmedLine))) {
          sectionType = type as ResumeSection['type'];
          break;
        }
      }
      
      potentialHeaders.push({
        line: trimmedLine,
        index,
        type: sectionType
      });
    }
  });
  
  // Process sections based on identified headers
  if (potentialHeaders.length > 0) {
    potentialHeaders.forEach((header, idx) => {
      const nextHeaderIndex = idx < potentialHeaders.length - 1 
        ? potentialHeaders[idx + 1].index 
        : lines.length;
      
      const sectionContent = lines
        .slice(header.index + 1, nextHeaderIndex)
        .filter(line => line.trim())
        .join('\n');
      
      sections.push({
        type: header.type,
        title: header.line.replace(/:/g, '').trim(),
        content: sectionContent
      });
    });
  } else {
    // If no sections were identified, try a different approach
    // Look for common section keywords in the text
    let remainingText = normalizedText;
    
    // Try to extract a summary/profile section from the beginning
    const summaryMatch = remainingText.match(/^(.*?)\n\n/s);
    if (summaryMatch && summaryMatch[1].length < 1000) {
      sections.push({
        type: 'summary',
        title: 'Summary',
        content: summaryMatch[1].trim()
      });
      remainingText = remainingText.substring(summaryMatch[0].length);
    }
    
    // Look for skills section (often contains bullet points or comma-separated lists)
    const skillsPattern = /\b(skills|technologies|tools|languages|frameworks|proficient in|expertise in)[\s\S]*?(•|\*|,|;|\/)/i;
    const skillsMatch = remainingText.match(skillsPattern);
    if (skillsMatch) {
      // Try to extract a reasonable skills section
      const skillsText = extractReasonableSection(remainingText, skillsMatch.index);
      if (skillsText) {
        sections.push({
          type: 'skills',
          title: 'Skills',
          content: skillsText.trim()
        });
      }
    }
    
    // Look for experience section (often contains dates, job titles)
    const experiencePattern = /\b(20\d{2}|19\d{2})[-–—]?(20\d{2}|present|current|now)\b/i;
    const experienceMatch = remainingText.match(experiencePattern);
    if (experienceMatch) {
      // Try to extract a reasonable experience section
      const experienceText = extractReasonableSection(remainingText, experienceMatch.index, 1500);
      if (experienceText) {
        sections.push({
          type: 'experience',
          title: 'Experience',
          content: experienceText.trim()
        });
      }
    }
    
    // If we still don't have sections, just use the whole text as "other"
    if (sections.length === 0) {
      sections.push({
        type: 'other',
        title: 'Resume Content',
        content: normalizedText
      });
    }
  }
  
  return {
    sections,
    rawText: normalizedText
  };
}

/**
 * Extract a reasonable section of text starting from a position
 */
function extractReasonableSection(text: string, startIndex: number, maxLength = 1000): string | null {
  if (startIndex < 0 || startIndex >= text.length) return null;
  
  // Find the start of the line containing startIndex
  let sectionStart = startIndex;
  while (sectionStart > 0 && text[sectionStart - 1] !== '\n') {
    sectionStart--;
  }
  
  // Find a reasonable end point (double newline or max length)
  let sectionEnd = Math.min(sectionStart + maxLength, text.length);
  const doubleNewlineIndex = text.indexOf('\n\n', sectionStart);
  if (doubleNewlineIndex > 0 && doubleNewlineIndex < sectionEnd) {
    sectionEnd = doubleNewlineIndex;
  }
  
  return text.substring(sectionStart, sectionEnd);
}

/**
 * Extracts skills from a resume text
 */
export function extractSkills(text: string): string[] {
  const skillsKeywords = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust',
    // Web Technologies
    'HTML', 'CSS', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
    // Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'Oracle', 'Redis', 'Cassandra', 'DynamoDB',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible',
    // Data Science & ML
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision',
    // Mobile
    'iOS', 'Android', 'React Native', 'Flutter', 'Xamarin',
    // Tools & Methodologies
    'Git', 'GitHub', 'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence',
    // Soft Skills
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Time Management'
  ];
  
  const foundSkills: string[] = [];
  const textLower = text.toLowerCase();
  
  skillsKeywords.forEach(skill => {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });
  
  return foundSkills;
}

/**
 * Parses a resume file and categorizes its content
 */
export async function parseResumeFile(file: File): Promise<ParsedResume> {
  return new Promise(async (resolve, reject) => {
    try {
      let text = '';
      
      // Handle different file types
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Parse PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        
        // Get total number of pages
        const numPages = pdf.numPages;
        
        // Extract text from each page
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          text += pageText + '\n\n';
        }
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        // Parse text file
        text = await file.text();
      } else {
        // For other file types, try to read as text
        text = await file.text();
      }
      
      // Clean up the text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n')
        .replace(/\n+/g, '\n\n')
        .trim();
      
      // Categorize the text into sections
      const parsedResume = categorizeResumeSections(text);
      
      resolve(parsedResume);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Analyzes a resume and provides insights
 */
export function analyzeResume(parsedResume: ParsedResume): {
  skills: string[];
  missingKeywords: string[];
  experienceYears: number | null;
  educationLevel: string | null;
  suggestions: string[];
} {
  const { sections, rawText } = parsedResume;
  
  // Extract skills
  const skills = extractSkills(rawText);
  
  // Common missing skills that might be valuable
  const commonSkills = ['JavaScript', 'Python', 'SQL', 'AWS', 'React', 'Git', 'Agile'];
  const missingKeywords = commonSkills.filter(skill => !skills.includes(skill));
  
  // Try to determine years of experience
  let experienceYears: number | null = null;
  const experienceSection = sections.find(s => s.type === 'experience');
  if (experienceSection) {
    // Look for patterns like "X years of experience" or date ranges
    const yearsPattern = /(\d+)[\+]?\s+years?/i;
    const yearsMatch = experienceSection.content.match(yearsPattern);
    if (yearsMatch) {
      experienceYears = parseInt(yearsMatch[1], 10);
    } else {
      // Try to calculate from date ranges
      const dateRanges = experienceSection.content.match(/\b(20\d{2}|19\d{2})[-–—]?(20\d{2}|present|current|now)\b/gi);
      if (dateRanges && dateRanges.length > 0) {
        // Rough estimation based on earliest and latest dates
        const years = dateRanges.map(range => {
          const dates = range.split(/[-–—]/);
          const startYear = parseInt(dates[0], 10);
          const endYear = dates[1]?.toLowerCase().includes('present') ? new Date().getFullYear() : parseInt(dates[1], 10);
          return endYear - startYear;
        });
        
        experienceYears = Math.max(...years);
      }
    }
  }
  
  // Try to determine education level
  let educationLevel: string | null = null;
  const educationSection = sections.find(s => s.type === 'education');
  if (educationSection) {
    const content = educationSection.content.toLowerCase();
    if (content.includes('phd') || content.includes('doctorate')) {
      educationLevel = 'PhD';
    } else if (content.includes('master') || content.includes('msc') || content.includes('ms ') || content.includes('ma ')) {
      educationLevel = 'Master\'s';
    } else if (content.includes('bachelor') || content.includes('bsc') || content.includes('bs ') || content.includes('ba ')) {
      educationLevel = 'Bachelor\'s';
    } else if (content.includes('associate') || content.includes('diploma')) {
      educationLevel = 'Associate\'s';
    }
  }
  
  // Generate suggestions
  const suggestions: string[] = [];
  
  // Check if summary exists
  const hasSummary = sections.some(s => s.type === 'summary');
  if (!hasSummary) {
    suggestions.push('Add a professional summary to highlight your key qualifications');
  }
  
  // Check skills section
  if (skills.length < 5) {
    suggestions.push('Expand your skills section with more technical and soft skills');
  }
  
  // Check for quantifiable achievements
  const hasQuantifiableAchievements = rawText.match(/\b(\d+%|\d+x|\$\d+|increased|decreased|improved|reduced|saved|generated)\b/i);
  if (!hasQuantifiableAchievements) {
    suggestions.push('Add quantifiable achievements to demonstrate impact (e.g., "Increased efficiency by 20%")');
  }
  
  // Check for action verbs
  const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed', 'built', 'launched'];
  const hasActionVerbs = actionVerbs.some(verb => rawText.toLowerCase().includes(verb));
  if (!hasActionVerbs) {
    suggestions.push('Use strong action verbs to describe your experience (e.g., "Led", "Developed", "Implemented")');
  }
  
  return {
    skills,
    missingKeywords,
    experienceYears,
    educationLevel,
    suggestions
  };
}