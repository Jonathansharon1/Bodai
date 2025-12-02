/**
 * Response Validator Service
 * Validates AI analysis responses for completeness and correctness
 */

import { parseActionItems } from './parseActionItems.js';

/**
 * Validates an analysis response from Gemini
 * @param {Object} response - The analysis response object
 * @param {string} response.text - The markdown text response
 * @param {Object} response.metrics - The parsed metrics object
 * @param {string} response.finishReason - The finish reason from Gemini API (STOP, MAX_TOKENS, OTHER, etc.)
 * @returns {Object} Validation result with isValid, issues, and shouldRetry flags
 */
export const validateAnalysisResponse = (response) => {
  const issues = [];
  
  // Check if response exists
  if (!response) {
    issues.push({ 
      type: 'no_response', 
      severity: 'critical',
      message: 'No response received from AI'
    });
    return { isValid: false, issues, shouldRetry: true };
  }
  
  // Check if text response exists and has meaningful content
  if (!response.text || typeof response.text !== 'string') {
    issues.push({ 
      type: 'missing_text', 
      severity: 'critical',
      message: 'No text content in response'
    });
  } else if (response.text.length < 500) {
    issues.push({ 
      type: 'response_too_short', 
      severity: 'critical',
      message: `Response too short (${response.text.length} chars, expected 500+)`,
      found: response.text.length,
      expected: 500
    });
  }
  
  // Check if metrics exist
  if (!response.metrics) {
    issues.push({ 
      type: 'missing_metrics', 
      severity: 'critical',
      message: 'No metrics object in response'
    });
  } else {
    // Validate overall_score exists and is in valid range
    if (response.metrics.overall_score === undefined || response.metrics.overall_score === null) {
      issues.push({ 
        type: 'missing_overall_score', 
        severity: 'critical',
        message: 'Missing overall_score in metrics'
      });
    } else if (response.metrics.overall_score < 0 || response.metrics.overall_score > 100) {
      issues.push({ 
        type: 'invalid_score_range', 
        severity: 'critical',
        message: `Invalid overall_score: ${response.metrics.overall_score} (expected 0-100)`,
        found: response.metrics.overall_score,
        expected: '0-100'
      });
    }
    
    // Validate final_scores or individual category scores exist
    const hasSubScores = response.metrics.subScores || response.metrics.sub_scores;
    const hasFinalScores = response.metrics.finalScores || response.metrics.final_scores;
    const hasLegacyScores = response.metrics.presence !== undefined || 
                            response.metrics.voice_expression !== undefined;
    
    if (!hasSubScores && !hasFinalScores && !hasLegacyScores) {
      issues.push({ 
        type: 'missing_category_scores', 
        severity: 'warning',
        message: 'No category scores (sub_scores, final_scores, or legacy format) found'
      });
    }
    
    // Validate sub-scores are in valid range (0-10)
    if (hasSubScores) {
      const subScores = response.metrics.subScores || response.metrics.sub_scores;
      const invalidSubScores = [];
      
      Object.entries(subScores).forEach(([category, scores]) => {
        if (typeof scores === 'object') {
          Object.entries(scores).forEach(([metric, value]) => {
            if (typeof value === 'number' && (value < 0 || value > 10)) {
              invalidSubScores.push({ category, metric, value });
            }
          });
        }
      });
      
      if (invalidSubScores.length > 0) {
        issues.push({ 
          type: 'invalid_sub_score_range', 
          severity: 'warning',
          message: `${invalidSubScores.length} sub-scores out of valid range (0-10)`,
          invalidScores: invalidSubScores
        });
      }
    }
  }
  
  // Check action items count (should be 6-8: 3-4 communication tips + 3-4 body language tips)
  // Note: The new prompt format includes separate Communication Tips and Body Language Tips sections
  if (response.text) {
    try {
      const actionItems = parseActionItems(response.text);
      
      if (actionItems.length === 0) {
        issues.push({ 
          type: 'no_action_items', 
          severity: 'warning',
          message: 'No action items found in response',
          found: 0,
          expected: '6-8 (3-4 communication + 3-4 body language)'
        });
      } else if (actionItems.length < 4) {
        issues.push({ 
          type: 'insufficient_action_items', 
          severity: 'warning',
          message: `Only ${actionItems.length} action items found (expected 6-8: 3-4 communication + 3-4 body language)`,
          found: actionItems.length,
          expected: '6-8'
        });
      } else if (actionItems.length > 10) {
        // Only flag if significantly more than expected (allowing for Recording Note, Quick Wins, etc.)
        issues.push({ 
          type: 'too_many_action_items', 
          severity: 'info',
          message: `${actionItems.length} action items found (expected 6-8 tips, may include extra items like Recording Note)`,
          found: actionItems.length,
          expected: '6-8'
        });
      }
    } catch (parseError) {
      issues.push({ 
        type: 'action_items_parse_error', 
        severity: 'warning',
        message: `Failed to parse action items: ${parseError.message}`
      });
    }
  }
  
  // Check for truncation - prioritize finishReason over text pattern matching
  const finishReason = response.finishReason;
  
  // If finishReason explicitly indicates truncation, flag it immediately
  if (finishReason === 'MAX_TOKENS' || finishReason === 'OTHER') {
    issues.push({ 
      type: 'response_truncated', 
      severity: 'critical',
      message: `Response truncated - finishReason: ${finishReason}`
    });
  } else if (finishReason === 'STOP') {
    // STOP means normal completion - trust it and don't flag truncation
    // Even if text patterns suggest truncation, STOP means the model completed successfully
    // This fixes the false positive where STOP responses were flagged as truncated
  } else if (response.text && !finishReason) {
    // If finishReason is missing, check text patterns as fallback (but be conservative)
    // Only flag if there are clear indicators of truncation at the very end
    const truncationIndicators = [
      /```json\s*$/,           // JSON block started but not closed at end
      /```\s*$/,               // Code block not closed at end
    ];
    
    // Only check for unclosed JSON/code blocks at the very end (more reliable indicator)
    const textEnd = response.text.trim().slice(-50); // Check last 50 chars
    const hasUnclosedBlock = truncationIndicators.some(pattern => pattern.test(textEnd));
    
    if (hasUnclosedBlock) {
      issues.push({ 
        type: 'response_truncated', 
        severity: 'critical',  // Critical if clear truncation indicators found
        message: `Response appears truncated - unclosed code block detected (finishReason: missing)`
      });
    }
  }
  
  // Determine if the response is valid (no critical issues)
  const hasCriticalIssues = issues.some(i => i.severity === 'critical');
  const shouldRetry = hasCriticalIssues;
  
  return {
    isValid: !hasCriticalIssues,
    issues,
    shouldRetry,
    summary: issues.length === 0 
      ? 'Response validation passed' 
      : `Found ${issues.length} issue(s): ${issues.filter(i => i.severity === 'critical').length} critical, ${issues.filter(i => i.severity === 'warning').length} warnings`
  };
};

/**
 * Validates that scores are consistent and not suspiciously uniform
 * @param {Object} metrics - The metrics object
 * @returns {Object} Validation result
 */
export const validateScoreConsistency = (metrics) => {
  const issues = [];
  
  if (!metrics) return { isValid: true, issues };
  
  // Check if all final scores are identical (suspicious)
  const finalScores = metrics.finalScores || metrics.final_scores;
  if (finalScores) {
    const values = Object.values(finalScores).filter(v => typeof v === 'number');
    const uniqueValues = new Set(values);
    
    if (values.length > 3 && uniqueValues.size === 1) {
      issues.push({
        type: 'uniform_scores',
        severity: 'warning',
        message: `All ${values.length} category scores are identical (${values[0]})`,
        scores: finalScores
      });
    }
  }
  
  // Check for suspiciously round numbers (all ending in .0)
  if (finalScores) {
    const values = Object.values(finalScores).filter(v => typeof v === 'number');
    const allRound = values.every(v => v % 1 === 0);
    
    if (values.length > 3 && allRound) {
      issues.push({
        type: 'suspiciously_round_scores',
        severity: 'info',
        message: 'All scores are round numbers (may indicate less precise analysis)',
        scores: finalScores
      });
    }
  }
  
  return {
    isValid: !issues.some(i => i.severity === 'critical'),
    issues
  };
};

export default {
  validateAnalysisResponse,
  validateScoreConsistency
};

