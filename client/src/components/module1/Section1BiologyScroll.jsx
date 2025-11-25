import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './Section1BiologyScroll.css';

export default function Section1BiologyScroll() {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const containerTop = rect.top;
      const containerHeight = rect.height;

      const progress = Math.max(0, Math.min(1, -containerTop / (containerHeight - windowHeight)));
      setScrollProgress(progress);

      // Determine current scene
      if (progress < 0.33) {
        setCurrentScene(0);
      } else if (progress < 0.66) {
        setCurrentScene(1);
      } else {
        setCurrentScene(2);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Timer animation for Scene 2
  const timerValue = currentScene >= 1 ? Math.min(0.1, (scrollProgress - 0.33) * 0.3) : 0;

  return (
    <motion.section
      ref={containerRef}
      className="section1BiologyScroll"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      {/* Sticky Container */}
      <div className="section1StickyContainer">
        {/* Scene 1: The Hook */}
        <div className={`section1Scene ${currentScene === 0 ? 'active' : ''}`}>
          <div className="section1Background section1BackgroundEye">
            <div className="section1BackgroundOverlay"></div>
          </div>
          <div className="section1TextContent">
            <motion.h2
              className="section1MainText"
              initial={{ opacity: 0, y: 20 }}
              animate={currentScene === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              You do not control your reputation.
            </motion.h2>
            <motion.h2
              className="section1MainText section1MainTextAccent"
              initial={{ opacity: 0, y: 20 }}
              animate={currentScene === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your amygdala does.
            </motion.h2>
          </div>
        </div>

        {/* Scene 2: The Timer */}
        <div className={`section1Scene ${currentScene === 1 ? 'active' : ''}`}>
          <div className="section1Background section1BackgroundTimer">
            <div className="section1TimerDisplay">
              <motion.div
                className="section1TimerValue"
                animate={currentScene === 1 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.1, repeat: Infinity }}
              >
                {timerValue.toFixed(3)}s
              </motion.div>
            </div>
            <div className="section1BackgroundOverlay"></div>
          </div>
          <div className="section1TextContent">
            <motion.h2
              className="section1MainText"
              initial={{ opacity: 0 }}
              animate={currentScene === 1 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              The 100-Millisecond Rule.
            </motion.h2>
            <motion.p
              className="section1Subtext"
              initial={{ opacity: 0, y: 10 }}
              animate={currentScene === 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Judgment happens before you speak (Willis & Todorov, 2006).
            </motion.p>
          </div>
        </div>

        {/* Scene 3: The Filter */}
        <div className={`section1Scene ${currentScene === 2 ? 'active' : ''}`}>
          <div className="section1Background section1BackgroundFilter">
            <div className="section1Silhouette"></div>
            <motion.div
              className="section1FilterOverlay"
              initial={{ x: '-100%' }}
              animate={currentScene === 2 ? { x: 0 } : { x: '-100%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            ></motion.div>
            <div className="section1BackgroundOverlay"></div>
          </div>
          <div className="section1TextContent">
            <motion.h2
              className="section1MainText"
              initial={{ opacity: 0 }}
              animate={currentScene === 2 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              The Confirmation Bias Loop.
            </motion.h2>
            <motion.p
              className="section1Subtext"
              initial={{ opacity: 0, y: 10 }}
              animate={currentScene === 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              You have 7 seconds to shatter the filter.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Scroll Spacer */}
      <div className="section1Spacer" style={{ height: '300vh' }}></div>
    </motion.section>
  );
}


