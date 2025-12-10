/**
 * Parse action items from markdown analysis text
 * This is a shared utility for both frontend and backend
 */

import logger from './logger.js';

export const parseActionItems = (text) => {
  if (!text) return [];
  
  // Try new Communication/Body Language Tips format first
  const modernItems = parseTipSections(text);
  if (modernItems.length > 0) {
    if (typeof logger !== 'undefined') {
      logger.info({ itemCount: modernItems.length }, '[parseActionItems] Parsed items from tip sections');
    }
    return modernItems;
  }

  // Fall back to legacy Action Plan parser
  return parseLegacyActionPlan(text);
};

const parseTipSections = (text) => {
  const lines = text.split('\n');
  const tips = [];
  let currentSection = null; // 'communication' | 'body-language' | 'quick' | 'recording'
  let currentTip = null;
  let currentItemType = 'tip'; // 'tip' | 'quick_win' | 'recording_note'

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
      // For recording notes, join all extra details into a single text
      if (currentItemType === 'recording_note') {
        details.push(currentTip.extraDetails.join(' '));
      } else {
        details.push(...currentTip.extraDetails);
      }
    }
    // Map section names for consistency (body-language -> bodyLanguage)
    const tipSection = currentSection === 'body-language' ? 'bodyLanguage' : 
                       currentSection === 'communication' ? 'communication' : 
                       null;
    
    tips.push({
      title: currentTip.title,
      details,
      section: currentSection, // Keep original for backward compatibility
      tip_section: tipSection, // Add normalized tip_section for database
      item_type: currentItemType
    });
    currentTip = null;
  };

  // Helper to extract text after label (handles Hebrew and English, with or without bullet prefix)
  const extractAfterLabel = (text, patterns) => {
    // Try without bullet prefix
    for (const pattern of patterns) {
      const match = text.match(new RegExp(`^${pattern}[:\\s-]+(.+)$`, 'i'));
      if (match) {
        return match[1].trim();
      }
    }
    // Try with bullet prefix
    for (const pattern of patterns) {
      const match = text.match(new RegExp(`^[-*•]\\s*${pattern}[:\\s-]+(.+)$`, 'i'));
      if (match) {
        return match[1].trim();
      }
    }
    // Try anywhere in the line
    for (const pattern of patterns) {
      const match = text.match(new RegExp(`${pattern}[:\\s-]+(.+)$`, 'i'));
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Patterns for "What to practice" in multiple languages
  const whatToPracticePatterns = [
    'What to practice',
    'מה לתרגל',
    'איך לתרגל',
    'על מה להתאמן',
    'מה כדאי לתרגל'
  ];

  // Patterns for "Why it matters" in multiple languages
  const whyItMattersPatterns = [
    'Why it matters',
    'למה זה חשוב',
    'החשיבות',
    'למה זה קריטי',
    'למה זה משנה'
  ];

  lines.forEach((rawLine) => {
    if (!rawLine) {
      // Empty line - commit tip if we have one
      if (currentTip && currentTip.title) {
        commitTip();
      }
      return;
    }
    let line = rawLine.trim();
    if (!line) {
      if (currentTip && currentTip.title) {
        commitTip();
      }
      return;
    }
    
    // Clean up markdown artifacts specifically for Hebrew/RTL issues
    line = line.replace(/\*\*/g, '') // Remove bold markers
               .replace(/^\*\s*/, '') // Remove leading asterisk
               .replace(/^\d+\*\s*/, '') // Remove "1*" pattern
               .replace(/^\*\d+\*\s*/, '') // Remove "*1*" pattern
               .replace(/^\*\d+\s*/, '') // Remove "*1" pattern
               .replace(/^\d+\.\s*/, '') // Remove "1." pattern if it wasn't caught
               .replace(/^[-•]\s*/, '') // Remove bullets
               .trim();

    const lowerLine = line.toLowerCase();
    // Check for section headers (English and Hebrew)
    const isCommunicationHeader = lowerLine.includes('communication tips') || 
                                  lowerLine.includes('טיפים לתקשורת') ||
                                  (lowerLine.includes('communication') && lowerLine.includes('tip'));
    const isBodyHeader = lowerLine.includes('body language tips') || 
                        lowerLine.includes('טיפים לשפת גוף') ||
                        (lowerLine.includes('body language') && lowerLine.includes('tip'));
    const isQuickWinsHeader = lowerLine.includes('quick wins') || 
                             lowerLine.includes('ניצחונות מהירים') ||
                             line.includes('💬') || line.includes('⚡');
    const isRecordingNoteHeader = lowerLine.includes('recording note') || 
                                 lowerLine.includes('הערה על ההקלטה') ||
                                 line.includes('📹');

    if (isCommunicationHeader || isBodyHeader) {
      commitTip();
      currentSection = isCommunicationHeader ? 'communication' : 'body-language';
      currentItemType = 'tip';
      return;
    }

    if (isQuickWinsHeader) {
      commitTip();
      currentSection = 'quick';
      currentItemType = 'quick_win';
      return;
    }

    if (isRecordingNoteHeader) {
      commitTip();
      currentSection = 'recording';
      currentItemType = 'recording_note';
      return;
    }

    if (!currentSection) {
      return; // Ignore lines outside of recognized sections
    }

    // Check if this line contains "What to practice" or "Why it matters" labels
    const whatToPractice = extractAfterLabel(line, whatToPracticePatterns);
    const whyItMatters = extractAfterLabel(line, whyItMattersPatterns);

    if (whatToPractice) {
      if (!currentTip) {
        // Create a new tip if we don't have one
        currentTip = {
          title: 'Communication Tip', // Will be set from previous line if available
          whatToPractice: '',
          whyItMatters: '',
          extraDetails: []
        };
      }
      currentTip.whatToPractice = whatToPractice;
      return;
    }

    if (whyItMatters) {
      if (!currentTip) {
        // Create a new tip if we don't have one
        currentTip = {
          title: 'Communication Tip', // Will be set from previous line if available
          whatToPractice: '',
          whyItMatters: '',
          extraDetails: []
        };
      }
      currentTip.whyItMatters = whyItMatters;
      return;
    }

    // Check if this is a tip title (starts with bullet OR number and doesn't contain labels)
    const isBulletLine = line.match(/^[-*•]\s+/);
    const isNumberLine = line.match(/^\d+[\.|-|\)]\s+/);
    const isListStart = isBulletLine || isNumberLine;
    const isDetailLine = isListStart && (whatToPractice || whyItMatters);

    if (isListStart && !isDetailLine) {
      // This is likely a tip title
      commitTip(); // Save previous tip if exists
      // Remove bullet or number prefix
      const title = line.replace(/^([-*•]|\d+[\.|-|\)])\s*/, '').trim();
      if (title && title.length > 3) {
        currentTip = {
          title,
          whatToPractice: '',
          whyItMatters: '',
          extraDetails: []
        };
      }
      return;
    }

    // If we have a new title candidate (and it's not a detail line)
    if (!whatToPractice && !whyItMatters && line.length > 3) {
      // Check if it looks like a title
      const looksLikeTitle = !line.match(/^(What to practice|Why it matters|מה לתרגל|למה זה חשוב)[:\s-]/i);
      
      if (looksLikeTitle) {
        commitTip(); // Save previous tip if exists
        currentTip = {
          title: line,
          whatToPractice: '',
          whyItMatters: '',
          extraDetails: []
        };
        return;
      }
    }

    // Handle quick wins and recording notes differently
    if (currentSection === 'quick' || currentSection === 'recording') {
      // For quick wins, each bullet point is a separate item
      if (currentSection === 'quick') {
        const isBulletLine = line.match(/^[-*•]\s+/);
        if (isBulletLine) {
          commitTip(); // Save previous quick win if exists
          const title = line.replace(/^[-*•]\s*/, '').trim();
          if (title && title.length > 3) {
            currentTip = {
              title,
              whatToPractice: '',
              whyItMatters: '',
              extraDetails: []
            };
          }
        } else if (currentTip && line.length > 0) {
          // Add as detail to current quick win
          currentTip.extraDetails.push(line.trim());
        }
      } else if (currentSection === 'recording') {
        // Recording note is a single item - accumulate all lines into one item
        if (!currentTip) {
          currentTip = {
            title: 'Recording Note',
            whatToPractice: '',
            whyItMatters: '',
            extraDetails: []
          };
        }
        // Skip bullet points for recording note - just accumulate text
        const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
        if (cleanLine.length > 0) {
          currentTip.extraDetails.push(cleanLine);
        }
      }
      return;
    }

    // If we have a current tip and this is a detail line, add it
    if (currentTip) {
      let detailText = line.replace(/^[-*•]\s*/, '').trim();
      if (detailText && detailText.length > 0) {
        currentTip.extraDetails.push(detailText);
      }
    }
  });

  commitTip(); // Commit last tip
  
  // Debug logging
  if (tips.length > 0) {
    logger.info({ itemCount: tips.length, communicationCount: tips.filter(t => t.tip_section === 'communication').length, bodyLanguageCount: tips.filter(t => t.tip_section === 'bodyLanguage').length }, '[parseTipSections] Parsed items from sections');
  }
  
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
    logger.info({ sampleText: lines.slice(0, 50).join('\n') }, '[parseActionItems] Legacy parser found no items');
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

