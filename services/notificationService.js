import 'dotenv/config';
import logger from './logger.js';

const webhookUrl = process.env.MONITORING_WEBHOOK_URL || null;

const postWebhook = async (payload) => {
  if (!webhookUrl || typeof fetch !== 'function') {
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    logger.warn({ error: err.message || err }, '[NotificationService] Failed to send monitoring webhook');
  }
};

export const notifyAnalysisGate = async (reason, details = {}) => {
  await postWebhook({
    type: 'analysis_gate',
    reason,
    details,
    timestamp: new Date().toISOString()
  });
};

export const notifyJourneyEnrollment = async ({ clerkUserId, journey, templateId }) => {
  if (!journey) return;
  await postWebhook({
    type: 'journey_enrolled',
    clerkUserId,
    templateId: templateId || journey.template_id,
    focus: journey.focus_slug,
    commitment: journey.commitment_level,
    practiceCommitment: journey.practice_commitment,
    createdAt: journey.created_at || new Date().toISOString()
  });
};

export const notifyAnalysisStored = async ({ clerkUserId, analysisId, metricsVersion, aiModelVersion }) => {
  await postWebhook({
    type: 'analysis_saved',
    clerkUserId,
    analysisId,
    metricsVersion,
    aiModelVersion,
    timestamp: new Date().toISOString()
  });
};

