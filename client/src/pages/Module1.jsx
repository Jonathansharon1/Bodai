import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Section1BiologyScroll from '../components/module1/Section1BiologyScroll';
import Section2SignalDossier from '../components/module1/Section2SignalDossier';
import Section3CompensationMatrix from '../components/module1/Section3CompensationMatrix';
import Section4StereotypeLab from '../components/module1/Section4StereotypeLab';
import Section5BaselineAssessment from '../components/module1/Section5BaselineAssessment';
import './Module1.css';

export default function Module1() {
  const navigate = useNavigate();

  return (
    <div className="module1">
      {/* Header */}
      <header className="module1Header">
        <button 
          className="module1BackBtn"
          onClick={() => navigate('/courses')}
          aria-label="Back to courses"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="module1HeaderInfo">
          <h1 className="module1Title">Module 1: The Biology of Signal</h1>
          <p className="module1Subtitle">Executive Presence Training</p>
        </div>
      </header>

      {/* Section 1: The Biology Scroll */}
      <Section1BiologyScroll />

      {/* Section 2: The Signal Dossier */}
      <Section2SignalDossier />

      {/* Section 3: The Compensation Matrix */}
      <Section3CompensationMatrix />

      {/* Section 4: The Stereotype Lab */}
      <Section4StereotypeLab />

      {/* Section 5: The Baseline Assessment */}
      <Section5BaselineAssessment />
    </div>
  );
}


