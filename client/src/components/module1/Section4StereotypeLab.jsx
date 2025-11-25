import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Section4StereotypeLab.css';

const CASE_STUDIES = [
  {
    id: 'pity',
    title: 'The Pity Trap',
    image: '👤',
    description: 'High Warmth / Low Competence',
    correctAnswer: { warmth: 8, competence: 3 },
    quadrant: 'Pity',
    explanation: 'This is the Pity Quadrant. High warmth makes them likable, but low competence signals they are not a leader.'
  },
  {
    id: 'threat',
    title: 'The Threat',
    image: '👔',
    description: 'Low Warmth / High Competence',
    correctAnswer: { warmth: 2, competence: 9 },
    quadrant: 'Envy/Threat',
    explanation: 'This is the Envy/Threat Quadrant. We respect their ability, but we do not trust their intentions.'
  },
  {
    id: 'leader',
    title: 'The Leader',
    image: '⭐',
    description: 'High Warmth / High Competence',
    correctAnswer: { warmth: 9, competence: 9 },
    quadrant: 'Admiration',
    explanation: 'This is the Admiration Quadrant. This is the goal of this course.'
  }
];

export default function Section4StereotypeLab() {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedCases, setRevealedCases] = useState(new Set());
  const [showSummary, setShowSummary] = useState(false);

  const currentCase = CASE_STUDIES[currentCaseIndex];
  const isRevealed = revealedCases.has(currentCase.id);

  const handleSliderChange = (caseId, warmth, competence) => {
    setUserAnswers(prev => ({
      ...prev,
      [caseId]: { warmth, competence }
    }));
  };

  const handleSubmit = () => {
    setRevealedCases(prev => new Set([...prev, currentCase.id]));
  };

  const handleNext = () => {
    if (currentCaseIndex < CASE_STUDIES.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  return (
    <motion.section
      className="section4StereotypeLab"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="section4Container">
        <motion.h2
          className="section4Title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          The Stereotype Lab
        </motion.h2>

        {!showSummary ? (
          <div className="section4LabArea">
            {/* Split Screen */}
            <div className="section4SplitScreen">
              {/* Left: Image */}
              <motion.div
                className="section4ImageArea"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="section4ImagePlaceholder">
                  {currentCase.image}
                </div>
                <div className="section4ImageLabel">{currentCase.title}</div>
                <div className="section4ImageDescription">{currentCase.description}</div>
              </motion.div>

              {/* Right: Sliders */}
              <motion.div
                className="section4ControlsArea"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {!isRevealed ? (
                  <>
                    <div className="section4SliderGroup">
                      <label className="section4SliderLabel">
                        Warmth: <span className="section4SliderValue">{userAnswers[currentCase.id]?.warmth || 5}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={userAnswers[currentCase.id]?.warmth || 5}
                        onChange={(e) => handleSliderChange(currentCase.id, parseInt(e.target.value), userAnswers[currentCase.id]?.competence || 5)}
                        className="section4Slider"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #f59e0b ${((userAnswers[currentCase.id]?.warmth || 5) / 10) * 50}%, #10b981 ${((userAnswers[currentCase.id]?.warmth || 5) / 10) * 100}%, #10b981 100%)`
                        }}
                      />
                    </div>

                    <div className="section4SliderGroup">
                      <label className="section4SliderLabel">
                        Competence: <span className="section4SliderValue">{userAnswers[currentCase.id]?.competence || 5}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={userAnswers[currentCase.id]?.competence || 5}
                        onChange={(e) => handleSliderChange(currentCase.id, userAnswers[currentCase.id]?.warmth || 5, parseInt(e.target.value))}
                        className="section4Slider"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #f59e0b ${((userAnswers[currentCase.id]?.competence || 5) / 10) * 50}%, #3b82f6 ${((userAnswers[currentCase.id]?.competence || 5) / 10) * 100}%, #3b82f6 100%)`
                        }}
                      />
                    </div>

                    <button
                      className="section4SubmitBtn"
                      onClick={handleSubmit}
                    >
                      Submit Analysis
                    </button>
                  </>
                ) : (
                  <motion.div
                    className="section4Reveal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h3 className="section4RevealTitle">Analysis Complete</h3>
                    <div className="section4RevealScores">
                      <div className="section4RevealScore">
                        <span className="section4RevealLabel">Your Assessment:</span>
                        <span className="section4RevealValue">
                          W: {userAnswers[currentCase.id]?.warmth || 5} / C: {userAnswers[currentCase.id]?.competence || 5}
                        </span>
                      </div>
                      <div className="section4RevealScore">
                        <span className="section4RevealLabel">Scientific Score:</span>
                        <span className="section4RevealValue">
                          W: {currentCase.correctAnswer.warmth} / C: {currentCase.correctAnswer.competence}
                        </span>
                      </div>
                    </div>
                    <div className="section4RevealQuadrant">
                      <strong>Quadrant:</strong> {currentCase.quadrant}
                    </div>
                    <p className="section4RevealExplanation">{currentCase.explanation}</p>
                    <button
                      className="section4NextBtn"
                      onClick={handleNext}
                    >
                      {currentCaseIndex < CASE_STUDIES.length - 1 ? 'Next Case →' : 'View Summary →'}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Progress Indicator */}
            <div className="section4Progress">
              Case {currentCaseIndex + 1} of {CASE_STUDIES.length}
            </div>
          </div>
        ) : (
          <motion.div
            className="section4Summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="section4SummaryTitle">Lab Complete</h3>
            <p className="section4SummaryText">
              You've analyzed all three case studies. The Stereotype Content Model shows that human judgment 
              operates on just two axes: Warmth and Competence. Your goal is to maximize both.
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}


