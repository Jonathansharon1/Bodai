import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Brain, Sparkles } from 'lucide-react';
import './Section2SignalDossier.css';

const TABS = [
  { id: 'warmth', label: 'Warmth', icon: Eye, color: '#10b981' }, // emerald-500
  { id: 'competence', label: 'Competence', icon: Brain, color: '#3b82f6' }, // blue-500
  { id: 'halo', label: 'The Halo Effect', icon: Sparkles, color: '#e5e5e5' }
];

const TAB_CONTENT = {
  warmth: {
    title: 'Warmth (The Trust Signal)',
    goal: 'Evolutionary Goal: Determine Intent.',
    markers: [
      {
        name: 'Orbicularis Oculi',
        label: 'The Duchenne Marker (True Smile)',
        description: 'The genuine smile that reaches the eyes. The orbicularis oculi muscle contracts, creating crow\'s feet. This is the universal signal of authentic joy and trustworthiness.',
        position: { top: '35%', left: '45%' }
      },
      {
        name: 'Eyebrow Flash',
        label: 'The universal "Friend" signal',
        description: 'A rapid raise and lower of the eyebrows (0.2 seconds). This micro-expression signals recognition, friendliness, and non-threat across all cultures.',
        position: { top: '25%', left: '45%' }
      },
      {
        name: 'Ventral Fronting',
        label: 'Exposing the torso signals safety',
        description: 'Turning the vulnerable front of the body toward someone is a primal signal of trust. It says "I am not a threat, and I trust you are not either."',
        position: { top: '50%', left: '50%' }
      }
    ]
  },
  competence: {
    title: 'Competence (The Power Signal)',
    goal: 'Evolutionary Goal: Determine Capacity.',
    markers: [
      {
        name: 'Chin Angle',
        label: 'Lifted chin exposes jugular (Confidence)',
        description: 'A raised chin exposes the jugular vein—the most vulnerable part of the neck. This is a dominance display that signals "I am so confident, I can afford to show vulnerability."',
        position: { top: '30%', left: '50%' }
      },
      {
        name: 'Expansive Posture',
        label: 'Taking space claims status',
        description: 'Spreading out, taking up physical space, and holding an open posture signals dominance and confidence. Research shows this increases testosterone and decreases cortisol.',
        position: { top: '55%', left: '50%' }
      },
      {
        name: 'Vocal Arc',
        label: 'Downward inflection signals certainty',
        description: 'Ending statements with a downward vocal inflection (rather than upward, like a question) signals certainty and authority. The voice drops at the end, indicating confidence.',
        position: { top: '40%', left: '30%' }
      }
    ]
  },
  halo: {
    title: 'The Halo Effect',
    goal: 'Cognitive Bias: Attractive/Taller people are perceived as more competent.',
    strategy: 'Strategy: Enclothed Cognition (Managed in Module 2.5)',
    description: 'The halo effect is a cognitive bias where one positive trait (like physical attractiveness or height) influences our perception of other traits (like competence or intelligence). Research shows attractive people are automatically perceived as more capable, even when there is no correlation. This bias is particularly strong in first impressions and can significantly impact career outcomes.'
  }
};

export default function Section2SignalDossier() {
  const [activeTab, setActiveTab] = useState('warmth');

  const currentContent = TAB_CONTENT[activeTab];
  const activeTabData = TABS.find(tab => tab.id === activeTab);

  return (
    <motion.section
      className="section2SignalDossier"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="section2Container">
        <motion.h2
          className="section2Title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          The Signal Dossier
        </motion.h2>

        {/* Tabs */}
        <div className="section2Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`section2Tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  borderBottomColor: activeTab === tab.id ? tab.color : 'transparent'
                }}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          className="section2Content"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="section2ContentHeader">
            <h3 className="section2ContentTitle">{currentContent.title}</h3>
            <p className="section2ContentGoal">{currentContent.goal}</p>
          </div>

          {activeTab === 'halo' ? (
            <div className="section2HaloContent">
              <p className="section2HaloDescription">{currentContent.description}</p>
              <div className="section2HaloStrategy">
                <strong>Strategy:</strong> {currentContent.strategy}
              </div>
            </div>
          ) : (
            <div className="section2MarkersContainer">
              <div className="section2Schematic">
                {/* Placeholder for schematic illustration */}
                <div className="section2SchematicPlaceholder">
                  <div className="section2SchematicFace">
                    {currentContent.markers.map((marker, index) => (
                      <motion.div
                        key={marker.name}
                        className="section2Marker"
                        style={marker.position}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.2, duration: 0.4 }}
                      >
                        <div className="section2MarkerDot" style={{ backgroundColor: activeTabData.color }}></div>
                        <div className="section2MarkerLabel">{marker.name}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section2MarkersList">
                {currentContent.markers.map((marker, index) => (
                  <motion.div
                    key={marker.name}
                    className="section2MarkerCard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <div className="section2MarkerCardHeader">
                      <h4 className="section2MarkerCardName">{marker.name}</h4>
                      <div
                        className="section2MarkerCardAccent"
                        style={{ backgroundColor: activeTabData.color }}
                      ></div>
                    </div>
                    <p className="section2MarkerCardLabel">{marker.label}</p>
                    <p className="section2MarkerCardDescription">{marker.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}


