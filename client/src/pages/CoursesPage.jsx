import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, CalendarClock, ShieldCheck } from 'lucide-react';
import './CoursesPage.css';

export default function CoursesPage() {
  const { t } = useTranslation();

  const roadmapItems = [
    {
      title: t('courses.roadmapTitle1'),
      description: t('courses.roadmapDesc1')
    },
    {
      title: t('courses.roadmapTitle2'),
      description: t('courses.roadmapDesc2')
    },
    {
      title: t('courses.roadmapTitle3'),
      description: t('courses.roadmapDesc3')
    }
  ];

  return (
    <div className="coursesPage">
      <div className="coursesPageHeader">
        <div className="comingSoonBadge">{t('courses.badge')}</div>
        <h1 className="coursesPageTitle">{t('courses.title')}</h1>
        <p className="coursesPageSubtitle">
          {t('courses.subtitle')}
        </p>
      </div>

      <div className="comingSoonCard">
        <div className="comingSoonIntro">
          <div className="comingSoonIcon">
            <Sparkles size={28} />
          </div>
          <div>
            <h2>{t('courses.whyWaitTitle')}</h2>
            <p>
              {t('courses.whyWaitBody')}
            </p>
          </div>
        </div>

        <ul className="comingSoonList">
          {roadmapItems.map((item) => (
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
            <span>{t('courses.launchWindow')}</span>
          </div>
          <div className="comingSoonMetaItem">
            <Sparkles size={18} />
            <span>{t('courses.focusForNow')}</span>
          </div>
        </div>

        <div className="comingSoonFooter">
          <div>
            <p className="comingSoonFooterTitle">{t('courses.wantAccessTitle')}</p>
            <p className="comingSoonFooterSubtitle">
              {t('courses.wantAccessSubtitle')}
            </p>
          </div>
          <button type="button" className="comingSoonButton" disabled>
            {t('courses.waitlistButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
