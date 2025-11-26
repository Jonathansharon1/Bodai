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
      const bulletMatch = cleaned.match(/^[-*•]\s*(.+)/);
      const isSubItem = originalLine.match(/^\s{2,}/) ||
        bulletMatch ||
        cleaned.match(/^[-*•]\s*(What to do|Why|How|Example|Tip|Why it matters)/i) ||
        cleaned.match(/^(What to do|Why|How|Example|Tip|Why it matters)[:\s-]/i);
      
      if (isSubItem) {
        // Add as detail to current action
        let detailText = cleaned.replace(/^[-*•]\s*/, '').trim();
        detailText = detailText.replace(/^(What to do|Why|How|Example|Tip|Why it matters)[:\s-]+/i, '').trim();
        if (bulletMatch && bulletMatch[1]) {
          detailText = bulletMatch[1].trim();
        }
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
  
  // Deduplicate by normalized title (case/spacing-insensitive)
  const dedupedItems = [];
  const seenTitles = new Set();
  
  filteredItems.forEach(item => {
    const rawTitle = (typeof item === 'string' ? item : item.title || '').trim();
    if (!rawTitle) {
      return;
    }
    const normalizedTitle = rawTitle
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.?!]+$/, '')
      .trim();
    if (seenTitles.has(normalizedTitle)) {
      return;
    }
    seenTitles.add(normalizedTitle);
    dedupedItems.push(item);
  });
  
  // Debug logging
  if (dedupedItems.length > 0) {
    console.log(`parseActionItems: Found ${dedupedItems.length} unique action items:`, dedupedItems.map(i => i.title));
  } else {
    console.log('parseActionItems: No action items found in text');
    // Find and log the Action Plan section specifically
    const actionPlanStart = lines.findIndex(line => 
      line.toLowerCase().includes('action plan') || 
      line.toLowerCase().includes('action:')
    );
    if (actionPlanStart !== -1) {
      const actionPlanSection = lines.slice(actionPlanStart, actionPlanStart + 50).join('\n');
      console.log('Action Plan section found:', actionPlanSection.substring(0, 1000));
    } else {
      console.log('No "Action Plan" section found in text');
    }
    // Log a sample of the text to help debug
    const sampleLines = lines.slice(0, 100).join('\n');
    console.log('Sample of text being parsed:', sampleLines.substring(0, 1000));
  }
  
  // Transform action items into Tier 1 / Tier 2 structure
  const tieredItems = dedupedItems.map(item => {
    if (typeof item === 'string') {
      return {
        title: item,
        details: [],
        instantTip: item
      };
    }

    const rawInstantTip =
      item.details?.find(detail => detail.toLowerCase().includes('why it matters')) ||
      item.details?.find(detail => detail.toLowerCase().includes('what to do')) ||
      item.details?.[0] ||
      item.title;

    const practicePrompt = item.details?.find(detail => detail.toLowerCase().includes('practice prompt')) || null;

    return {
      ...item,
      instantTip: rawInstantTip || item.title,
      practicePrompt: practicePrompt
    };
  });

  return tieredItems;
};

