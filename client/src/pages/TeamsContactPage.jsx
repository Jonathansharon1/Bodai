import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TeamsContactPage.css';

const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function TeamsContactPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '1-5',
    useCase: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.name) {
      setError(t('teams.errorRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/contact/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        throw new Error(t('teams.errorGeneric'));
      }

      setSubmitted(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit teams contact form:', err);
      setError(err.message || t('teams.errorFallback'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="teamsPage">
        <div className="teamsPage__container">
          <h1 className="teamsPage__title">{t('teams.successTitle')}</h1>
          <p className="teamsPage__subtitle">
            {t('teams.successSubtitle')}
          </p>
          <button
            type="button"
            className="teamsPage__button"
            onClick={() => navigate('/dashboard')}
          >
            {t('teams.backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teamsPage">
      <div className="teamsPage__container">
        <h1 className="teamsPage__title">{t('teams.title')}</h1>
        <p className="teamsPage__subtitle">
          {t('teams.subtitle')}
        </p>

        <form className="teamsPage__form" onSubmit={handleSubmit}>
          <div className="teamsPage__fieldRow">
            <div className="teamsPage__field">
              <label htmlFor="name">{t('teams.nameLabel')}</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder={t('teams.namePlaceholder')}
                required
              />
            </div>
            <div className="teamsPage__field">
              <label htmlFor="email">{t('teams.emailLabel')}</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t('teams.emailPlaceholder')}
                required
              />
            </div>
          </div>

          <div className="teamsPage__fieldRow">
            <div className="teamsPage__field">
              <label htmlFor="company">{t('teams.companyLabel')}</label>
              <input
                id="company"
                name="company"
                type="text"
                value={form.company}
                onChange={handleChange}
                placeholder={t('teams.companyPlaceholder')}
              />
            </div>
            <div className="teamsPage__field">
              <label htmlFor="teamSize">{t('teams.teamSizeLabel')}</label>
              <select
                id="teamSize"
                name="teamSize"
                value={form.teamSize}
                onChange={handleChange}
              >
                <option value="1-5">1–5</option>
                <option value="6-20">6–20</option>
                <option value="21-50">21–50</option>
                <option value="51+">51+</option>
              </select>
            </div>
          </div>

          <div className="teamsPage__field">
            <label htmlFor="useCase">{t('teams.useCaseLabel')}</label>
            <input
              id="useCase"
              name="useCase"
              type="text"
              value={form.useCase}
              onChange={handleChange}
              placeholder={t('teams.useCasePlaceholder')}
            />
          </div>

          <div className="teamsPage__field">
            <label htmlFor="message">{t('teams.messageLabel')}</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              placeholder={t('teams.messagePlaceholder')}
            />
          </div>

          {error && <p className="teamsPage__error">{error}</p>}

          <div className="teamsPage__actions">
            <button
              type="submit"
              className="teamsPage__button"
              disabled={submitting}
            >
              {submitting ? t('teams.submitting') : t('teams.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


