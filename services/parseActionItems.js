/**
 * Parse action items from markdown analysis text
 * This is a shared utility for both frontend and backend
 */

export const parseActionItems = (text) => {
  if (!text) return [];

  // Try new Communication/Body Language Tips format first
  const modernItems = parseTipSections(text);
  if (modernItems.length > 0) {
    console.log(`parseActionItems: Parsed ${modernItems.length} items from tip sections`);
    return modernItems;
  }

  // Fall back to legacy Action Plan parser
  return parseLegacyActionPlan(text);
};

const parseTipSections = (text) => {
  const lines = text.split('\n');
  const tips = [];
  let currentSection = null; // 'communication' | 'body-language'
  let currentTip = null;

  const commitTip = () => {
    if (!currentTip || !currentTip.title) return;
    const details = [];
    if (currentTip.whatToPractice) {
      details.push(`What to practice: ${currentTip.whatToPractice}`);
    }
    if (currentTip.whyItMatters) {
      details.push(`Why it matters: ${currentTip.whyItMatters}`);
    }
    if (currentTip.extraDetails.length > 0) {
      details.push(...currentTip.extraDetails);
    }
    tips.push({
      title: currentTip.title,
      details,
      section: currentSection
    });
    currentTip = null;
  };

  lines.forEach((rawLine) => {
    if (!rawLine) return;
    let line = rawLine.trim();
    if (!line) return;
    line = line.replace(/\*\*/g, '').trim();

    const lowerLine = line.toLowerCase();
    const isCommunicationHeader = lowerLine.includes('communication tips');
    const isBodyHeader = lowerLine.includes('body language tips');

    if (isCommunicationHeader || isBodyHeader) {
      commitTip();
      currentSection = isCommunicationHeader ? 'communication' : 'body-language';
      return;
    }

    if (!currentSection) {
      return; // Ignore lines outside of tip sections
    }

    const isDetailLine =
      line.match(/^[-*•]\s+/) ||
      line.match(/^(What to practice|Why it matters)[:\s-]/i);

    if (!isDetailLine) {
      // Start of a new tip title
      commitTip();
      const title = line.replace(/^\d+[.)]\s*/, '').trim();
      if (title.length === 0) return;
      currentTip = {
        title,
        whatToPractice: '',
        whyItMatters: '',
        extraDetails: []
      };
      return;
    }

    if (!currentTip) {
      return;
    }

    let detailText = line.replace(/^[-*•]\s*/, '').trim();
    if (detailText.match(/^What to practice[:\s-]/i)) {
      currentTip.whatToPractice = detailText.replace(/^What to practice[:\s-]+/i, '').trim();
    } else if (detailText.match(/^Why it matters[:\s-]/i)) {
      currentTip.whyItMatters = detailText.replace(/^Why it matters[:\s-]+/i, '').trim();
    } else {
      currentTip.extraDetails.push(detailText);
    }
  });

  commitTip();
  return tips;
};

const parseLegacyActionPlan = (text) => {
  const lines = text.split('\n');
  const items = [];
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
  if (dedupedItems.length === 0) {
    console.log('parseActionItems: Legacy parser found no items. Sample text:', lines.slice(0, 50).join('\n'));
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

