import React from 'react';
import { Rocket, ChevronRight } from 'lucide-react';
import './NextStepsPreview.css';

export default function NextStepsPreview({ actionItems, onViewAll }) {
  if (!actionItems || actionItems.length === 0) return null;

  // Show only first 2-3 action items
  const previewItems = actionItems.slice(0, 3);
  const hasMore = actionItems.length > previewItems.length;

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
        {hasMore && onViewAll && (
          <button className="nextStepsPreview__viewAll" onClick={onViewAll}>
            View All
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className="nextStepsPreview__list">
        {previewItems.map((item, index) => {
          const actionTitle = typeof item === 'string' ? item : item.title;
          const actionDetails = typeof item === 'object' ? (item.details || []) : [];
          
          return (
            <div key={index} className="nextStepsPreview__item">
              <div className="nextStepsPreview__itemNumber">{index + 1}</div>
              <div className="nextStepsPreview__itemContent">
                <div className="nextStepsPreview__itemTitle">{actionTitle}</div>
                {actionDetails.length > 0 && (
                  <div className="nextStepsPreview__itemDetails">
                    {actionDetails.slice(0, 1).map((detail, detailIndex) => (
                      <div key={detailIndex} className="nextStepsPreview__itemDetail">
                        {detail}
                      </div>
                    ))}
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

