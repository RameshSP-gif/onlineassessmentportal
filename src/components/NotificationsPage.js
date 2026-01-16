import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import Layout from './Layout';

function NotificationsPage() {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({ title: '', message: '', target: 'all' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/admin/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/notifications', formData);
      alert('Notification sent successfully');
      setFormData({ title: '', message: '', target: 'all' });
    } catch (error) {
      alert('Failed to send notification');
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
      <div style={styles.header}>
        <h1>Send Notifications</h1>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
          Back
        </button>
      </div>

      <form onSubmit={sendNotification} style={styles.form}>
        <h2>Create Notification</h2>
        
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          style={styles.input}
          required
        />

        <textarea
          placeholder="Message"
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          style={styles.textarea}
          required
        />

        <select
          value={formData.target}
          onChange={(e) => setFormData({...formData, target: e.target.value})}
          style={styles.input}
        >
          <option value="all">All Users</option>
          <option value="students">All Students</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.username} ({s.email})</option>
          ))}
        </select>

        <button type="submit" style={styles.submitBtn}>Send Notification</button>
      </form>

      <div style={styles.info}>
        <h3>ℹ️ Notification Guidelines</h3>
        <ul>
          <li>Notifications are delivered instantly to selected recipients</li>
          <li>Students can view notifications on their dashboard</li>
          <li>Use clear and concise messages</li>
          <li>Include important dates and deadlines</li>
        </ul>
      </div>
      </div>
    </Layout>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  backBtn: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  form: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' },
  textarea: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '120px', fontSize: '14px' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  info: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
};

export default NotificationsPage;
