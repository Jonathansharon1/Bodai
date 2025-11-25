import React, { useState } from 'react';
import WarmthCompetenceSlider from './WarmthCompetenceSlider';
import './Section2AssessmentLab.css';

const ASSESSMENT_TESTS = [
  {
    id: 'pity',
    title: 'The Pity Test',
    image: '👤', // Placeholder - replace with actual photo
    description: 'A person with a head tilt, big smile, but slumped shoulders and messy collar.',
    correctAnswer: { warmth: 8, competence: 3 },
    explanation: 'This is the Pity Quadrant. High warmth makes them likable, but low competence signals they are not a leader.',
    quadrant: 'pity',
    feeling: 'You are liked, but ignored. You are not given responsibility.'
  },
  {
    id: 'threat',
    title: 'The Threat Test',
    image: '👔', // Placeholder - replace with actual photo
    description: 'A person in a sharp suit, perfect posture, unsmiling, intense stare.',
    correctAnswer: { warmth: 2, competence: 9 },
    explanation: 'This is the Envy/Threat Quadrant. We respect their ability, but we do not trust their intentions.',
    quadrant: 'threat',
    feeling: 'You are respected, but people will try to take you down. They do not trust you.'
  },
  {
    id: 'golden',
    title: 'The Golden Test',
    image: '⭐', // Placeholder - replace with actual photo
    description: 'Upright posture, open palms, Duchenne (genuine) smile.',
    correctAnswer: { warmth: 9, competence: 9 },
    explanation: 'This is the Admiration Quadrant. This is the goal of this course.',
    quadrant: 'admiration',
    feeling: 'Admiration. This is where leadership happens.'
  }
];

export default function Section2AssessmentLab({ onComplete }) {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedTests, setRevealedTests] = useState(new Set());
  const [showFinalGrid, setShowFinalGrid] = useState(false);

  const currentTest = ASSESSMENT_TESTS[currentTestIndex];
  const isRevealed = revealedTests.has(currentTest.id);

  const handleSliderChange = (testId, warmth, competence) => {
    setUserAnswers(prev => ({
      ...prev,
      [testId]: { warmth, competence }
    }));
  };

  const handleSubmit = () => {
    setRevealedTests(prev => new Set([...prev, currentTest.id]));
  };

  const handleNext = () => {
    if (currentTestIndex < ASSESSMENT_TESTS.length - 1) {
      setCurrentTestIndex(prev => prev + 1);
    } else {
      // Show final grid
      setShowFinalGrid(true);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const getQuadrantForAnswer = (warmth, competence) => {
    if (warmth >= 6 && competence >= 6) return 'admiration';
    if (warmth >= 6 && competence < 6) return 'pity';
    if (warmth < 6 && competence >= 6) return 'threat';
    return 'contempt';
  };

  return (
    <section className="section2AssessmentLab">
      <div className="section2Container">
        {!showFinalGrid ? (
          <>
            <div className="section2Header">
              <h2 className="section2Title">Phase 2: Calibrating the Algorithm</h2>
              <p className="section2Instruction">
                Analyze the following subjects. Trust your gut. You have 3 seconds.
              </p>
              <div className="section2Progress">
                Test {currentTestIndex + 1} of {ASSESSMENT_TESTS.length}
              </div>
            </div>

            <div className="section2TestArea">
              <div className="section2PhotoContainer">
                <div className="section2PhotoPlaceholder">
                  {currentTest.image}
                </div>
                <div className="section2PhotoLabel">{currentTest.title}</div>
                {currentTest.description && (
                  <p className="section2PhotoDescription">{currentTest.description}</p>
                )}
              </div>

              {!isRevealed ? (
                <div className="section2InteractionArea">
                  <WarmthCompetenceSlider
                    warmth={userAnswers[currentTest.id]?.warmth || 5}
                    competence={userAnswers[currentTest.id]?.competence || 5}
                    onChange={(warmth, competence) => handleSliderChange(currentTest.id, warmth, competence)}
                  />
                  <button 
                    className="section2SubmitBtn"
                    onClick={handleSubmit}
                    disabled={!userAnswers[currentTest.id]}
                  >
                    Submit Analysis
                  </button>
                </div>
              ) : (
                <div className="section2Reveal">
                  <div className="section2RevealContent">
                    <h3 className="section2RevealTitle">Analysis Complete</h3>
                    <div className="section2RevealScores">
                      <div className="section2RevealScore">
                        <span className="section2RevealLabel">Your Assessment:</span>
                        <span className="section2RevealValue">
                          Warmth: {userAnswers[currentTest.id]?.warmth || 5}/10, 
                          Competence: {userAnswers[currentTest.id]?.competence || 5}/10
                        </span>
                      </div>
                      <div className="section2RevealScore">
                        <span className="section2RevealLabel">Scientific Score:</span>
                        <span className="section2RevealValue">
                          Warmth: {currentTest.correctAnswer.warmth}/10, 
                          Competence: {currentTest.correctAnswer.competence}/10
                        </span>
                      </div>
                    </div>
                    <p className="section2RevealExplanation">{currentTest.explanation}</p>
                    {currentTest.feeling && (
                      <p className="section2RevealFeeling">
                        <strong>Feeling:</strong> {currentTest.feeling}
                      </p>
                    )}
                    <button 
                      className="section2NextBtn"
                      onClick={handleNext}
                    >
                      {currentTestIndex < ASSESSMENT_TESTS.length - 1 ? 'Next Test →' : 'View Summary →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="section2FinalGrid">
            <h2 className="section2GridTitle">The Stereotype Content Model</h2>
            <p className="section2GridSubtitle">
              Social Psychology defines all human judgment by these two axes. You need to maximize both.
            </p>
            <div className="section2GridContainer">
              <div className="section2Grid">
                {/* High Competence, Low Warmth - Threat */}
                <div className="section2GridQuadrant section2QuadrantThreat">
                  <div className="section2QuadrantLabel">Envy/Threat</div>
                  <div className="section2QuadrantContent">
                    <div className="section2QuadrantPhoto">{ASSESSMENT_TESTS[1].image}</div>
                    <div className="section2QuadrantDesc">Respected but not trusted</div>
                    <div className="section2QuadrantExample">Example: The cold corporate executive</div>
                  </div>
                </div>

                {/* High Competence, High Warmth - Admiration */}
                <div className="section2GridQuadrant section2QuadrantAdmiration">
                  <div className="section2QuadrantLabel">Admiration</div>
                  <div className="section2QuadrantContent">
                    <div className="section2QuadrantPhoto">{ASSESSMENT_TESTS[2].image}</div>
                    <div className="section2QuadrantDesc">The goal</div>
                    <div className="section2QuadrantExample">Example: Oprah Winfrey, Tom Hanks, a beloved CEO</div>
                  </div>
                </div>

                {/* Low Competence, Low Warmth - Contempt */}
                <div className="section2GridQuadrant section2QuadrantContempt">
                  <div className="section2QuadrantLabel">Contempt</div>
                  <div className="section2QuadrantContent">
                    <div className="section2QuadrantDesc">Rejected and dismissed</div>
                    <div className="section2QuadrantExample">Example: Someone who is rude and bad at their job</div>
                  </div>
                </div>

                {/* Low Competence, High Warmth - Pity */}
                <div className="section2GridQuadrant section2QuadrantPity">
                  <div className="section2QuadrantLabel">Pity</div>
                  <div className="section2QuadrantContent">
                    <div className="section2QuadrantPhoto">{ASSESSMENT_TESTS[0].image}</div>
                    <div className="section2QuadrantDesc">Liked but ignored</div>
                    <div className="section2QuadrantExample">Example: The sweet but disorganized intern</div>
                  </div>
                </div>

                {/* Axes Labels */}
                <div className="section2AxisY">
                  <span>High Competence</span>
                  <span>Low Competence</span>
                </div>
                <div className="section2AxisX">
                  <span>Low Warmth</span>
                  <span>High Warmth</span>
                </div>
              </div>
            </div>
            <button 
              className="section2CompleteBtn"
              onClick={handleComplete}
            >
              Continue to Baseline Lab →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

