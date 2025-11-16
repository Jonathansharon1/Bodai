/**
 * Scoring Configuration
 * Defines weights for calculating final category scores from sub-metrics
 */

// Default weights for all users
export const DEFAULT_WEIGHTS = {
  voice: {
    volume_stability: 0.20,
    tone_variation: 0.20,
    pace_control: 0.25,
    articulation: 0.20,
    warmth: 0.15
  },
  presence: {
    eye_contact: 0.25,
    facial_relaxation: 0.15,
    body_posture: 0.20,
    hand_naturalness: 0.15,
    openness: 0.25
  },
  clarity: {
    structure: 0.25,
    focus: 0.25,
    example_usage: 0.20,
    transition_quality: 0.15,
    repetition_control: 0.15
  },
  authenticity: {
    naturalness: 0.40,
    emotional_transparency: 0.35,
    forced_expression_reduction: 0.25
  },
  impact: {
    energy: 0.35,
    engagement: 0.35,
    persuasiveness: 0.30
  },
  confidence: {
    filler_word_control: 0.20,
    pause_control: 0.15,
    physical_tension: 0.20,
    vocal_stability: 0.20,
    comfort_level: 0.25
  }
};

// Goal-specific weight adjustments
export const GOAL_WEIGHT_ADJUSTMENTS = {
  confidence: {
    // Confidence goal: emphasize confidence and presence
    confidence: 1.20, // +20%
    presence: 1.15,   // +15%
    voice: 1.10       // +10%
  },
  interview: {
    // Interview goal: emphasize clarity and presence
    clarity: 1.20,    // +20%
    presence: 1.15,   // +15%
    confidence: 1.10  // +10%
  },
  presentation: {
    // Presentation goal: emphasize impact and voice
    impact: 1.25,     // +25%
    voice: 1.15,      // +15%
    presence: 1.10    // +10%
  },
  communication: {
    // Communication goal: emphasize clarity and authenticity
    clarity: 1.15,    // +15%
    authenticity: 1.15, // +15%
    voice: 1.10       // +10%
  },
  leadership: {
    // Leadership goal: emphasize impact and presence
    impact: 1.20,     // +20%
    presence: 1.15,   // +15%
    confidence: 1.10  // +10%
  },
  dating: {
    // Dating goal: emphasize authenticity and presence
    authenticity: 1.30, // +30%
    presence: 1.20,     // +20%
    voice: 1.10         // +10%
  },
  social: {
    // Social goal: emphasize authenticity and presence
    authenticity: 1.20, // +20%
    presence: 1.15,     // +15%
    voice: 1.10         // +10%
  },
  general: {
    // General: no adjustments, use default weights
  }
};

/**
 * Get weights for a specific user goal
 * @param {string} goal - User's primary goal
 * @returns {object} Adjusted weights
 */
export const getWeightsForGoal = (goal = 'general') => {
  const adjustments = GOAL_WEIGHT_ADJUSTMENTS[goal] || {};
  const weights = JSON.parse(JSON.stringify(DEFAULT_WEIGHTS)); // Deep copy

  // Apply adjustments
  Object.keys(adjustments).forEach(category => {
    if (weights[category]) {
      const multiplier = adjustments[category];
      Object.keys(weights[category]).forEach(subMetric => {
        weights[category][subMetric] *= multiplier;
      });
    }
  });

  // Normalize weights to sum to 1.0 for each category
  Object.keys(weights).forEach(category => {
    const sum = Object.values(weights[category]).reduce((a, b) => a + b, 0);
    Object.keys(weights[category]).forEach(subMetric => {
      weights[category][subMetric] /= sum;
    });
  });

  return weights;
};

/**
 * Calculate final category score from sub-metrics
 * @param {object} subScores - Object with sub-metric scores
 * @param {object} weights - Weights for each sub-metric
 * @returns {number} Final score (0-10)
 */
export const calculateCategoryScore = (subScores, weights) => {
  let total = 0;
  let totalWeight = 0;

  Object.keys(weights).forEach(subMetric => {
    const score = subScores[subMetric];
    const weight = weights[subMetric];

    if (score !== null && score !== undefined && !isNaN(score)) {
      total += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? total / totalWeight : 0;
};

/**
 * Calculate overall score from category scores
 * @param {object} categoryScores - Object with category scores
 * @returns {number} Overall score (0-100)
 */
export const calculateOverallScore = (categoryScores) => {
  const categoryWeights = {
    voice: 0.15,
    presence: 0.15,
    clarity: 0.15,
    authenticity: 0.15,
    impact: 0.20,
    confidence: 0.20
  };

  let total = 0;
  let totalWeight = 0;

  Object.keys(categoryWeights).forEach(category => {
    const score = categoryScores[category];
    const weight = categoryWeights[category];

    if (score !== null && score !== undefined && !isNaN(score)) {
      total += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? (total / totalWeight) * 10 : 0; // Scale to 0-100
};

/**
 * Get stage title based on overall score
 * @param {number} overallScore - Overall score (0-100)
 * @returns {string} Stage title
 */
export const getStageTitle = (overallScore) => {
  if (overallScore >= 96) return 'Master Communicator';
  if (overallScore >= 86) return 'Confident Communicator';
  if (overallScore >= 76) return 'Expressive Communicator';
  if (overallScore >= 61) return 'Developing Communicator';
  if (overallScore >= 41) return 'Emerging Communicator';
  return 'Beginning Communicator';
};

/**
 * List of all sub-metrics by category
 */
export const SUB_METRICS = {
  voice: [
    'volume_stability',
    'tone_variation',
    'pace_control',
    'articulation',
    'warmth'
  ],
  presence: [
    'eye_contact',
    'facial_relaxation',
    'body_posture',
    'hand_naturalness',
    'openness'
  ],
  clarity: [
    'structure',
    'focus',
    'example_usage',
    'transition_quality',
    'repetition_control'
  ],
  authenticity: [
    'naturalness',
    'emotional_transparency',
    'forced_expression_reduction'
  ],
  impact: [
    'energy',
    'engagement',
    'persuasiveness'
  ],
  confidence: [
    'filler_word_control',
    'pause_control',
    'physical_tension',
    'vocal_stability',
    'comfort_level'
  ]
};

/**
 * Get all sub-metric keys as flat array
 */
export const getAllSubMetricKeys = () => {
  const keys = [];
  Object.keys(SUB_METRICS).forEach(category => {
    SUB_METRICS[category].forEach(subMetric => {
      keys.push(`${category}_${subMetric}`);
    });
  });
  return keys;
};

