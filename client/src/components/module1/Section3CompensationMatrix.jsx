import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import './Section3CompensationMatrix.css';

export default function Section3CompensationMatrix() {
  const [competence, setCompetence] = useState(5);

  // Calculate warmth based on compensation effect
  // As competence increases, warmth decreases (inverse relationship)
  const warmth = useMemo(() => {
    // Compensation curve: warmth = 10 - (competence - 5)^2 / 2.5
    const diff = competence - 5;
    return Math.max(0, Math.min(10, 10 - (diff * diff) / 2.5));
  }, [competence]);

  // Generate data points for the graph
  const chartData = useMemo(() => {
    const points = [];
    for (let c = 0; c <= 10; c += 0.5) {
      const diff = c - 5;
      const w = Math.max(0, Math.min(10, 10 - (diff * diff) / 2.5));
      points.push({
        competence: c.toFixed(1),
        warmth: Number(w.toFixed(1)),
        current: Math.abs(c - competence) < 0.3
      });
    }
    return points;
  }, [competence]);

  return (
    <motion.section
      className="section3CompensationMatrix"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="section3Container">
        <motion.h2
          className="section3Title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          The Compensation Matrix
        </motion.h2>

        <div className="section3Content">
          {/* Main Graph Area */}
          <div className="section3GraphArea">
            <div className="section3GraphContainer">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(229, 229, 229, 0.1)" />
                  <XAxis
                    dataKey="competence"
                    stroke="#e5e5e5"
                    tick={{ fill: '#e5e5e5', fontSize: 12, fontFamily: 'Courier New, monospace' }}
                    label={{ value: 'Projected Competence', position: 'insideBottom', offset: -10, style: { fill: '#e5e5e5', fontFamily: 'Inter, sans-serif' } }}
                  />
                  <YAxis
                    stroke="#e5e5e5"
                    domain={[0, 10]}
                    tick={{ fill: '#e5e5e5', fontSize: 12, fontFamily: 'Courier New, monospace' }}
                    label={{ value: 'Projected Warmth', angle: -90, position: 'insideLeft', style: { fill: '#e5e5e5', fontFamily: 'Inter, sans-serif' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid rgba(229, 229, 229, 0.2)',
                      borderRadius: '6px',
                      color: '#e5e5e5',
                      fontFamily: 'Courier New, monospace'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="warmth"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                  {/* Highlight current point */}
                  {chartData
                    .filter(d => d.current)
                    .map((point, index) => (
                      <Line
                        key={index}
                        type="monotone"
                        dataKey="warmth"
                        data={[point]}
                        stroke="#ef4444"
                        strokeWidth={4}
                        dot={{ r: 8, fill: '#ef4444' }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Slider */}
            <div className="section3SliderContainer">
              <label className="section3SliderLabel">
                Projected Competence: <span className="section3SliderValue">{competence.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={competence}
                onChange={(e) => setCompetence(parseFloat(e.target.value))}
                className="section3Slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(competence / 10) * 100}%, rgba(229, 229, 229, 0.2) ${(competence / 10) * 100}%, rgba(229, 229, 229, 0.2) 100%)`
                }}
              />
              <div className="section3SliderLabels">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Current Values Display */}
            <div className="section3CurrentValues">
              <div className="section3ValueCard" style={{ borderColor: '#3b82f6' }}>
                <div className="section3ValueLabel">Competence</div>
                <div className="section3ValueNumber" style={{ color: '#3b82f6' }}>
                  {competence.toFixed(1)}
                </div>
              </div>
              <div className="section3ValueCard" style={{ borderColor: '#10b981' }}>
                <div className="section3ValueLabel">Warmth</div>
                <div className="section3ValueNumber" style={{ color: '#10b981' }}>
                  {warmth.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Text Overlay */}
          <motion.div
            className="section3TextOverlay"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="section3MainText">
              The Compensation Effect: The brain struggles to see high Warmth and high Competence simultaneously. 
              You must manually engineer the balance.
            </p>
          </motion.div>
        </div>

        {/* Sidebar: Gender Double Bind */}
        <motion.div
          className="section3Sidebar"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="section3SidebarTitle">The Gender Double Bind</h3>
          <p className="section3SidebarText">
            Research shows this penalty is higher for female leaders. Women face a unique challenge: 
            displaying high competence can reduce perceived warmth, while showing warmth can undermine 
            perceived competence. This creates a "double bind" where women are penalized regardless of 
            their approach. The solution requires strategic signal management—knowing when to emphasize 
            warmth vs. competence based on context and audience.
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}


