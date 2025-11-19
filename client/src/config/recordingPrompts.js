export const RECORDING_PROMPTS = {
  presentation: [
    {
      id: 'pres_intro',
      title: 'Opening Hook',
      description: 'Deliver the first 60 seconds of your presentation as if you are grabbing attention in the room.'
    },
    {
      id: 'pres_transition',
      title: 'Smooth Transition',
      description: 'Explain how you move from one key point to the next. Focus on signposting phrases and body movement.'
    },
    {
      id: 'pres_call_to_action',
      title: 'Closing CTA',
      description: 'Record the final 45 seconds where you summarize and give a clear call to action.'
    }
  ],
  confidence: [
    {
      id: 'conf_proud',
      title: 'Proud Moment',
      description: 'Share a short story (1-2 minutes) about something you’re proud of. Maintain steady eye contact and grounded posture.'
    },
    {
      id: 'conf_story',
      title: 'Challenging Story',
      description: 'Describe a situation that made you nervous and how you handled it. Focus on calm pace and voice stability.'
    },
    {
      id: 'conf_message',
      title: 'Message to a Friend',
      description: 'Speak to the camera as if a close friend needs encouragement. Keep the tone warm and confident.'
    }
  ],
  interview: [
    {
      id: 'int_self',
      title: 'Tell me about yourself',
      description: 'Answer the common interview opener. Highlight structure: past, present, future.'
    },
    {
      id: 'int_challenge',
      title: 'Biggest Challenge',
      description: 'Explain a tough project you led, including your actions and results.'
    },
    {
      id: 'int_fit',
      title: 'Why this role',
      description: 'Sell yourself for a dream role. Focus on clarity, energy, and concise storytelling.'
    }
  ],
  dating: [
    {
      id: 'date_intro',
      title: 'Warm Introduction',
      description: 'Introduce yourself as if you’re meeting someone new. Share what currently excites you.'
    },
    {
      id: 'date_story',
      title: 'Personal Story',
      description: 'Tell a short, light story (funny/feel-good) that shows personality and gestures.'
    },
    {
      id: 'date_question',
      title: 'Curious Follow-up',
      description: 'Ask 2-3 thoughtful questions as if you’re in a conversation, keeping tone playful and open.'
    }
  ],
  communication: [
    {
      id: 'comm_explain',
      title: 'Explain a concept',
      description: 'Teach a simple idea (recipe, hobby, news) in under 2 minutes. Keep structure clear.'
    },
    {
      id: 'comm_story',
      title: 'Recent Experience',
      description: 'Describe a recent event to a friend. Practice expressive facial cues and pacing.'
    },
    {
      id: 'comm_smalltalk',
      title: 'Small Talk Practice',
      description: 'Simulate meeting a colleague: greet them, share an update, and ask a question.'
    }
  ],
  leadership: [
    {
      id: 'lead_huddle',
      title: 'Team Huddle',
      description: 'Give a short pep talk before a big milestone. Emphasize presence and confident gestures.'
    },
    {
      id: 'lead_feedback',
      title: 'Give Feedback',
      description: 'Record yourself giving constructive feedback to a teammate. Balance warmth and directness.'
    },
    {
      id: 'lead_vision',
      title: 'Vision Pitch',
      description: 'Describe your vision for the next quarter as if you’re on stage. Keep tone inspiring.'
    }
  ],
  general: [
    {
      id: 'gen_update',
      title: 'Personal Update',
      description: 'Give a personal update (life, work, hobby) in 90 seconds, focusing on clarity and authenticity.'
    }
  ]
};

export const getPromptsForGoal = (goalId) => {
  if (!goalId) return RECORDING_PROMPTS.general;
  return RECORDING_PROMPTS[goalId] || RECORDING_PROMPTS.general;
};

export const getPromptById = (promptId) => {
  if (!promptId) return null;
  for (const prompts of Object.values(RECORDING_PROMPTS)) {
    const found = prompts.find(prompt => prompt.id === promptId);
    if (found) return found;
  }
  return null;
};

export const getBaselinePromptForGoal = (goalId) => {
  const prompts = getPromptsForGoal(goalId);
  if (!prompts || prompts.length === 0) {
    return null;
  }
  return prompts[0];
};

