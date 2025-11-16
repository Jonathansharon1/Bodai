/**
 * Parse action items from markdown analysis text
 * This is a shared utility for both frontend and backend
 */

export const parseActionItems = (text) => {
  if (!text) return [];
  
  const items = [];
  const lines = text.split('\n');
  let currentAction = null;
  let introText = [];
  
  // Patterns that indicate this is NOT an action item (intro text)
  const introPatterns = [
    /^here are/i,
    /^these are/i,
    /^below are/i,
    /^following are/i,
    /^you'll find/i,
    /^let's/i,
    /^we'll/i,
    /^i'll/i,
    /^this will/i,
    /^these steps/i,
    /^these actions/i,
    /^the following/i,
    /^some practical/i,
    /^a few practical/i,
    /^practical steps/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    let cleaned = originalLine.trim();
    
    // Skip empty lines
    if (!cleaned) {
      continue;
    }
    
    // Skip section headers
    if (cleaned.match(/^[🎯💡🚀💬✨🪞]/) || cleaned.match(/^##?\s/)) {
      continue;
    }
    
    // Remove markdown bold but keep structure
    cleaned = cleaned.replace(/\*\*/g, '').trim();
    
    // Check if line starts with "Action:" (case-insensitive) - this is definitely an action
    const actionMatch = cleaned.match(/^Action:\s*(.+)/i);
    
    if (actionMatch) {
      // Save previous action if exists
      if (currentAction) {
        items.push(currentAction);
      }
      
      // Start new action with title from "Action: ..."
      const actionTitle = actionMatch[1].trim();
      currentAction = {
        title: actionTitle,
        details: []
      };
      introText = [];
    } else if (currentAction) {
      // We're inside an action - check if it's a detail
      const isSubItem = originalLine.match(/^\s{2,}/) ||
        cleaned.match(/^[-*•]\s*(What to do|Why|How|Example|Tip|Why it matters)/i) ||
        cleaned.match(/^(What to do|Why|How|Example|Tip|Why it matters)[:\s-]/i);
      
      if (isSubItem) {
        // Add as detail to current action
        let detailText = cleaned.replace(/^[-*•]\s*/, '').trim();
        detailText = detailText.replace(/^(What to do|Why|How|Example|Tip|Why it matters)[:\s-]+/i, '').trim();
        if (detailText) {
          currentAction.details.push(detailText);
        }
      } else if (cleaned && cleaned.length > 5 && originalLine.match(/^\s{2,}/)) {
        // Indented text - add as detail
        currentAction.details.push(cleaned);
      }
    } else {
      // No current action yet - check if this is intro text or an action
      const isIntroText = introPatterns.some(pattern => pattern.test(cleaned)) ||
        (cleaned.length < 100 && !cleaned.match(/^\d+[.)]\s/) && !cleaned.match(/^[A-Z][^:]*:/));
      
      if (isIntroText) {
        if (cleaned && cleaned.length > 10) {
          introText.push(cleaned);
        }
      } else {
        const isNumbered = cleaned.match(/^\d+[.)]\s/);
        const hasActionPattern = cleaned.match(/^[A-Z][^:]{5,}:/) ||
          (cleaned.length > 15 && cleaned.match(/^[A-Z]/) && !cleaned.includes('.'));
        
        if (isNumbered || hasActionPattern) {
          if (currentAction) {
            items.push(currentAction);
          }
          
          const title = cleaned.replace(/^\d+[.)]\s*/, '').replace(/^Action:\s*/i, '').trim();
          currentAction = {
            title: title,
            details: []
          };
          introText = [];
        } else if (cleaned && cleaned.length > 10) {
          introText.push(cleaned);
        }
      }
    }
  }
  
  // Add last action
  if (currentAction) {
    items.push(currentAction);
  }
  
  // Filter out intro items
  const filteredItems = items.filter(item => !item.isIntro);
  
  // Debug logging
  if (filteredItems.length > 0) {
    console.log(`parseActionItems: Found ${filteredItems.length} action items:`, filteredItems.map(i => i.title));
  } else {
    console.log('parseActionItems: No action items found in text');
    // Log a sample of the text to help debug
    const sampleLines = lines.slice(0, 50).join('\n');
    console.log('Sample of text being parsed:', sampleLines.substring(0, 500));
  }
  
  return filteredItems;
};

