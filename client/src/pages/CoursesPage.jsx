import React from 'react';
import { Sparkles, CalendarClock, ShieldCheck } from 'lucide-react';
import './CoursesPage.css';

const ROADMAP_ITEMS = [
  {
    title: 'Module 1 · First Impression Mastery',
    description: 'Deep dives on warmth vs. competence, stereotype content model labs, and baseline assessments with AI feedback.',
  },
  {
    title: 'Module 2 · High-Stakes Storytelling',
    description: 'Frameworks for structuring persuasive narratives, anchor gestures, and handling fast pivots under pressure.',
  },
  {
    title: 'Module 3 · Executive Presence',
    description: 'Advanced drills on authority, emotional calibration, and boardroom-ready delivery.',
  },
];

export default function CoursesPage() {
  return (
    <div className="coursesPage">
      <div className="coursesPageHeader">
        <div className="comingSoonBadge">Coming Soon</div>
        <h1 className="coursesPageTitle">Guided Courses Are Almost Here</h1>
        <p className="coursesPageSubtitle">
          We’re putting final touches on the warm-up curriculum while the AI self-analysis system rolls out.
          You’ll get structured tracks, baseline labs, and coach-designed micro-practices the moment they’re ready.
        </p>
      </div>

      <div className="comingSoonCard">
        <div className="comingSoonIntro">
          <div className="comingSoonIcon">
            <Sparkles size={28} />
          </div>
          <div>
            <h2>Why wait?</h2>
            <p>
              Courses will layer on top of your current uploads. Ship your next video, build the habit,
              and you’ll slot into the new modules with real data already in your journal.
            </p>
          </div>
        </div>

        <ul className="comingSoonList">
          {ROADMAP_ITEMS.map((item) => (
            <li key={item.title} className="comingSoonItem">
              <ShieldCheck size={18} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="comingSoonMeta">
          <div className="comingSoonMetaItem">
            <CalendarClock size={18} />
            <span>Launch window: rolling releases over the next few weeks</span>
          </div>
          <div className="comingSoonMetaItem">
            <Sparkles size={18} />
            <span>Focus for now: keep uploading to train your personal baseline</span>
          </div>
        </div>

        <div className="comingSoonFooter">
          <div>
            <p className="comingSoonFooterTitle">Want first access?</p>
            <p className="comingSoonFooterSubtitle">
              We’ll notify active users inside the app before the public launch.
            </p>
          </div>
          <button type="button" className="comingSoonButton" disabled>
            Waitlist opens soon
          </button>
        </div>
      </div>
    </div>
  );
}
