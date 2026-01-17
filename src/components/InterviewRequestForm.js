import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './InterviewRequestForm.css';

function InterviewRequestForm() {
  const [formData, setFormData] = useState({
    interviewType: 'human',
    interviewMode: 'online',
    specialization: '',
    preferredLanguage: 'English',
    additionalNotes: '',
    proposedDates: [
      { date: '', timeSlot: '', isAvailable: true },
      { date: '', timeSlot: '', isAvailable: true },
      { date: '', timeSlot: '', isAvailable: true }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM'
  ];

  const specializations = [
    'MERN Stack',
    'Java Full Stack',
    'Python Full Stack',
    'DevOps',
    'Cloud Computing',
    'Testing',
    'Data Science',
    'Mobile Development',
    'UI/UX Design'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear interview mode if AI is selected
    if (name === 'interviewType' && value === 'ai') {
      setFormData(prev => ({ ...prev, interviewMode: 'n/a' }));
    }
  };

  const handleDateChange = (index, field, value) => {
    const newDates = [...formData.proposedDates];
    newDates[index] = { ...newDates[index], [field]: value };
    setFormData(prev => ({ ...prev, proposedDates: newDates }));
  };

  const addMoreDate = () => {
    setFormData(prev => ({
      ...prev,
      proposedDates: [...prev.proposedDates, { date: '', timeSlot: '', isAvailable: true }]
    }));
  };

  const removeDate = (index) => {
    if (formData.proposedDates.length > 1) {
      const newDates = formData.proposedDates.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, proposedDates: newDates }));
    }
  };

  const validateForm = () => {
    if (!formData.specialization) {
      setError('Please select a specialization');
      return false;
    }

    const validDates = formData.proposedDates.filter(d => d.date && d.timeSlot);
    if (validDates.length === 0) {
      setError('Please provide at least one proposed date and time');
      return false;
    }

    // Check if dates are in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const dateSlot of validDates) {
      const proposedDate = new Date(dateSlot.date);
      proposedDate.setHours(0, 0, 0, 0);
      
      if (proposedDate < today) {
        setError('Proposed dates must be in the future');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const validProposedDates = formData.proposedDates
        .filter(d => d.date && d.timeSlot)
        .map(d => ({
          date: new Date(d.date).toISOString(),
          timeSlot: d.timeSlot,
          isAvailable: true
        }));

      const requestData = {
        studentId: user.id,
        studentName: user.username,
        studentEmail: user.email,
        interviewType: formData.interviewType,
        interviewMode: formData.interviewMode,
        specialization: formData.specialization,
        proposedDates: validProposedDates,
        preferredLanguage: formData.preferredLanguage,
        additionalNotes: formData.additionalNotes
      };

      await api.post('/interview-request', requestData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/interview-requests');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div className="interview-request-container">
        <div className="success-box">
          <div className="success-icon">✅</div>
          <h2>Interview Request Submitted!</h2>
          <p>Your interview request has been successfully submitted to HR.</p>
          <p>You will be notified once it's reviewed and approved.</p>
          <div className="success-animation"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-request-container">
      <div className="request-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Schedule Your Interview</h1>
        <p className="subtitle">Choose your interview preference and propose convenient dates</p>
      </div>

      <form onSubmit={handleSubmit} className="interview-request-form">
        {error && <div className="error-banner">{error}</div>}

        {/* Interview Type Selection */}
        <div className="form-section interview-type-section">
          <h3>Select Interview Type</h3>
          <div className="interview-type-cards">
            <div 
              className={`type-card ${formData.interviewType === 'human' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, interviewType: 'human', interviewMode: 'online' }))}
            >
              <div className="type-icon">👨‍💼</div>
              <h4>Interview with Human Expert</h4>
              <p>One-on-one interview with experienced professional interviewer</p>
              <ul className="type-features">
                <li>✓ Personalized feedback</li>
                <li>✓ Real conversation flow</li>
                <li>✓ Industry insights</li>
                <li>✓ F2F or Online option</li>
              </ul>
            </div>

            <div 
              className={`type-card ${formData.interviewType === 'ai' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, interviewType: 'ai', interviewMode: 'n/a' }))}
            >
              <div className="type-icon">🤖</div>
              <h4>Interview with Super AI</h4>
              <p>Advanced AI-powered interview with intelligent question adaptation</p>
              <ul className="type-features">
                <li>✓ Immediate availability</li>
                <li>✓ Adaptive questioning</li>
                <li>✓ Instant evaluation</li>
                <li>✓ 24/7 access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interview Mode (only for human interviews) */}
        {formData.interviewType === 'human' && (
          <div className="form-section">
            <h3>Interview Mode</h3>
            <div className="mode-selection">
              <label className={`mode-option ${formData.interviewMode === 'online' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="interviewMode"
                  value="online"
                  checked={formData.interviewMode === 'online'}
                  onChange={handleChange}
                />
                <div className="mode-content">
                  <span className="mode-icon">💻</span>
                  <div>
                    <strong>Online</strong>
                    <p>Video call via meeting link</p>
                  </div>
                </div>
              </label>

              <label className={`mode-option ${formData.interviewMode === 'f2f' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="interviewMode"
                  value="f2f"
                  checked={formData.interviewMode === 'f2f'}
                  onChange={handleChange}
                />
                <div className="mode-content">
                  <span className="mode-icon">🏢</span>
                  <div>
                    <strong>Face-to-Face</strong>
                    <p>In-person at office location</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Specialization */}
        <div className="form-section">
          <h3>Specialization *</h3>
          <select
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Select your specialization</option>
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        {/* Proposed Dates */}
        <div className="form-section">
          <h3>Propose Interview Dates & Times *</h3>
          <p className="section-hint">Provide multiple options to increase approval chances</p>
          
          {formData.proposedDates.map((dateSlot, index) => (
            <div key={index} className="date-slot">
              <div className="date-slot-number">{index + 1}</div>
              <div className="date-slot-inputs">
                <div className="input-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={dateSlot.date}
                    onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                    min={getMinDate()}
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>Time Slot</label>
                  <select
                    value={dateSlot.timeSlot}
                    onChange={(e) => handleDateChange(index, 'timeSlot', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formData.proposedDates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDate(index)}
                  className="btn-remove-date"
                  title="Remove this date option"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addMoreDate}
            className="btn-add-date"
          >
            + Add Another Date Option
          </button>
        </div>

        {/* Preferred Language */}
        <div className="form-section">
          <h3>Preferred Language</h3>
          <select
            name="preferredLanguage"
            value={formData.preferredLanguage}
            onChange={handleChange}
            className="form-select"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Chinese">Chinese</option>
          </select>
        </div>

        {/* Additional Notes */}
        <div className="form-section">
          <h3>Additional Notes (Optional)</h3>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            rows="4"
            placeholder="Any special requirements or information you'd like to share..."
            className="form-textarea"
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              <>
                📤 Submit Interview Request
              </>
            )}
          </button>
          <p className="form-note">
            Your request will be reviewed by HR and you'll be notified via email
          </p>
        </div>
      </form>
    </div>
  );
}

export default InterviewRequestForm;
