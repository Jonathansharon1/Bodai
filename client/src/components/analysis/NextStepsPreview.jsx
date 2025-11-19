import React from 'react';
import { Rocket, ChevronRight, Activity } from 'lucide-react';
import './NextStepsPreview.css';

export default function NextStepsPreview({ actionItems, onViewAll, onChoosePractice }) {
  if (!actionItems || actionItems.length === 0) return null;

  // Show only first 2-3 action items
  const previewItems = actionItems.slice(0, 3);
  const hasMore = actionItems.length > previewItems.length;

  const getInstantTip = (item) => {
    if (!item) return '';
    if (item.instantTip) return item.instantTip;
    if (typeof item === 'string') {
      return item;
    }
    if (Array.isArray(item.details) && item.details.length > 0) {
      return item.details[0];
    }
    if (item.details && typeof item.details === 'object') {
      const detail =
        item.details.why_it_matters ||
        item.details.what_to_do ||
        (Array.isArray(item.details.all_details) ? item.details.all_details[0] : null);
      if (detail) {
        return detail;
      }
    }
    return 'Keep this focus top-of-mind during your next interaction.';
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
            <h3 className="nextStepsPreview__title">Start Here</h3>
            <p className="nextStepsPreview__subtitle">Your first steps to improvement</p>
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
                  <span className="nextStepsPreview__badge">Focus {index + 1}</span>
                </div>
                <div className="nextStepsPreview__itemTitle">{actionTitle}</div>
                <div className="nextStepsPreview__instantLabel">Instant Tip</div>
                <p className="nextStepsPreview__itemDescription">{instantTip}</p>
                {practicePrompt && onChoosePractice && (
                  <div className="nextStepsPreview__practice">
                    <div className="nextStepsPreview__practiceHeader">
                      <Activity size={14} />
                      <span>Optional practice drill</span>
                    </div>
                    <p className="nextStepsPreview__practiceSummary">
                      {practicePrompt.description || 'Ready to rehearse this focus?'}
                    </p>
                    <button
                      type="button"
                      className="nextStepsPreview__practiceButton"
                      onClick={() => onChoosePractice(practicePrompt)}
                    >
                      Try this micro-practice
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
            View All {actionItems.length} Action Items
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

