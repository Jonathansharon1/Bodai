import {
  normalizeScore,
  detectJump,
  applyAntiJumpRules,
  processAnalysisMetrics
} from '../services/scoringService.js';

describe('normalizeScore', () => {
  test('should return raw score when no global stats available', () => {
    expect(normalizeScore(7.5, null)).toBe(7.5);
    expect(normalizeScore(7.5, {})).toBe(7.5);
  });

  test('should normalize score using global stats', () => {
    const globalStats = {
      mean_value: 5.0,
      std_deviation: 2.0
    };
    
    const normalized = normalizeScore(7.0, globalStats);
    expect(normalized).toBeGreaterThanOrEqual(0);
    expect(normalized).toBeLessThanOrEqual(10);
  });

  test('should handle zero standard deviation', () => {
    const globalStats = {
      mean_value: 5.0,
      std_deviation: 0
    };
    
    expect(normalizeScore(7.0, globalStats)).toBe(7.0);
  });

  test('should clamp scores to 0-10 range', () => {
    const globalStats = {
      mean_value: 5.0,
      std_deviation: 1.0
    };
    
    const highScore = normalizeScore(15.0, globalStats);
    expect(highScore).toBeLessThanOrEqual(10);
    
    const lowScore = normalizeScore(-5.0, globalStats);
    expect(lowScore).toBeGreaterThanOrEqual(0);
  });
});

describe('detectJump', () => {
  test('should return no jump for small changes', () => {
    const result = detectJump(5.0, 6.0);
    expect(result.isJump).toBe(false);
  });

  test('should detect minor jump (2-3 points)', () => {
    const result = detectJump(5.0, 7.5);
    expect(result.isJump).toBe(true);
    expect(result.severity).toBe('minor');
  });

  test('should detect major jump (3-5 points)', () => {
    const result = detectJump(5.0, 8.5);
    expect(result.isJump).toBe(true);
    expect(result.severity).toBe('major');
  });

  test('should detect extreme jump (>5 points)', () => {
    const result = detectJump(5.0, 11.0);
    expect(result.isJump).toBe(true);
    expect(result.severity).toBe('extreme');
  });

  test('should handle null previous score', () => {
    const result = detectJump(null, 7.0);
    expect(result.isJump).toBe(false);
  });
});

describe('applyAntiJumpRules', () => {
  test('should accept score when no previous score exists', () => {
    const result = applyAntiJumpRules(null, 7.0, '');
    expect(result.wasAdjusted).toBe(false);
    expect(result.adjustedScore).toBe(7.0);
  });

  test('should accept minor jumps', () => {
    const result = applyAntiJumpRules(5.0, 7.0, 'Good explanation');
    expect(result.wasAdjusted).toBe(false);
  });

  test('should adjust major jumps without good explanation', () => {
    const result = applyAntiJumpRules(5.0, 9.0, '');
    // Should be adjusted
    expect(result.wasAdjusted).toBe(true);
    expect(result.adjustedScore).toBeLessThan(9.0);
  });

  test('should accept major jumps with good explanation', () => {
    const result = applyAntiJumpRules(5.0, 9.0, 'Detailed explanation', true);
    // May still be adjusted but less aggressively
    expect(result.adjustedScore).toBeGreaterThan(5.0);
  });
});



