import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Rocket,
  MessageSquare,
  Eye,
  Mic,
  Target,
  Heart,
  Zap,
  Award,
  Camera,
  User
} from 'lucide-react';
import TopStrengthCard from './analysis/TopStrengthCard';
import TopOpportunityCard from './analysis/TopOpportunityCard';
import NextStepsPreview from './analysis/NextStepsPreview';
import './AnalysisResult.css';

// Parse markdown text into structured sections
const parseAnalysisText = (markdown) => {
  if (!markdown) return null;

  const sections = {
    keyStrengths: [],
    focusAreas: [],
    communicationTips: [],
    bodyLanguageTips: [],
    recordingNote: null,
    quickWins: [],
    // Legacy support for old format
    actionPlan: []
  };

  // Split by markdown headers (## or **)
  const lines = markdown.split('\n');
  let currentSection = null;
  let currentContent = [];
  
  // Debug: Log the markdown to help diagnose parsing issues
  if (process.env.NODE_ENV === 'development') {
    console.log('[parseAnalysisText] Parsing markdown, length:', markdown.length);
    console.log('[parseAnalysisText] First 500 chars:', markdown.substring(0, 500));
  }

  const savePreviousSection = () => {
    if (!currentSection || currentContent.length === 0) return;
    
    const content = currentContent.join('\n');
    switch (currentSection) {
      case 'strengths':
        sections.keyStrengths = parseListItems(content);
        break;
      case 'focus':
        sections.focusAreas = parseFocusAreas(content);
        break;
      case 'communication':
        sections.communicationTips = parseTipItems(content);
        break;
      case 'bodyLanguage':
        sections.bodyLanguageTips = parseTipItems(content);
        break;
      case 'recording':
        sections.recordingNote = content.trim();
        break;
      case 'quick':
        sections.quickWins = parseQuickWins(content);
        break;
      case 'action':
        // Legacy support
        sections.actionPlan = parseActionItems(content);
        break;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect section headers (English primary, Hebrew fallback)
    // Key Strengths / חוזקות מרכזיות
    if ((line.includes('Key Strengths') || line.includes('חוזקות מרכזיות') || line.includes('🎯')) && (line.includes('**') || line.match(/^##?/))) {
      savePreviousSection();
      currentSection = 'strengths';
      currentContent = [];
      continue;
    }

    // Focus Areas / נקודות לשיפור / אזורי מיקוד
    if ((line.includes('Focus Areas') || line.includes('נקודות לשיפור') || line.includes('אזורי מיקוד') || line.includes('💡')) && (line.includes('**') || line.match(/^##?/))) {
      savePreviousSection();
      currentSection = 'focus';
      currentContent = [];
      continue;
    }

    // Communication Tips / טיפים לתקשורת
    // More flexible detection: check if line contains the header text (with or without markdown)
    const isCommunicationHeader = line.includes('Communication Tips') || 
                                  line.includes('טיפים לתקשורת') || 
                                  line.includes('🗣') ||
                                  (line.toLowerCase().includes('communication') && line.toLowerCase().includes('tip'));
    // Accept header even without markdown formatting (more flexible)
    if (isCommunicationHeader) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[parseAnalysisText] Found Communication Tips header:', line);
      }
      savePreviousSection();
      currentSection = 'communication';
      currentContent = [];
      continue;
    }

    // Body Language Tips / טיפים לשפת גוף
    // More flexible detection: check if line contains the header text (with or without markdown)
    const isBodyLanguageHeader = line.includes('Body Language Tips') || 
                                 line.includes('טיפים לשפת גוף') || 
                                 line.includes('🧍') ||
                                 (line.toLowerCase().includes('body language') && line.toLowerCase().includes('tip'));
    // Accept header even without markdown formatting (more flexible)
    if (isBodyLanguageHeader) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[parseAnalysisText] Found Body Language Tips header:', line);
      }
      savePreviousSection();
      currentSection = 'bodyLanguage';
      currentContent = [];
      continue;
    }

    // Recording Note / הערה על ההקלטה
    if ((line.includes('Recording Note') || line.includes('הערה על ההקלטה') || line.includes('📹')) && (line.includes('**') || line.match(/^##?/))) {
      savePreviousSection();
      currentSection = 'recording';
      currentContent = [];
      continue;
    }

    // Quick Wins / ניצחונות מהירים
    if ((line.includes('Quick Wins') || line.includes('ניצחונות מהירים') || line.includes('💬') || line.includes('⚡')) && (line.includes('**') || line.match(/^##?/))) {
      savePreviousSection();
      currentSection = 'quick';
      currentContent = [];
      continue;
    }

    // Legacy support: Action Plan header
    if ((line.includes('Action Plan') || line.includes('🚀')) && (line.includes('**') || line.match(/^##?/))) {
      savePreviousSection();
      currentSection = 'action';
      currentContent = [];
      continue;
    }

    // Skip empty lines at section boundaries
    if (!line && currentContent.length === 0) {
      continue;
    }

    if (line) {
      currentContent.push(line);
    }
  }

  // Process final section
  savePreviousSection();

  // Debug: Log parsed sections
  if (process.env.NODE_ENV === 'development') {
    console.log('[parseAnalysisText] Parsed sections:', {
      communicationTips: sections.communicationTips.length,
      bodyLanguageTips: sections.bodyLanguageTips.length,
      keyStrengths: sections.keyStrengths.length,
      focusAreas: sections.focusAreas.length
    });
  }

  // If we have legacy actionPlan but no new tips, convert them
  if (sections.actionPlan.length > 0 && sections.communicationTips.length === 0 && sections.bodyLanguageTips.length === 0) {
    // Split legacy action items between communication and body language
    sections.actionPlan.forEach((item, index) => {
      const tipItem = convertActionToTip(item);
      // Alternate or detect based on content
      const isBodyLanguage = item.title?.toLowerCase().match(/posture|gesture|eye|body|stance|hand|face|expression|shoulder/);
      if (isBodyLanguage) {
        sections.bodyLanguageTips.push(tipItem);
      } else {
        sections.communicationTips.push(tipItem);
      }
    });
  }

  return sections;
};

// Parse tip items (Communication Tips or Body Language Tips)
const parseTipItems = (text) => {
  if (!text || !text.trim()) {
    return [];
  }
  
  const items = [];
  const lines = text.split('\n');
  let currentTip = null;
  let pendingContent = [];
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[parseTipItems] Parsing text, lines:', lines.length);
    console.log('[parseTipItems] First 200 chars:', text.substring(0, 200));
  }

  // Helper to extract text after label
  // Handles lines that may start with bullets/dashes
  const extractAfterLabel = (text, patterns) => {
    // First try without bullet prefix
    for (const pattern of patterns) {
      const match = text.match(new RegExp(`^${pattern}[:\\s-]+(.+)$`, 'i'));
      if (match) {
        return match[1].trim();
      }
    }
    // Then try with bullet prefix (e.g., "- מה לתרגל: ...")
    for (const pattern of patterns) {
      const match = text.match(new RegExp(`^[-*•]\\s*${pattern}[:\\s-]+(.+)$`, 'i'));
      if (match) {
        return match[1].trim();
      }
    }
    // Also check if the pattern appears anywhere in the line (for flexibility)
    for (const pattern of patterns) {
      const match = text.match(new RegExp(`${pattern}[:\\s-]+(.+)$`, 'i'));
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Patterns for "What to practice" in multiple languages/variations
  const whatToPracticePatterns = [
    'What to practice',
    'מה לתרגל',
    'איך לתרגל',
    'על מה להתאמן',
    'מה כדאי לתרגל',
    'מה כדאי לשנות',
    'איך לשפר',
    'במה להתמקד',
    'מה לעשות',
    'מה לתרגל:',
    'מה לתרגל -'
  ];

  // Patterns for "Why it matters" in multiple languages/variations
  const whyItMattersPatterns = [
    'Why it matters',
    'למה זה חשוב',
    'החשיבות',
    'למה זה קריטי',
    'למה זה משנה',
    'הערך המוסף',
    'למה זה רלוונטי',
    'למה זה חשוב:',
    'למה זה חשוב -'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleaned = line.trim();
    if (!cleaned) {
      // Empty line - if we have pending content, try to process it
      if (pendingContent.length > 0 && currentTip) {
        // Try to parse pending content
        const pendingText = pendingContent.join(' ').trim();
        const whatToPractice = extractAfterLabel(pendingText, whatToPracticePatterns);
        const whyItMatters = extractAfterLabel(pendingText, whyItMattersPatterns);
        
        if (whatToPractice && !currentTip.whatToPractice) {
          currentTip.whatToPractice = whatToPractice;
        }
        if (whyItMatters && !currentTip.whyItMatters) {
          currentTip.whyItMatters = whyItMatters;
        }
        pendingContent = [];
      }
      continue;
    }

    // Skip section headers
    if (cleaned.match(/^[🎯💡🚀💬✨🪞🗣🧍📹⚡]/) || cleaned.match(/^##?\s/)) {
      continue;
    }

    // Check if this line contains "What to practice" or "Why it matters"
    const whatToPracticeMatch = extractAfterLabel(cleaned, whatToPracticePatterns);
    const whyItMattersMatch = extractAfterLabel(cleaned, whyItMattersPatterns);

    if (whatToPracticeMatch) {
      if (!currentTip) {
        // Create a new tip if we don't have one
        currentTip = {
          title: pendingContent.join(' ').trim() || 'Communication Tip',
          whatToPractice: '',
          whyItMatters: ''
        };
        pendingContent = [];
      }
      currentTip.whatToPractice = whatToPracticeMatch;
      continue;
    }

    if (whyItMattersMatch) {
      if (!currentTip) {
        // Create a new tip if we don't have one
        currentTip = {
          title: pendingContent.join(' ').trim() || 'Communication Tip',
          whatToPractice: '',
          whyItMatters: ''
        };
        pendingContent = [];
      }
      currentTip.whyItMatters = whyItMattersMatch;
      continue;
    }

    // Check if this is a new tip title (starts with dash/bullet OR number followed by text)
    const isBulletLine = cleaned.match(/^[-*•]\s+/);
    const isNumberLine = cleaned.match(/^\d+[\.|-|\)]\s+/);
    const isListStart = isBulletLine || isNumberLine;
    const isIndentedLine = line.match(/^\s{2,}/);
    
    // Check if this line contains "What to practice" or "Why it matters" labels (even with bullet prefix)
    const hasWhatToPractice = extractAfterLabel(cleaned, whatToPracticePatterns);
    const hasWhyItMatters = extractAfterLabel(cleaned, whyItMattersPatterns);
    
    // Check if this line is a tip title (starts with dash/number but NOT followed by "What to practice" or "Why it matters")
    const isTipTitle = isListStart && 
                       !hasWhatToPractice && 
                       !hasWhyItMatters &&
                       !cleaned.match(/^(What to practice|Why it matters|מה לתרגל|למה זה חשוב)[:\s-]/i);
    
    // If it's a bullet/number line that's NOT a detail label, it might be a tip title
    if (isTipTitle && !currentTip) {
      // This is a new tip title
      const title = cleaned.replace(/^([-*•]|\d+[\.|-|\)])\s*/, '').replace(/\*\*/g, '').trim();
      if (title && title.length > 3) {
        currentTip = {
          title: title,
          whatToPractice: '',
          whyItMatters: ''
        };
        pendingContent = [];
        continue;
      }
    }
    
    // If it's a bullet/number line or indented line, check if it's a detail label first
    if ((isListStart || isIndentedLine) && !isTipTitle) {
      if (currentTip) {
        // Check if this line contains a label (What to practice or Why it matters)
        if (hasWhatToPractice) {
          currentTip.whatToPractice = hasWhatToPractice;
          continue;
        }
        if (hasWhyItMatters) {
          currentTip.whyItMatters = hasWhyItMatters;
          continue;
        }
        // Otherwise, it's a regular detail line
        let detailText = cleaned.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
        pendingContent.push(detailText);
      }
      continue;
    }

    // If we have a current tip and encounter a new non-detail line, save the previous tip
    if (currentTip && cleaned.length > 5 && !isBulletLine && !isIndentedLine) {
      // Try to extract any remaining info from pending content
      if (pendingContent.length > 0) {
        const pendingText = pendingContent.join(' ').trim();
        if (!currentTip.whatToPractice) {
          currentTip.whatToPractice = pendingText;
        } else if (!currentTip.whyItMatters) {
          currentTip.whyItMatters = pendingText;
        }
        pendingContent = [];
      }
      
      // Save previous tip
      items.push(currentTip);
      currentTip = null;
    }

    // Check if this is a new tip title
    if (!currentTip && cleaned.length > 5 && !isBulletLine && !isIndentedLine) {
      // Clean up the title
      const title = cleaned.replace(/\*\*/g, '').replace(/^\d+[.)]\s*/, '').trim();
      if (title && !title.match(/^(What to practice|Why it matters|מה לתרגל|איך לתרגל|למה זה חשוב|החשיבות)/i)) {
        currentTip = {
          title: title,
          whatToPractice: '',
          whyItMatters: ''
        };
        pendingContent = [];
      }
    } else if (currentTip && !isBulletLine && !isIndentedLine) {
      // This might be continuation of title or additional content
      pendingContent.push(cleaned.replace(/\*\*/g, '').trim());
    }
  }

  // Process any remaining pending content
  if (pendingContent.length > 0 && currentTip) {
    const pendingText = pendingContent.join(' ').trim();
    const whatToPractice = extractAfterLabel(pendingText, whatToPracticePatterns);
    const whyItMatters = extractAfterLabel(pendingText, whyItMattersPatterns);
    
    if (whatToPractice && !currentTip.whatToPractice) {
      currentTip.whatToPractice = whatToPractice;
    } else if (!currentTip.whatToPractice) {
      currentTip.whatToPractice = pendingText;
    }
    
    if (whyItMatters && !currentTip.whyItMatters) {
      currentTip.whyItMatters = whyItMatters;
    } else if (!currentTip.whyItMatters && pendingText !== currentTip.whatToPractice) {
      currentTip.whyItMatters = pendingText;
    }
  }

  // Add last tip
  if (currentTip) {
    // If we still don't have whatToPractice or whyItMatters, use title as fallback
    if (!currentTip.whatToPractice && !currentTip.whyItMatters && currentTip.title) {
      currentTip.whatToPractice = currentTip.title;
    }
    items.push(currentTip);
  }

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[parseTipItems] Parsed', items.length, 'tips');
    items.forEach((tip, idx) => {
      console.log(`[parseTipItems] Tip ${idx + 1}:`, {
        title: tip.title,
        hasWhatToPractice: !!tip.whatToPractice,
        hasWhyItMatters: !!tip.whyItMatters,
        whatToPractice: tip.whatToPractice?.substring(0, 50) + '...',
        whyItMatters: tip.whyItMatters?.substring(0, 50) + '...'
      });
    });
  }

  return items;
};

// Convert legacy action item to new tip format
const convertActionToTip = (actionItem) => {
  return {
    title: actionItem.title || '',
    whatToPractice: actionItem.details?.[0] || '',
    whyItMatters: actionItem.details?.[1] || ''
  };
};

const parseListItems = (text) => {
  const items = [];
  const lines = text.split('\n');

  for (const line of lines) {
    let cleaned = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    // Remove markdown bold
    cleaned = cleaned.replace(/\*\*/g, '').trim();
    // Skip section headers
    if (cleaned.match(/^[🎯💡🚀💬✨🪞]/) || cleaned.match(/^##?\s/)) {
      continue;
    }
    if (cleaned && cleaned.length > 10 && !cleaned.match(/^\(/)) {
      items.push(cleaned);
    }
  }

  return items.length > 0 ? items : (text.trim() ? [text.trim()] : []);
};

const parseFocusAreas = (text) => {
  const areas = [];
  const lines = text.split('\n');
  let currentArea = null;

  for (const line of lines) {
    const cleaned = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    if (cleaned) {
      // Check if it's a new area (usually starts with bold or emoji)
      if (cleaned.match(/^[🎯💡🚀💬✨]/) || cleaned.length < 100) {
        if (currentArea) areas.push(currentArea);
        currentArea = { title: cleaned, description: '', howToImprove: '' };
      } else if (currentArea) {
        if (!currentArea.description) {
          currentArea.description = cleaned;
        } else {
          currentArea.howToImprove = cleaned;
        }
      }
    }
  }

  if (currentArea) areas.push(currentArea);

  // Fallback: split by lines
  if (areas.length === 0) {
    return parseListItems(text).map(item => ({ title: item, description: '', howToImprove: '' }));
  }

  return areas;
};

const normalizeActionText = (text) => {
  if (!text) return '';
  let normalized = text;
  // Ensure each action starts on a new line
  normalized = normalized.replace(/\*\s*Action:/gi, '\nAction:');
  normalized = normalized.replace(/(?<!^)(?=Action:)/gi, '\n'); // fallback if multiple in same line

  // Split inline details into their own lines
  normalized = normalized.replace(/-\s*(What to do|Why it matters|Example)/gi, '\n  $1');
  normalized = normalized.replace(/•\s*(What to do|Why it matters|Example)/gi, '\n  $1');

  // Replace multiple spaces after colon
  normalized = normalized.replace(/(Action:|What to do|Why it matters|Example):\s*/gi, '$1: ');

  return normalized;
};

const parseActionItems = (text) => {
  const items = [];
  const normalizedText = normalizeActionText(text);
  const lines = normalizedText.split('\n');
  let currentAction = null;
  let introText = []; // Store any text before first action

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
      introText = []; // Clear intro text
    } else if (currentAction) {
      // We're inside an action - check if it's a detail
      const isSubItem = originalLine.match(/^\s{2,}/) || // Has indentation
        cleaned.match(/^[-*•]\s*(What to do|Why|How|Example|Tip|Why it matters)/i) || // Starts with dash + keyword
        cleaned.match(/^(What to do|Why|How|Example|Tip|Why it matters)[:\s-]/i); // Starts with keyword

      if (isSubItem) {
        // Add as detail to current action
        let detailText = cleaned.replace(/^[-*•]\s*/, '').trim();
        // Remove keyword prefix but keep the text
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
        // This is intro text - store it but don't create an action
        if (cleaned && cleaned.length > 10) {
          introText.push(cleaned);
        }
      } else {
        // This might be an action (numbered, or starts with capital and colon, or looks like action)
        const isNumbered = cleaned.match(/^\d+[.)]\s/);
        const hasActionPattern = cleaned.match(/^[A-Z][^:]{5,}:/) || // Starts with capital, has colon
          (cleaned.length > 15 && cleaned.match(/^[A-Z]/) && !cleaned.includes('.')); // Long line starting with capital

        if (isNumbered || hasActionPattern) {
          // Save previous action if exists
          if (currentAction) {
            items.push(currentAction);
          }

          // Start new action - remove numbering if exists
          const title = cleaned.replace(/^\d+[.)]\s*/, '').replace(/^Action:\s*/i, '').trim();
          currentAction = {
            title: title,
            details: []
          };
          introText = []; // Clear intro text
        } else if (cleaned && cleaned.length > 10) {
          // Might be intro text - store it
          introText.push(cleaned);
        }
      }
    }
  }

  // Add last action
  if (currentAction) {
    items.push(currentAction);
  }

  // If we have intro text but no actions, create a single intro item
  if (items.length === 0 && introText.length > 0) {
    return [{ title: introText.join(' '), details: [], isIntro: true }];
  }

  // If no actions found, return empty
  if (items.length === 0) {
    return [];
  }

  return items;
};

const parseQuickWins = (text) => {
  return parseListItems(text);
};

export default function AnalysisResult({ markdown, loading, analysisId, viewingAnalysis }) {
  const { user } = useUser();
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState({
    strengths: false,
    focus: false,
    communication: false,
    bodyLanguage: false,
    quick: false
  });
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [viewMode, setViewMode] = useState('summary');

  // Parse markdown first (for immediate display and fallback)
  // Memoize heavy parsing logic
  const parsedSections = React.useMemo(() => parseAnalysisText(markdown), [markdown]);
  
  // State for tips from database (primary source)
  const [tipsFromDB, setTipsFromDB] = useState({
    communication: [],
    bodyLanguage: []
  });
  const [tipsLoading, setTipsLoading] = useState(true);

  // Fetch tips from database (primary source of truth)
  useEffect(() => {
    if (!user?.id || !analysisId) {
      setTipsLoading(false);
      return;
    }

    const fetchTipsFromDB = async () => {
      try {
        setTipsLoading(true);
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/action-items?analysisId=${analysisId}`,
          {
            headers: {
              'X-Clerk-User-Id': user.id,
              'Content-Type': 'application/json'
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.actionItems && data.actionItems.length > 0) {
            // Filter to only tips (exclude quick wins and recording notes)
            const tipItems = data.actionItems.filter(item => 
              !item.item_type || item.item_type === 'tip' || item.item_type === null
            );
            
            // Convert DB tips to display format and group by section
            const communicationTips = [];
            const bodyLanguageTips = [];
            
            tipItems.forEach(item => {
              let details = {};
              try {
                details = typeof item.details === 'string'
                  ? JSON.parse(item.details || '{}')
                  : (item.details || {});
              } catch (e) {
                console.warn('Failed to parse tip details:', e);
              }

              // Extract whatToPractice and whyItMatters from details
              // Check all_details array first, then structured fields
              let whatToPractice = '';
              let whyItMatters = '';
              
              if (Array.isArray(details.all_details) && details.all_details.length > 0) {
                // Parse from all_details array
                details.all_details.forEach(detail => {
                  if (typeof detail === 'string') {
                    if (detail.toLowerCase().includes('what to practice') || detail.includes('מה לתרגל')) {
                      whatToPractice = detail.replace(/^.*?(what to practice|מה לתרגל)[:\s-]+/i, '').trim();
                    } else if (detail.toLowerCase().includes('why it matters') || detail.includes('למה זה חשוב')) {
                      whyItMatters = detail.replace(/^.*?(why it matters|למה זה חשוב)[:\s-]+/i, '').trim();
                    }
                  }
                });
              }
              
              // Fall back to structured fields
              if (!whatToPractice && details.what_to_do) {
                whatToPractice = typeof details.what_to_do === 'string' ? details.what_to_do : '';
              }
              if (!whyItMatters && details.why_it_matters) {
                whyItMatters = typeof details.why_it_matters === 'string' ? details.why_it_matters : '';
              }
              
              // If we have details but no structured fields, use first detail as whatToPractice
              if (!whatToPractice && Array.isArray(details.all_details) && details.all_details.length > 0) {
                const firstDetail = details.all_details[0];
                if (typeof firstDetail === 'string' && !firstDetail.toLowerCase().includes('why it matters')) {
                  whatToPractice = firstDetail;
                }
              }

              const tip = {
                title: item.title,
                whatToPractice: whatToPractice,
                whyItMatters: whyItMatters
              };

              // Group by tip_section
              const section = item.tip_section || 
                             (item.section === 'body-language' ? 'bodyLanguage' : 
                              item.section === 'communication' ? 'communication' : null);
              
              if (section === 'communication') {
                communicationTips.push(tip);
              } else if (section === 'bodyLanguage') {
                bodyLanguageTips.push(tip);
              } else {
                // If no section specified, try to infer from title or default to communication
                const isBodyLanguage = item.title?.toLowerCase().match(/posture|gesture|eye|body|stance|hand|face|expression|shoulder|position/);
                if (isBodyLanguage) {
                  bodyLanguageTips.push(tip);
                } else {
                  communicationTips.push(tip);
                }
              }
            });

            console.log('[AnalysisResult] Loaded tips from DB:', {
              communication: communicationTips.length,
              bodyLanguage: bodyLanguageTips.length,
              total: tipItems.length
            });

            setTipsFromDB({
              communication: communicationTips,
              bodyLanguage: bodyLanguageTips
            });
          }
        }
      } catch (error) {
        console.error('Error fetching tips from database:', error);
      } finally {
        setTipsLoading(false);
      }
    };

    fetchTipsFromDB();
  }, [user?.id, analysisId]);

  // Merge DB tips with parsed tips (prefer DB, supplement with parsed)
  const mergeTips = (dbTips, parsedTips) => {
    // Create a map of DB tips by title for deduplication
    const dbTipsMap = new Map();
    dbTips.forEach(tip => {
      const key = tip.title?.toLowerCase().trim();
      if (key) {
        dbTipsMap.set(key, tip);
      }
    });

    // Add parsed tips that aren't in DB
    parsedTips.forEach(tip => {
      const key = tip.title?.toLowerCase().trim();
      if (key && !dbTipsMap.has(key)) {
        dbTipsMap.set(key, tip);
      }
    });

    return Array.from(dbTipsMap.values());
  };

  // Merge tips: DB as primary source, parsed as supplement
  // This ensures all tips are visible even if parsing missed some
  const mergedCommunicationTips = tipsLoading 
    ? (parsedSections.communicationTips || []) // Show parsed while loading
    : mergeTips(tipsFromDB.communication, parsedSections.communicationTips || []);
    
  const mergedBodyLanguageTips = tipsLoading
    ? (parsedSections.bodyLanguageTips || []) // Show parsed while loading
    : mergeTips(tipsFromDB.bodyLanguage, parsedSections.bodyLanguageTips || []);
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[AnalysisResult] Tips merge result:', {
      loading: tipsLoading,
      dbCommunication: tipsFromDB.communication.length,
      dbBodyLanguage: tipsFromDB.bodyLanguage.length,
      parsedCommunication: parsedSections.communicationTips?.length || 0,
      parsedBodyLanguage: parsedSections.bodyLanguageTips?.length || 0,
      mergedCommunication: mergedCommunicationTips.length,
      mergedBodyLanguage: mergedBodyLanguageTips.length
    });
  }
  
  // Use merged sections for display
  const sections = {
    ...parsedSections,
    communicationTips: mergedCommunicationTips,
    bodyLanguageTips: mergedBodyLanguageTips
  };

  // Fetch metrics and comparison data
  useEffect(() => {
    if (!user?.id || !analysisId) return;

    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      try {
        // Fetch current analysis metrics
        const metricsRes = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/communication/metrics`,
          {
            headers: {
              'X-Clerk-User-Id': user.id,
              'Content-Type': 'application/json'
            }
          }
        );

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          if (metricsData && metricsData.length > 0) {
            // Find current analysis metrics
            const current = metricsData.find(m => m.analyses?.id === analysisId) || metricsData[metricsData.length - 1];
            setMetrics(current);

            // Check if this is the first analysis
            if (metricsData.length === 1) {
              setIsFirstAnalysis(true);
            } else {
              // Get previous analysis (second to last)
              const previous = metricsData[metricsData.length - 2];
              setPreviousMetrics(previous);
            }
          } else {
            setIsFirstAnalysis(true);
          }
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [user, analysisId]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = () => {
    if (markdown) {
      navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="analysisResult">
        <div className="analysisResult__loading">{t('analysisResult.analyzing')}</div>
      </div>
    );
  }

  if (!markdown) {
    return (
      <div className="analysisResult">
        <p className="analysisResult__empty">{t('analysisResult.willAppear')}</p>
      </div>
    );
  }

  // Fallback to markdown if parsing fails - but still try to show initial experience
  const hasValidSections = sections && (
    (sections.keyStrengths && sections.keyStrengths.length > 0) ||
    (sections.communicationTips && sections.communicationTips.length > 0) ||
    (sections.bodyLanguageTips && sections.bodyLanguageTips.length > 0)
  );

  if (!hasValidSections) {
    return (
      <div className="analysisResult">
        <div className="analysisResult__header">
          <h3 className="analysisResult__title">{t('analysisResult.title')}</h3>
          <button
            className="analysisResult__copyBtn"
            onClick={copyToClipboard}
            title="Copy analysis"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <div className="analysisResult__markdown">
          {markdown.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    );
  }

  // Prepare metrics data for visualization
  const getMetricsData = () => {
    if (!metrics) return null;

    const categories = [
      { key: 'presence', label: t('parameters.metrics.presence'), icon: Eye, color: '#3b82f6' },
      { key: 'voice_expression', label: t('parameters.metrics.voice'), icon: Mic, color: '#10b981' },
      { key: 'clarity', label: t('parameters.metrics.clarity'), icon: Target, color: '#f59e0b' },
      { key: 'authenticity', label: t('parameters.metrics.authenticity'), icon: Heart, color: '#8b5cf6' },
      { key: 'impact', label: t('parameters.metrics.impact'), icon: Zap, color: '#ef4444' },
      { key: 'confidence', label: t('parameters.metrics.confidence'), icon: Award, color: '#06b6d4' }
    ];

    return categories.map(cat => ({
      category: cat.label,
      value: parseFloat(metrics[cat.key]) || 0,
      fullMark: 10,
      icon: cat.icon,
      color: cat.color
    }));
  };

  const metricsData = getMetricsData();
  const overallScore = metrics?.overall_score ? Math.round(metrics.overall_score) : null;
  const stageTitle = metrics?.stage_title || null;

  // Calculate comparison
  const getComparison = () => {
    if (isFirstAnalysis) {
      return { type: 'first', message: 'This is your first analysis!' };
    }
    if (!previousMetrics || !metrics) {
      return null;
    }

    const currentScore = parseFloat(metrics.overall_score) || 0;
    const previousScore = parseFloat(previousMetrics.overall_score) || 0;
    const diff = currentScore - previousScore;

    if (Math.abs(diff) < 0.5) {
      return { type: 'stable', diff: 0, icon: Minus };
    } else if (diff > 0) {
      return { type: 'improved', diff: diff.toFixed(1), icon: TrendingUp };
    } else {
      return { type: 'declined', diff: Math.abs(diff).toFixed(1), icon: TrendingDown };
    }
  };

  const comparison = getComparison();

  // Get top strength and opportunity for initial view
  const topStrength = sections?.keyStrengths?.[0] || null;
  const topOpportunity = sections?.focusAreas?.[0] || null;
  
  // Combine communication and body language tips for summary view
  const allTips = [
    ...(sections?.communicationTips || []).map(tip => ({ ...tip, type: 'communication' })),
    ...(sections?.bodyLanguageTips || []).map(tip => ({ ...tip, type: 'bodyLanguage' }))
  ];
  // Convert tips to action item format for NextStepsPreview
  // Include both structured fields and details array for maximum compatibility
  const actionItems = allTips.map(tip => ({
    title: tip.title || 'Communication Tip',
    details: [tip.whatToPractice, tip.whyItMatters].filter(Boolean),
    whatToPractice: tip.whatToPractice,
    whyItMatters: tip.whyItMatters,
    type: tip.type
  }));
  const hasActionItems = actionItems.length > 0;

  // Get strength score (try to match to metrics)
  const getStrengthScore = (strength) => {
    if (!strength || !metrics) return null;
    const strengthText = typeof strength === 'string' ? strength.toLowerCase() : (strength.title || '').toLowerCase();
    if (strengthText.includes('eye') || strengthText.includes('contact')) return metrics.presence;
    if (strengthText.includes('gesture') || strengthText.includes('hand')) return metrics.presence;
    if (strengthText.includes('voice') || strengthText.includes('vocal')) return metrics.voice_expression;
    if (strengthText.includes('clarity')) return metrics.clarity;
    if (strengthText.includes('authentic')) return metrics.authenticity;
    if (strengthText.includes('confidence')) return metrics.confidence;
    return null;
  };

  const getOpportunityScore = (opportunity) => {
    if (!opportunity || !metrics) return null;
    const oppText = typeof opportunity === 'string' ? opportunity.toLowerCase() : (opportunity.title || '').toLowerCase();
    if (oppText.includes('eye') || oppText.includes('contact')) return metrics.presence;
    if (oppText.includes('gesture') || oppText.includes('hand')) return metrics.presence;
    if (oppText.includes('voice') || oppText.includes('vocal') || oppText.includes('pace')) return metrics.voice_expression;
    if (oppText.includes('clarity')) return metrics.clarity;
    if (oppText.includes('authentic')) return metrics.authenticity;
    if (oppText.includes('confidence')) return metrics.confidence;
    return null;
  };

  const strengthScore = getStrengthScore(topStrength);
  const opportunityScore = getOpportunityScore(topOpportunity);

  const handleViewAllActions = () => {
    setViewMode('full');
    setExpandedSections(prev => ({ ...prev, communication: true, bodyLanguage: true }));
    setTimeout(() => {
      const communicationSection = document.getElementById('accordion-content-communication');
      if (communicationSection) {
        communicationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const renderQuickSummaryView = () => (
    <div className="analysisResult__summaryView">
      {/* Overall Score Card */}
      {overallScore && (
        <div className="analysisResult__scoreCard">
          <div className="analysisResult__scoreMain">
            <div className="analysisResult__scoreValue">{overallScore}</div>
            <div className="analysisResult__scoreLabel">
              <span>{t('analysisResult.overallScore')}</span>
              {stageTitle && <span className="analysisResult__stageTitle">{stageTitle}</span>}
            </div>
          </div>
          {comparison && (
            <div className={`analysisResult__comparison analysisResult__comparison--${comparison.type}`}>
              {comparison.type === 'first' ? (
                <span className="analysisResult__firstBadge">{t('analysisResult.firstAnalysis')}</span>
              ) : comparison.type === 'improved' ? (
                <>
                  <TrendingUp size={16} />
                  <span>+{comparison.diff} {t('analysisResult.fromLastTime')}</span>
                </>
              ) : comparison.type === 'declined' ? (
                <>
                  <TrendingDown size={16} />
                  <span>-{comparison.diff} {t('analysisResult.fromLastTime')}</span>
                </>
              ) : (
                <>
                  <Minus size={16} />
                  <span>{t('analysisResult.sameAsLastTime')}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {topStrength && (
        <TopStrengthCard
          strength={topStrength}
          score={strengthScore}
        />
      )}

      {topOpportunity && (
        <TopOpportunityCard
          opportunity={topOpportunity}
          currentScore={opportunityScore}
          targetScore={opportunityScore ? opportunityScore + 2 : 7}
        />
      )}

      {hasActionItems && (
        <NextStepsPreview
          actionItems={actionItems}
          onViewAll={handleViewAllActions}
        />
      )}

      {!topStrength && !topOpportunity && !hasActionItems && !overallScore && (
        <div className="analysisResult__emptySummary">
          <p>{t('analysisResult.uploadNew')}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="analysisResult">
      <div className="analysisResult__header">
        <div className="analysisResult__titleGroup">
          <h3 className="analysisResult__title">{t('analysisResult.title')}</h3>
          <div className="analysisResult__viewMode">
            <div className="analysisResult__viewToggle" role="tablist" aria-label="Analysis view mode">
              <button
                className={`analysisResult__toggleOption ${viewMode === 'summary' ? 'is-active' : ''}`}
                onClick={() => setViewMode('summary')}
                role="tab"
                aria-selected={viewMode === 'summary'}
              >
                {t('analysisResult.quickSummary')}
              </button>
              <button
                className={`analysisResult__toggleOption ${viewMode === 'full' ? 'is-active' : ''}`}
                onClick={() => setViewMode('full')}
                role="tab"
                aria-selected={viewMode === 'full'}
              >
                {t('analysisResult.fullAnalysis')}
              </button>
              <span className={`analysisResult__toggleThumb ${viewMode === 'summary' ? 'is-left' : 'is-right'}`} />
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'summary' && renderQuickSummaryView()}

      {viewMode === 'full' && (
        <>
          {/* Key Strengths */}
          {sections.keyStrengths && sections.keyStrengths.length > 0 && (
            <AccordionSection
              id="strengths"
              icon={<TrendingUp size={20} />}
              title={t('analysisResult.keyStrengths')}
              expanded={expandedSections.strengths}
              onToggle={() => toggleSection('strengths')}
            >
              <div className="analysisResult__strengths">
                {sections.keyStrengths.map((strength, index) => {
                  const parts = strength.split(/[.:]/);
                  const title = parts[0]?.trim() || strength.substring(0, 50);
                  const description = parts.length > 1 ? parts.slice(1).join('.').trim() : strength;

                  return (
                    <div key={index} className="analysisResult__strengthCard">
                      <div className="analysisResult__strengthIcon">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="analysisResult__strengthText">
                        <strong>{title}</strong>
                        {description !== title && <span>{description}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionSection>
          )}

          {/* Focus Areas */}
          {sections.focusAreas && sections.focusAreas.length > 0 && (
            <AccordionSection
              id="focus"
              icon={<Lightbulb size={20} />}
              title={t('analysisResult.focusAreas')}
              expanded={expandedSections.focus}
              onToggle={() => toggleSection('focus')}
            >
              <div className="analysisResult__focusAreas">
                {sections.focusAreas.map((area, index) => (
                  <div key={index} className="analysisResult__focusCard">
                    <h5 className="analysisResult__focusTitle">{area.title || area}</h5>
                    {area.description && (
                      <p className="analysisResult__focusDescription">{area.description}</p>
                    )}
                    {area.howToImprove && (
                      <div className="analysisResult__focusImprove">
                        <strong>{t('analysisResult.howToImprove')}</strong> {area.howToImprove}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Communication Tips */}
          {sections.communicationTips && sections.communicationTips.length > 0 && (
            <AccordionSection
              id="communication"
              icon={<Mic size={20} />}
              title={t('analysisResult.communicationTips')}
              expanded={expandedSections.communication}
              onToggle={() => toggleSection('communication')}
            >
              <div className="analysisResult__tipsList">
                {sections.communicationTips.map((tip, index) => (
                  <div key={index} className="analysisResult__tipCard">
                    <div className="analysisResult__tipBadge">
                      <Mic size={14} />
                      {t('analysisResult.tip')} {index + 1}
                      </div>
                    <div className="analysisResult__tipTitle">{tip.title}</div>
                    {tip.whatToPractice && (
                      <div className="analysisResult__tipDetail">
                        <span className="analysisResult__tipDetailLabel">{t('analysisResult.whatToPractice')}</span>
                        <p>{tip.whatToPractice}</p>
                      </div>
                      )}
                    {tip.whyItMatters && (
                      <div className="analysisResult__tipDetail">
                        <span className="analysisResult__tipDetailLabel">{t('analysisResult.whyItMatters')}</span>
                        <p>{tip.whyItMatters}</p>
                            </div>
                          )}
                            </div>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Body Language Tips */}
          {sections.bodyLanguageTips && sections.bodyLanguageTips.length > 0 && (
            <AccordionSection
              id="bodyLanguage"
              icon={<User size={20} />}
              title={t('analysisResult.bodyLanguageTips')}
              expanded={expandedSections.bodyLanguage}
              onToggle={() => toggleSection('bodyLanguage')}
            >
              <div className="analysisResult__tipsList">
                {sections.bodyLanguageTips.map((tip, index) => (
                  <div key={index} className="analysisResult__tipCard analysisResult__tipCard--bodyLanguage">
                    <div className="analysisResult__tipBadge analysisResult__tipBadge--bodyLanguage">
                      <User size={14} />
                      {t('analysisResult.tip')} {index + 1}
                    </div>
                    <div className="analysisResult__tipTitle">{tip.title}</div>
                    {tip.whatToPractice && (
                      <div className="analysisResult__tipDetail">
                        <span className="analysisResult__tipDetailLabel">{t('analysisResult.whatToPractice')}</span>
                        <p>{tip.whatToPractice}</p>
                            </div>
                          )}
                    {tip.whyItMatters && (
                      <div className="analysisResult__tipDetail">
                        <span className="analysisResult__tipDetailLabel">{t('analysisResult.whyItMatters')}</span>
                        <p>{tip.whyItMatters}</p>
                      </div>
                    )}
                            </div>
                          ))}
                        </div>
            </AccordionSection>
                      )}

          {/* Recording Note */}
          {sections.recordingNote && (
            <div className="analysisResult__recordingNote">
              <div className="analysisResult__recordingNoteIcon">
                <Camera size={16} />
                    </div>
              <div className="analysisResult__recordingNoteContent">
                <span className="analysisResult__recordingNoteLabel">{t('analysisResult.recordingNote')}</span>
                <p>{sections.recordingNote}</p>
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {sections.quickWins && sections.quickWins.length > 0 && (
            <AccordionSection
              id="quick"
              icon={<MessageSquare size={20} />}
              title={t('analysisResult.quickWins')}
              expanded={expandedSections.quick}
              onToggle={() => toggleSection('quick')}
            >
              <div className="analysisResult__quickWins">
                {sections.quickWins.map((win, index) => (
                  <div key={index} className="analysisResult__quickWinCard">
                    <div className="analysisResult__quickWinIcon">
                      <Lightbulb size={20} />
                    </div>
                    <p className="analysisResult__quickWinText">{win}</p>
                  </div>
                ))}
              </div>
            </AccordionSection>
          )}
        </>
      )}

    </div>
  );
}

// Accordion Section Component
function AccordionSection({ id, icon, title, emoji, expanded, onToggle, children }) {
  return (
    <div className={`analysisResult__section analysisResult__accordion ${expanded ? 'expanded' : ''}`}>
      <button
        className="analysisResult__accordionHeader"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`accordion-content-${id}`}
      >
        <div className="analysisResult__sectionHeader">
          <div className="analysisResult__sectionIcon">
            {icon}
          </div>
          <h4 className="analysisResult__sectionTitle">
            {title}
          </h4>
        </div>
        <ChevronDown
          className={`analysisResult__chevron ${expanded ? 'expanded' : ''}`}
          size={20}
        />
      </button>
      <div
        id={`accordion-content-${id}`}
        className={`analysisResult__accordionContent ${expanded ? 'expanded' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

const ExpandableText = ({ text, collapsedLines = 3, threshold = 220 }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  if (!text) return null;

  const shouldCollapse = text.length > threshold;

  return (
    <div className={`analysisResult__expandableText ${expanded ? 'expanded' : ''}`}>
      <p className="analysisResult__actionSummary" style={shouldCollapse && !expanded ? {
        display: '-webkit-box',
        WebkitLineClamp: collapsedLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      } : undefined}>
        {text}
      </p>
      {shouldCollapse && (
        <button
          type="button"
          className="analysisResult__expandToggle"
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? t('analysisResult.showLess') : t('analysisResult.showMore')}
          <ChevronDown size={16} className={expanded ? 'rotated' : ''} />
        </button>
      )}
    </div>
  );
};
