import React from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, ChevronRight, Activity } from 'lucide-react';
import './NextStepsPreview.css';

export default function NextStepsPreview({ actionItems, onViewAll, onChoosePractice }) {
  const { t } = useTranslation();
  if (!actionItems || actionItems.length === 0) return null;

  // Show only first 2-3 action items
  const previewItems = actionItems.slice(0, 3);
  const hasMore = actionItems.length > previewItems.length;

  const getInstantTip = (item) => {
    if (!item) return t('analysisResult.instantTipFallback');
    
    // Priority 1: Explicit instantTip field
    if (item.instantTip) return item.instantTip;
    
    // Priority 2: String item
    if (typeof item === 'string') {
      return item;
    }
    
    // Priority 3: Array of details (from parsed tips)
    if (Array.isArray(item.details) && item.details.length > 0) {
      // Prefer first detail (usually whatToPractice)
      return item.details[0];
    }
    
    // Priority 4: Object details with structured fields
    if (item.details && typeof item.details === 'object') {
      // Try structured fields first
      if (item.details.what_to_do) return item.details.what_to_do;
      if (item.details.why_it_matters) return item.details.why_it_matters;
      if (Array.isArray(item.details.all_details) && item.details.all_details.length > 0) {
        return item.details.all_details[0];
      }
    }
    
    // Priority 5: Direct fields on item (from parseTipItems)
    if (item.whatToPractice) return item.whatToPractice;
    if (item.whyItMatters) return item.whyItMatters;
    
    // Priority 6: Title as fallback (better than generic message)
    if (item.title && item.title.length > 10) {
      return item.title;
    }
    
    // Last resort: Generic fallback
    return t('analysisResult.instantTipFallback');
  };

  const getPracticePrompt = (item) => {
    if (!item) return null;
    if (item.practicePrompt) return item.practicePrompt;
    if (item.practice_prompt_title || item.practice_prompt_description) {
      return {
        title: item.practice_prompt_title,
        description: item.practice_prompt_description,
        setup: item.practice_prompt_setup,
        whatToNotice: item.practice_prompt_notice,
        recordingTip: item.practice_prompt_tip,
        targetMetric: item.practice_prompt_target_metric,
        difficulty: item.practice_prompt_difficulty,
        estimatedTime: item.practice_prompt_time,
        actionItemId: item.id
      };
    }
    return null;
  };

  return (
    <div className="nextStepsPreview">
      <div className="nextStepsPreview__header">
        <div className="nextStepsPreview__headerLeft">
          <div className="nextStepsPreview__icon">
            <Rocket size={24} />
          </div>
          <div>
            <h3 className="nextStepsPreview__title">{t('analysisPage.startHereTitle')}</h3>
            <p className="nextStepsPreview__subtitle">{t('analysisPage.startHereSubtitle')}</p>
          </div>
        </div>
      </div>

      <div className="nextStepsPreview__list">
        {previewItems.map((item, index) => {
          const actionTitle = typeof item === 'string' ? item : item.title;
          const instantTip = getInstantTip(item);
          const practicePrompt = getPracticePrompt(item);
          return (
            <div key={index} className="nextStepsPreview__item">
              <div className="nextStepsPreview__itemAccent" />
              <div className="nextStepsPreview__itemBody">
                <div className="nextStepsPreview__itemMeta">
                  <span className="nextStepsPreview__badge">
                    {t('analysisPage.focusBadge', { index: index + 1 })}
                  </span>
                </div>
                <div className="nextStepsPreview__itemTitle">{actionTitle}</div>
                <div className="nextStepsPreview__instantLabel">
                  {t('analysisPage.instantTipLabel')}
                </div>
                <p className="nextStepsPreview__itemDescription">{instantTip}</p>
                {practicePrompt && onChoosePractice && (
                  <div className="nextStepsPreview__practice">
                    <div className="nextStepsPreview__practiceHeader">
                      <Activity size={14} />
                      <span>{t('analysisPage.optionalPracticeDrill')}</span>
                    </div>
                    <p className="nextStepsPreview__practiceSummary">
                      {practicePrompt.description || t('analysisPage.optionalPracticeDefault')}
                    </p>
                    <button
                      type="button"
                      className="nextStepsPreview__practiceButton"
                      onClick={() => onChoosePractice(practicePrompt)}
                    >
                      {t('analysisPage.optionalPracticeCta')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="nextStepsPreview__footer">
          <button className="nextStepsPreview__footerButton" onClick={onViewAll}>
            {t('analysisPage.viewAllActionItems', { count: actionItems.length })}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}




