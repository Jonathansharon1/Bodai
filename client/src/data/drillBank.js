// Smart Drill Library for BodAI Dojo
// Maps specific drills to user weaknesses (parameters)

export const DRILL_BANK = [
  // --- VOICE (Volume, Pace, Tone, Articulation) ---
  {
    id: 'voice_humming',
    category: 'voice',
    relatedMetrics: ['voice_tone_variation', 'voice_warmth', 'voice_volume_stability'],
    icon: '🐝',
    duration: '30 sec',
    translationKey: 'practice.drills.voiceHumming'
  },
  {
    id: 'voice_tongue_twister',
    category: 'voice',
    relatedMetrics: ['voice_articulation', 'clarity_word_choice'],
    icon: '👅',
    duration: '45 sec',
    translationKey: 'practice.drills.tongueTwister'
  },
  {
    id: 'voice_siren',
    category: 'voice',
    relatedMetrics: ['voice_tone_variation', 'impact_energy'],
    icon: '🎢',
    duration: '20 sec',
    translationKey: 'practice.drills.vocalSiren'
  },
  {
    id: 'voice_pace_count',
    category: 'voice',
    relatedMetrics: ['voice_pace_control', 'confidence_filler_word_control'],
    icon: '⏱️',
    duration: '1 min',
    translationKey: 'practice.drills.paceCount'
  },

  // --- PRESENCE (Posture, Eye Contact, Hands) ---
  {
    id: 'presence_superman',
    category: 'presence',
    relatedMetrics: ['presence_body_posture', 'confidence_physical_tension'],
    icon: '🦸',
    duration: '1 min',
    translationKey: 'practice.drills.supermanPose'
  },
  {
    id: 'presence_eye_corners',
    category: 'presence',
    relatedMetrics: ['presence_eye_contact', 'presence_facial_relaxation'],
    icon: '👀',
    duration: '30 sec',
    translationKey: 'practice.drills.eyeCorners'
  },
  {
    id: 'presence_hand_shake',
    category: 'presence',
    relatedMetrics: ['presence_hand_naturalness', 'presence_openness', 'confidence_physical_tension'],
    icon: '👋',
    duration: '15 sec',
    translationKey: 'practice.drills.shakeItOut'
  },
  {
    id: 'presence_mirror_smile',
    category: 'presence',
    relatedMetrics: ['presence_facial_relaxation', 'authenticity_naturalness'],
    icon: '😊',
    duration: '30 sec',
    translationKey: 'practice.drills.mirrorSmile'
  },

  // --- ENERGY & IMPACT ---
  {
    id: 'impact_jumping_jacks',
    category: 'impact',
    relatedMetrics: ['impact_energy', 'impact_engagement'],
    icon: '⚡',
    duration: '30 sec',
    translationKey: 'practice.drills.jumpingJacks'
  },
  {
    id: 'impact_volume_spike',
    category: 'impact',
    relatedMetrics: ['impact_persuasiveness', 'voice_volume_stability'],
    icon: '📢',
    duration: '20 sec',
    translationKey: 'practice.drills.volumeSpike'
  },

  // --- CLARITY & CONFIDENCE ---
  {
    id: 'clarity_one_breath',
    category: 'clarity',
    relatedMetrics: ['clarity_structure', 'confidence_filler_word_control'],
    icon: '🌬️',
    duration: '30 sec',
    translationKey: 'practice.drills.oneBreath'
  },
  {
    id: 'confidence_box_breathing',
    category: 'confidence',
    relatedMetrics: ['confidence_comfort_level', 'confidence_physical_tension', 'confidence_vocal_stability'],
    icon: '🧘',
    duration: '1 min',
    translationKey: 'practice.drills.boxBreathing'
  }
];

// Helper to get random drills if no weakness matches or for variety
export const getRandomDrills = (count = 3) => {
  const shuffled = [...DRILL_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper to get smart drills based on weaknesses
export const getSmartDrills = (weaknesses = []) => {
  if (!weaknesses || weaknesses.length === 0) {
    return getRandomDrills(3);
  }

  const selectedDrills = [];
  const usedIds = new Set();

  // 1. Try to find a drill for the top weakness
  const topWeakness = weaknesses[0];
  const topDrill = DRILL_BANK.find(d => d.relatedMetrics.includes(topWeakness.key));
  
  if (topDrill) {
    selectedDrills.push(topDrill);
    usedIds.add(topDrill.id);
  }

  // 2. Try to find a drill for the second weakness (if exists)
  if (weaknesses.length > 1) {
    const secondWeakness = weaknesses[1];
    const secondDrill = DRILL_BANK.find(d => 
      d.relatedMetrics.includes(secondWeakness.key) && !usedIds.has(d.id)
    );
    
    if (secondDrill) {
      selectedDrills.push(secondDrill);
      usedIds.add(secondDrill.id);
    }
  }

  // 3. Fill the rest with random unique drills
  const shuffled = [...DRILL_BANK].sort(() => 0.5 - Math.random());
  for (const drill of shuffled) {
    if (selectedDrills.length >= 3) break;
    if (!usedIds.has(drill.id)) {
      selectedDrills.push(drill);
      usedIds.add(drill.id);
    }
  }

  return selectedDrills;
};

