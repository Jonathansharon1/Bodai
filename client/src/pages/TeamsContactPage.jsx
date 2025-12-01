import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeamsContactPage.css';

const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function TeamsContactPage() {
  const navigate = useNavigate();
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
      setError('Please add your name and work email so we can contact you.');
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
        throw new Error('Failed to send your request. Please try again.');
      }

      setSubmitted(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit teams contact form:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="teamsPage">
        <div className="teamsPage__container">
          <h1 className="teamsPage__title">Thanks for reaching out</h1>
          <p className="teamsPage__subtitle">
            We received your message and will get back to you within one business day.
          </p>
          <button
            type="button"
            className="teamsPage__button"
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teamsPage">
      <div className="teamsPage__container">
        <h1 className="teamsPage__title">Talk to us about Teams & Enterprise</h1>
        <p className="teamsPage__subtitle">
          Tell us a bit about your team and how you’d like to use BodAI. We’ll follow up with
          pricing and next steps.
        </p>

        <form className="teamsPage__form" onSubmit={handleSubmit}>
          <div className="teamsPage__fieldRow">
            <div className="teamsPage__field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="teamsPage__field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
              />
            </div>
          </div>

          <div className="teamsPage__fieldRow">
            <div className="teamsPage__field">
              <label htmlFor="company">Company / organization</label>
              <input
                id="company"
                name="company"
                type="text"
                value={form.company}
                onChange={handleChange}
                placeholder="Company name"
              />
            </div>
            <div className="teamsPage__field">
              <label htmlFor="teamSize">Team size</label>
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
            <label htmlFor="useCase">Primary use case</label>
            <input
              id="useCase"
              name="useCase"
              type="text"
              value={form.useCase}
              onChange={handleChange}
              placeholder="e.g., interview training, content review, internal workshops"
            />
          </div>

          <div className="teamsPage__field">
            <label htmlFor="message">Anything else we should know?</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              placeholder="Share a bit more about your goals, timeline, and success criteria."
            />
          </div>

          {error && <p className="teamsPage__error">{error}</p>}

          <div className="teamsPage__actions">
            <button
              type="submit"
              className="teamsPage__button"
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


