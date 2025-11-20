/**
 * Scoring Service
 * Handles all scoring logic: normalization, baseline comparison, anti-jump validation, etc.
 */

export const METRICS_PROCESSOR_VERSION = 'processor.v2025.01';

import {
  DEFAULT_WEIGHTS,
  getWeightsForGoal,
  calculateCategoryScore,
  calculateOverallScore,
  getStageTitle
} from './scoringConfig.js';

/**
 * Normalize a score using global statistics
 * @param {number} rawScore - Raw score (0-10)
 * @param {object} globalStats - Global stats object with mean, std_deviation
 * @returns {number} Normalized score (0-10)
 */
export const normalizeScore = (rawScore, globalStats) => {
  if (!globalStats || !globalStats.mean_value || !globalStats.std_deviation) {
    // No global stats available, return raw score
    return rawScore;
  }

  const mean = parseFloat(globalStats.mean_value);
  const std = parseFloat(globalStats.std_deviation);

  if (std === 0) {
    // No variation, return raw score
    return rawScore;
  }

  // Z-score normalization
  const zScore = (rawScore - mean) / std;
  
  // Scale to 0-10 range (assuming most scores are within 2 standard deviations)
  // z-score of 0 → 5, z-score of 2 → 9, z-score of -2 → 1
  const normalized = (zScore * 2) + 5;
  
  // Clamp to 0-10
  return Math.max(0, Math.min(10, normalized));
};

/**
 * Detect if there's a significant jump in score
 * @param {number} previousScore - Previous score
 * @param {number} newScore - New score
 * @returns {object} Jump detection result
 */
export const detectJump = (previousScore, newScore) => {
  if (previousScore === null || previousScore === undefined || isNaN(previousScore)) {
    return { isJump: false, jumpSize: 0, severity: null };
  }

  const jumpSize = Math.abs(newScore - previousScore);
  
  if (jumpSize < 2) {
    return { isJump: false, jumpSize, severity: null };
  } else if (jumpSize >= 2 && jumpSize <= 3) {
    return { isJump: true, jumpSize, severity: 'minor' };
  } else if (jumpSize > 3 && jumpSize <= 5) {
    return { isJump: true, jumpSize, severity: 'major' };
  } else {
    return { isJump: true, jumpSize, severity: 'extreme' };
  }
};

/**
 * Apply anti-jump rules to prevent unrealistic score changes
 * @param {number} previousScore - Previous score
 * @param {number} newScore - New score
 * @param {string} evidence - LLM's explanation for the jump
 * @param {boolean} hasGoodExplanation - Whether LLM provided good explanation
 * @returns {object} Adjusted score and validation info
 */
export const applyAntiJumpRules = (previousScore, newScore, evidence, hasGoodExplanation = false) => {
  if (previousScore === null || previousScore === undefined || isNaN(previousScore)) {
    // No previous score, accept new score
    return {
      adjustedScore: newScore,
      wasAdjusted: false,
      adjustmentReason: null
    };
  }

  const jump = detectJump(previousScore, newScore);
  
  if (!jump.isJump) {
    // No jump, accept score
    return {
      adjustedScore: newScore,
      wasAdjusted: false,
      adjustmentReason: null
    };
  }

  // If jump is minor (2-3 points), accept it
  if (jump.severity === 'minor') {
    return {
      adjustedScore: newScore,
      wasAdjusted: false,
      adjustmentReason: 'minor_jump_accepted',
      warning: true
    };
  }

  // For major/extreme jumps, require good explanation
  if (jump.severity === 'major' || jump.severity === 'extreme') {
    if (hasGoodExplanation && evidence && evidence.length > 50) {
      // Good explanation provided, accept score
      return {
        adjustedScore: newScore,
        wasAdjusted: false,
        adjustmentReason: 'jump_with_explanation',
        warning: true
      };
    } else {
      // No good explanation, cap/floor the score
      const maxChange = 2.5; // Maximum allowed change
      let adjustedScore;
      
      if (newScore > previousScore) {
        adjustedScore = Math.min(previousScore + maxChange, newScore);
      } else {
        adjustedScore = Math.max(previousScore - maxChange, newScore);
      }

      return {
        adjustedScore,
        wasAdjusted: true,
        adjustmentReason: `jump_capped_${jump.severity}`,
        originalScore: newScore,
        warning: true
      };
    }
  }

  return {
    adjustedScore: newScore,
    wasAdjusted: false,
    adjustmentReason: null
  };
};

/**
 * Compare score to baseline and apply improvement bonus/penalty
 * @param {number} newScore - New score
 * @param {number} baselineScore - Baseline score
 * @returns {object} Adjusted score and improvement info
 */
export const applyBaselineComparison = (newScore, baselineScore) => {
  if (baselineScore === null || baselineScore === undefined || isNaN(baselineScore)) {
    // No baseline, return score as-is
    return {
      adjustedScore: newScore,
      improvementPercent: 0,
      bonusApplied: false
    };
  }

  const improvement = newScore - baselineScore;
  const improvementPercent = (improvement / baselineScore) * 100;

  let adjustedScore = newScore;
  let bonusApplied = false;

  // Apply bonus for significant improvement (>20%)
  if (improvementPercent > 20) {
    adjustedScore = Math.min(10, newScore + 0.5); // Bonus +0.5, capped at 10
    bonusApplied = true;
  }
  // Apply penalty for significant regression (<-20%)
  else if (improvementPercent < -20) {
    adjustedScore = Math.max(0, newScore - 0.5); // Penalty -0.5, floored at 0
  }

  return {
    adjustedScore,
    improvementPercent,
    bonusApplied,
    improvement
  };
};

/**
 * Validate score jump against multiple previous scores
 * @param {number} newScore - New score
 * @param {array} previousScores - Array of previous scores (most recent first)
 * @returns {object} Validation result
 */
export const validateScoreJump = (newScore, previousScores) => {
  if (!previousScores || previousScores.length === 0) {
    return {
      isValid: true,
      reason: 'no_previous_scores'
    };
  }

  const mostRecent = previousScores[0];
  const jump = detectJump(mostRecent, newScore);

  if (!jump.isJump) {
    return {
      isValid: true,
      reason: 'no_jump_detected'
    };
  }

  // Check if there's a trend (improving or declining)
  let trend = 'stable';
  if (previousScores.length >= 2) {
    const secondMostRecent = previousScores[1];
    if (mostRecent > secondMostRecent) {
      trend = 'improving';
    } else if (mostRecent < secondMostRecent) {
      trend = 'declining';
    }
  }

  // If jump is in same direction as trend, it's more likely valid
  const jumpDirection = newScore > mostRecent ? 'up' : 'down';
  const trendDirection = trend === 'improving' ? 'up' : trend === 'declining' ? 'down' : 'stable';

  if (jumpDirection === trendDirection && trend !== 'stable') {
    return {
      isValid: true,
      reason: 'jump_matches_trend',
      trend
    };
  }

  // If jump is against trend, require more validation
  if (jump.severity === 'extreme' && trendDirection !== 'stable' && jumpDirection !== trendDirection) {
    return {
      isValid: false,
      reason: 'jump_against_trend',
      trend,
      requiresExplanation: true
    };
  }

  return {
    isValid: true,
    reason: 'jump_validated',
    trend
  };
};

/**
 * Process all sub-scores: normalize, compare to baseline, check jumps
 * @param {object} rawSubScores - Raw sub-scores from LLM
 * @param {object} userBaseline - User's baseline scores
 * @param {object} globalStatsMap - Map of global stats by sub-metric key
 * @param {array} previousMetrics - Previous 3 analyses' metrics
 * @returns {object} Processed sub-scores with adjustments
 */
export const processSubScores = (rawSubScores, userBaseline, globalStatsMap, previousMetrics = []) => {
  const processed = {};
  const validationResults = {};

  // Get previous scores for each sub-metric
  const previousScoresMap = {};
  previousMetrics.forEach((metric, index) => {
    if (metric.sub_scores) {
      Object.keys(metric.sub_scores).forEach(category => {
        Object.keys(metric.sub_scores[category]).forEach(subMetric => {
          const key = `${category}_${subMetric}`;
          if (!previousScoresMap[key]) {
            previousScoresMap[key] = [];
          }
          previousScoresMap[key].push(metric.sub_scores[category][subMetric]);
        });
      });
    }
  });

  // Process each category
  Object.keys(rawSubScores).forEach(category => {
    processed[category] = {};
    
    Object.keys(rawSubScores[category]).forEach(subMetric => {
      const rawScore = rawSubScores[category][subMetric];
      const subMetricKey = `${category}_${subMetric}`;
      
      // Get baseline for this sub-metric
      const baselineKey = `${subMetricKey}_baseline`;
      const baselineScore = userBaseline?.[baselineKey] || userBaseline?.baselines_json?.[subMetricKey] || null;
      
      // Get global stats
      const globalStats = globalStatsMap[subMetricKey] || null;
      
      // Get previous scores
      const previousScores = previousScoresMap[subMetricKey] || [];
      
      // Step 1: Normalize (global normalization)
      const normalizedScore = normalizeScore(rawScore, globalStats);
      
      // Step 2: Compare to baseline
      const baselineComparison = applyBaselineComparison(normalizedScore, baselineScore);
      
      // Step 3: Check for jumps
      const previousScore = previousScores[0] || null;
      const jumpValidation = validateScoreJump(baselineComparison.adjustedScore, previousScores);
      
      // Step 4: Apply anti-jump rules (if needed)
      // Evidence might be in validation object or sub_score_evidence
      const evidence = rawSubScores._evidence?.[category]?.[subMetric] || 
                      rawSubScores[category]._evidence?.[subMetric] || 
                      '';
      const hasGoodExplanation = evidence && evidence.length > 50;
      const antiJumpResult = applyAntiJumpRules(
        previousScore,
        baselineComparison.adjustedScore,
        evidence,
        hasGoodExplanation
      );
      
      // Final score
      processed[category][subMetric] = antiJumpResult.adjustedScore;
      
      // Store validation metadata
      validationResults[subMetricKey] = {
        rawScore,
        normalizedScore,
        baselineScore,
        baselineComparison,
        jumpValidation,
        antiJumpResult,
        previousScore
      };
    });
  });

  return {
    processedScores: processed,
    validationResults
  };
};

/**
 * Calculate final category scores from processed sub-scores
 * @param {object} processedSubScores - Processed sub-scores
 * @param {string} userGoal - User's primary goal
 * @returns {object} Category scores
 */
export const calculateFinalCategoryScores = (processedSubScores, userGoal = 'general') => {
  const weights = getWeightsForGoal(userGoal);
  const categoryScores = {};

  Object.keys(processedSubScores).forEach(category => {
    const subScores = processedSubScores[category];
    const categoryWeights = weights[category] || DEFAULT_WEIGHTS[category];
    
    categoryScores[category] = calculateCategoryScore(subScores, categoryWeights);
  });

  return categoryScores;
};

/**
 * Process complete analysis metrics
 * @param {object} params - Processing parameters
 * @returns {object} Complete processed metrics
 */
export const processAnalysisMetrics = ({
  rawSubScores,
  userBaseline,
  globalStatsMap,
  previousMetrics,
  userGoal = 'general'
}) => {
  // Process all sub-scores
  const { processedScores, validationResults } = processSubScores(
    rawSubScores,
    userBaseline,
    globalStatsMap,
    previousMetrics
  );

  // Calculate category scores
  const categoryScores = calculateFinalCategoryScores(processedScores, userGoal);

  // Calculate overall score
  const overallScore = calculateOverallScore(categoryScores);

  // Get stage title
  const stageTitle = getStageTitle(overallScore);

  return {
    subScores: processedScores,
    categoryScores,
    overallScore,
    stageTitle,
    validationResults,
    processingVersion: METRICS_PROCESSOR_VERSION
  };
};

