import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import Layout from './Layout';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/admin/students');
      setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load students');
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await axios.delete(`/admin/students/${id}`);
      alert('Student deleted');
      fetchStudents();
    } catch (error) {
      alert('Failed to delete student');
    }
  };

  const updateStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/admin/students/${editingStudent.id}`, editingStudent);
      alert('Student updated');
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      alert('Failed to update student');
    }
  };

  if (loading) return <Layout><div style={styles.loading}>Loading...</div></Layout>;

  return (
    <Layout>
      <div style={styles.container}>
      <div style={styles.header}>
        <h1>Student Management</h1>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
          Back to Dashboard
        </button>
      </div>

      {editingStudent && (
        <div style={styles.modal}>
          <form onSubmit={updateStudent} style={styles.form}>
            <h2>Edit Student</h2>
            <input
              type="text"
              placeholder="Username"
              value={editingStudent.username}
              onChange={(e) => setEditingStudent({...editingStudent, username: e.target.value})}
              style={styles.input}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={editingStudent.email}
              onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
              style={styles.input}
              required
            />
            <select
              value={editingStudent.status || 'active'}
              onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value})}
              style={styles.input}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <div style={styles.btnGroup}>
              <button type="submit" style={styles.saveBtn}>Save</button>
              <button type="button" onClick={() => setEditingStudent(null)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Joined</th>
            <th>Submissions</th>
            <th>Total Paid</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td>{student.username}</td>
              <td>{student.email}</td>
              <td>{new Date(student.created_at).toLocaleDateString()}</td>
              <td>{student.totalSubmissions}</td>
              <td>₹{student.totalPaid}</td>
              <td>
                <span style={{
                  ...styles.badge,
                  backgroundColor: student.status === 'active' ? '#28a745' : '#dc3545'
                }}>
                  {student.status}
                </span>
              </td>
              <td>
                <button onClick={() => setEditingStudent(student)} style={styles.editBtn}>
                  Edit
                </button>
                <button onClick={() => deleteStudent(student.id)} style={styles.deleteBtn}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  editBtn: {
    padding: '5px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    marginRight: '5px'
  },
  deleteBtn: {
    padding: '5px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  badge: {
    padding: '5px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  form: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    width: '400px'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px'
  },
  btnGroup: {
    display: 'flex',
    gap: '10px'
  },
  saveBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '50px'
  }
};

export default StudentManagement;
