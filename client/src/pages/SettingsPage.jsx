import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Mail, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import './SettingsPage.css';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SettingsPage() {
  const { user } = useUser();
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    if (!user?.id) return;
    
    const loadPreferences = async () => {
      try {
        const res = await fetch(`${apiBase}/api/user/email-preferences`, {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setEmailNotifications(data.preferences.email_notifications_enabled !== false);
            setEmailMarketing(data.preferences.email_marketing_enabled !== false);
          }
        }
      } catch (err) {
        console.error('Failed to load email preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, [user?.id, apiBase]);

  const handleSave = async () => {
    if (!user?.id || saving) return;
    
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const res = await fetch(`${apiBase}/api/user/email-preferences`, {
        method: 'PUT',
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_notifications_enabled: emailNotifications,
          email_marketing_enabled: emailMarketing
        })
      });
      
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (err) {
      console.error('Failed to save email preferences:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settingsPage">
        <LoadingSpinner message="Loading your preferences..." size="large" />
      </div>
    );
  }

  return (
    <div className="settingsPage">
      <div className="settingsPage__header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="settingsPage__section" id="email-preferences">
        <div className="settingsPage__sectionHeader">
          <Mail size={20} />
          <h2>Email Preferences</h2>
        </div>
        
        <div className="settingsPage__preferences">
          <div className="settingsPage__preference">
            <div className="settingsPage__preferenceInfo">
              <h3>Email Notifications</h3>
              <p>Receive emails about your analyses, progress updates, and important account information.</p>
            </div>
            <label className="settingsPage__toggle">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <span className="settingsPage__toggleSlider"></span>
            </label>
          </div>

          <div className="settingsPage__preference">
            <div className="settingsPage__preferenceInfo">
              <h3>Marketing Emails</h3>
              <p>Receive tips, feature updates, and promotional content to help you improve faster.</p>
            </div>
            <label className="settingsPage__toggle">
              <input
                type="checkbox"
                checked={emailMarketing}
                onChange={(e) => setEmailMarketing(e.target.checked)}
              />
              <span className="settingsPage__toggleSlider"></span>
            </label>
          </div>
        </div>

        <div className="settingsPage__actions">
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
          
          {saveStatus === 'success' && (
            <div className="settingsPage__status settingsPage__status--success">
              <CheckCircle2 size={16} />
              <span>Preferences saved successfully!</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="settingsPage__status settingsPage__status--error">
              <AlertCircle size={16} />
              <span>Failed to save preferences. Please try again.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

