import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import Layout from './Layout';

function FeeManagement() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ user_id: '', amount: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await axios.get('/admin/fees');
      setFees(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/admin/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addFee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/fees', formData);
      alert('Fee added');
      setShowForm(false);
      setFormData({ user_id: '', amount: '', description: '' });
      fetchFees();
    } catch (error) {
      alert('Failed to add fee');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/admin/fees/${id}`, { status });
      alert('Status updated');
      fetchFees();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
      <div style={styles.header}>
        <h1>Fee Management</h1>
        <div>
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
            {showForm ? 'Cancel' : '+ Add Fee'}
          </button>
          <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
            Back
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={addFee} style={styles.form}>
          <h2>Add New Fee</h2>
          
          <select
            value={formData.user_id}
            onChange={(e) => setFormData({...formData, user_id: e.target.value})}
            style={styles.input}
            required
          >
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.username} ({s.email})</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Amount (₹)"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            style={styles.input}
            required
          />

          <input
            type="text"
            placeholder="Description (e.g., Exam Fee, Course Fee)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.submitBtn}>Add Fee</button>
        </form>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fees.map(fee => (
            <tr key={fee.id}>
              <td>{fee.username}</td>
              <td>₹{fee.amount}</td>
              <td>{fee.description}</td>
              <td>
                <span style={{
                  ...styles.badge,
                  backgroundColor: fee.status === 'paid' ? '#28a745' : fee.status === 'pending' ? '#ffc107' : '#dc3545'
                }}>
                  {fee.status}
                </span>
              </td>
              <td>{new Date(fee.created_at).toLocaleDateString()}</td>
              <td>
                {fee.status !== 'paid' && (
                  <button onClick={() => updateStatus(fee.id, 'paid')} style={styles.paidBtn}>
                    Mark Paid
                  </button>
                )}
                {fee.status === 'pending' && (
                  <button onClick={() => updateStatus(fee.id, 'cancelled')} style={styles.cancelBtn}>
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.summary}>
        <h3>Summary</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Revenue</div>
            <div style={styles.summaryValue}>
              ₹{fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0)}
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Pending</div>
            <div style={styles.summaryValue}>
              ₹{fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)}
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  addBtn: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' },
  backBtn: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  form: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' },
  badge: { padding: '5px 10px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: 'bold' },
  paidBtn: { padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' },
  cancelBtn: { padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  summary: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '15px' },
  summaryCard: { padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' },
  summaryLabel: { fontSize: '14px', color: '#666', marginBottom: '5px' },
  summaryValue: { fontSize: '24px', fontWeight: 'bold', color: '#007bff' }
};

export default FeeManagement;
