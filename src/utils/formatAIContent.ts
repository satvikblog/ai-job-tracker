/**
 * Formats AI-generated content for better readability
 * 
 * @param content The raw content from the AI
 * @returns Formatted content with proper markdown
 */
export function formatAIContent(content: string): string {
  // Replace markdown headings with styled headings
  let formatted = content
    // Format headings
    .replace(/^# (.*?)$/gm, '\n\n$1\n==============================\n')
    .replace(/^## (.*?)$/gm, '\n\n$1\n------------------------------\n')
    
    // Format bullet points
    .replace(/^\* (.*?)$/gm, '• $1')
    .replace(/^- (.*?)$/gm, '• $1')
    
    // Format bold text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    
    // Format italic text
    .replace(/\*(.*?)\*/g, '$1')
    
    // Ensure proper spacing
    .replace(/\n{3,}/g, '\n\n')
    
    // Clean up any remaining markdown artifacts
    .trim();
  
  return formatted;
}

/**
 * Formats AI-generated content specifically for resume suggestions
 * 
 * @param content The raw content from the AI
 * @returns Formatted content with proper structure
 */
export function formatResumeContent(content: string): string {
  // Replace markdown headings with styled headings
  let formatted = content
    // Format main headings
    .replace(/^# (.*?)$/gm, '\n\n$1\n==============================\n')
    
    // Format subheadings
    .replace(/^## (.*?)$/gm, '\n\n$1\n------------------------------\n')
    
    // Format bullet points
    .replace(/^\* (.*?)$/gm, '• $1')
    .replace(/^- (.*?)$/gm, '• $1')
    
    // Format bold text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    
    // Format italic text
    .replace(/\*(.*?)\*/g, '$1')
    
    // Ensure proper spacing
    .replace(/\n{3,}/g, '\n\n')
    
    // Clean up any remaining markdown artifacts
    .trim();
  
  return formatted;
}

/**
 * Formats AI-generated content specifically for cover letter paragraphs
 * 
 * @param content The raw content from the AI
 * @returns Formatted content with proper paragraph structure
 */
export function formatCoverLetterParagraph(content: string): string {
  // Clean up any markdown or formatting artifacts
  let formatted = content
    // Remove any headings
    .replace(/^#+ .*$/gm, '')
    
    // Remove bullet points
    .replace(/^[•\-*] /gm, '')
    
    // Remove bold/italic formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    
    // Ensure proper paragraph breaks
    .replace(/\n{2,}/g, '\n\n')
    
    // Clean up any remaining markdown artifacts
    .trim();
  
  return formatted;
}