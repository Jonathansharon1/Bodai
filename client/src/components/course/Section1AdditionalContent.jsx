import React from 'react';
import './Section1AdditionalContent.css';

export default function Section1AdditionalContent({ onComplete }) {
  return (
    <section className="section1Additional">
      <div className="section1AdditionalContainer">
        <h2 className="section1AdditionalTitle">The Hierarchy of Signals</h2>
        <p className="section1AdditionalSubtitle">
          Information enters the brain through different bandwidths. Visual data is "high bandwidth" (instant). Verbal data is "low bandwidth" (requires processing).
        </p>

        <div className="section1Hierarchy">
          <div className="section1HierarchyItem">
            <div className="section1HierarchyNumber">55%</div>
            <div className="section1HierarchyContent">
              <h3 className="section1HierarchyTitle">Visual</h3>
              <p className="section1HierarchyDesc">Posture, grooming, micro-expressions, clothing</p>
              <p className="section1HierarchyProcessor">Processor: Occipital Lobe & Amygdala (Fastest)</p>
            </div>
          </div>

          <div className="section1HierarchyItem">
            <div className="section1HierarchyNumber">38%</div>
            <div className="section1HierarchyContent">
              <h3 className="section1HierarchyTitle">Vocal</h3>
              <p className="section1HierarchyDesc">Tone, resonance, pace, prosody</p>
              <p className="section1HierarchyProcessor">Processor: Auditory Cortex & Limbic System (Fast)</p>
            </div>
          </div>

          <div className="section1HierarchyItem">
            <div className="section1HierarchyNumber">7%</div>
            <div className="section1HierarchyContent">
              <h3 className="section1HierarchyTitle">Verbal</h3>
              <p className="section1HierarchyDesc">The actual words</p>
              <p className="section1HierarchyProcessor">Processor: Neocortex (Slowest)</p>
            </div>
          </div>
        </div>

        <div className="section1Note">
          <p className="section1NoteText">
            <strong>Note on Mehrabian's Rule:</strong> Albert Mehrabian's 7-38-55 rule specifically applies to incongruent communication 
            (when words and body language don't match). If you say "I am happy" (Verbal) with a scowl (Visual) and a flat voice (Vocal), 
            people believe the Visual/Vocal 93% of the time.
          </p>
        </div>

        <div className="section1WarmthFirst">
          <h3 className="section1WarmthFirstTitle">The "Warmth First" Principle</h3>
          <p className="section1WarmthFirstText">
            Research shows that <strong>Warmth is judged before Competence</strong>. From an evolutionary standpoint, it is more important 
            to know if a person wants to kill you (intent) than if they are strong enough to do it (ability).
          </p>
          <div className="section1WarmthFirstMistake">
            <p><strong>Mistake:</strong> Most professionals try to prove Competence first (listing credentials, looking serious). This often backfires, pushing them into the "Cold/Threat" zone.</p>
          </div>
          <div className="section1WarmthFirstSolution">
            <p><strong>Solution:</strong> Establish Warmth (safety) in the first 3 seconds, then pivot to Competence.</p>
          </div>
        </div>

        {onComplete && (
          <div className="section1AdditionalContinue">
            <button 
              className="section1AdditionalContinueBtn"
              onClick={onComplete}
            >
              Continue to Assessment Lab →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

