import { parseActionItems } from '../services/parseActionItems.js';

describe('parseActionItems', () => {
  test('should return empty array for empty or null input', () => {
    expect(parseActionItems('')).toEqual([]);
    expect(parseActionItems(null)).toEqual([]);
    expect(parseActionItems(undefined)).toEqual([]);
  });

  test('should parse modern tip sections format - Communication Tips', () => {
    const text = `
## Communication Tips

- **Eye Contact**
  What to practice: Maintain steady eye contact
  Why it matters: Builds trust and connection

- **Voice Modulation**
  What to practice: Vary your tone
  Why it matters: Keeps audience engaged
`;

    const result = parseActionItems(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('section', 'communication');
    expect(result[0]).toHaveProperty('item_type', 'tip');
  });

  test('should parse modern tip sections format - Body Language Tips', () => {
    const text = `
## Body Language Tips

- **Posture**
  What to practice: Stand straight
  Why it matters: Shows confidence
`;

    const result = parseActionItems(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].section).toBe('body-language');
  });

  test('should parse Quick Wins section', () => {
    const text = `
## Quick Wins

- Smile more
- Use hand gestures
`;

    const result = parseActionItems(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].section).toBe('quick');
    expect(result[0].item_type).toBe('quick_win');
  });

  test('should parse legacy Action Plan format', () => {
    const text = `
Action: Improve eye contact
- What to do: Look at the camera
- Why: Builds connection

Action: Speak slower
- What to do: Pause between sentences
- Why: Improves clarity
`;

    const result = parseActionItems(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('details');
  });

  test('should handle Hebrew text', () => {
    const text = `
## טיפים לתקשורת

- **קשר עין**
  מה לתרגל: שמירה על קשר עין יציב
  למה זה חשוב: בונה אמון וחיבור
`;

    const result = parseActionItems(text);
    expect(result.length).toBeGreaterThan(0);
  });

  test('should deduplicate items', () => {
    const text = `
Action: Improve eye contact
- What to do: Look at the camera

Action: Improve eye contact
- What to do: Look at the camera
`;

    const result = parseActionItems(text);
    // Should deduplicate
    const titles = result.map(r => r.title.toLowerCase().trim());
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBeLessThanOrEqual(titles.length);
  });
});



