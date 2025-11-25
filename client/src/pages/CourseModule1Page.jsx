import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Section1BiologyOfJudgment from '../components/course/Section1BiologyOfJudgment';
import Section1AdditionalContent from '../components/course/Section1AdditionalContent';
import Section2AssessmentLab from '../components/course/Section2AssessmentLab';
import Section3BaselineLab from '../components/course/Section3BaselineLab';
import './CourseModule1Page.css';

export default function CourseModule1Page() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(1);
  const [section2Completed, setSection2Completed] = useState(false);

  const handleSection2Complete = () => {
    setSection2Completed(true);
    setCurrentSection(3);
    // Smooth scroll to section 3
    setTimeout(() => {
      document.getElementById('section-3')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="courseModule1Page">
      {/* Header */}
      <header className="courseModule1Header">
        <button 
          className="courseModule1BackBtn"
          onClick={() => navigate('/courses')}
          aria-label="Back to courses"
        >
          <ArrowLeft size={20} />
          <span>Back to Courses</span>
        </button>
        <div className="courseModule1HeaderInfo">
          <h1 className="courseModule1Title">First Impression Mastery</h1>
          <p className="courseModule1Subtitle">Module 1: The Neuroscience of Judgment</p>
        </div>
      </header>

      {/* Section 1: Biology of Judgment */}
      <Section1BiologyOfJudgment 
        onComplete={() => {
          setTimeout(() => {
            document.getElementById('section-1-additional')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Section 1 Additional: Hierarchy of Signals */}
      <div id="section-1-additional">
        <Section1AdditionalContent 
          onComplete={() => {
            setCurrentSection(2);
            setTimeout(() => {
              document.getElementById('section-2')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      </div>

      {/* Section 2: Assessment Lab */}
      <div id="section-2">
        <Section2AssessmentLab onComplete={handleSection2Complete} />
      </div>

      {/* Section 3: Baseline Lab */}
      <div id="section-3">
        <Section3BaselineLab />
      </div>
    </div>
  );
}

