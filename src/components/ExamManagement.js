import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import Layout from './Layout';

function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    total_marks: 10,
    questions: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axios.get('/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteExam = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await axios.delete(`/exams/${id}`);
      alert('Exam deleted');
      fetchExams();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const saveExam = async (e) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await axios.put(`/exams/${editingExam}`, formData);
        alert('Exam updated');
      } else {
        await axios.post('/exams', formData);
        alert('Exam created');
      }
      setShowForm(false);
      setEditingExam(null);
      setFormData({ title: '', description: '', duration: 30, total_marks: 10, questions: [] });
      fetchExams();
    } catch (error) {
      alert('Failed to save exam');
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, {
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'a',
        marks: 1
      }]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...formData.questions];
    updated[index][field] = value;
    setFormData({ ...formData, questions: updated });
  };

  const removeQuestion = (index) => {
    const updated = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updated });
  };

  const editExam = async (id) => {
    try {
      const response = await axios.get(`/exams/${id}`);
      setFormData(response.data);
      setEditingExam(id);
      setShowForm(true);
    } catch (error) {
      alert('Failed to load exam');
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
      <div style={styles.header}>
        <h1>Exam Management</h1>
        <div>
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
            {showForm ? 'Cancel' : '+ Add Exam'}
          </button>
          <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
            Back
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveExam} style={styles.form}>
          <h2>{editingExam ? 'Edit Exam' : 'Create New Exam'}</h2>
          
          <input
            type="text"
            placeholder="Exam Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            style={styles.input}
            required
          />
          
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={styles.textarea}
            required
          />
          
          <div style={styles.row}>
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              style={{...styles.input, flex: 1}}
              required
            />
            <input
              type="number"
              placeholder="Total Marks"
              value={formData.total_marks}
              onChange={(e) => setFormData({...formData, total_marks: parseInt(e.target.value)})}
              style={{...styles.input, flex: 1}}
              required
            />
          </div>

          <h3>Questions</h3>
          {formData.questions.map((q, index) => (
            <div key={index} style={styles.questionCard}>
              <div style={styles.questionHeader}>
                <h4>Question {index + 1}</h4>
                <button type="button" onClick={() => removeQuestion(index)} style={styles.removeBtn}>
                  Remove
                </button>
              </div>
              
              <textarea
                placeholder="Question Text"
                value={q.question_text}
                onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                style={styles.textarea}
                required
              />
              
              <input
                placeholder="Option A"
                value={q.option_a}
                onChange={(e) => updateQuestion(index, 'option_a', e.target.value)}
                style={styles.input}
                required
              />
              <input
                placeholder="Option B"
                value={q.option_b}
                onChange={(e) => updateQuestion(index, 'option_b', e.target.value)}
                style={styles.input}
                required
              />
              <input
                placeholder="Option C"
                value={q.option_c}
                onChange={(e) => updateQuestion(index, 'option_c', e.target.value)}
                style={styles.input}
                required
              />
              <input
                placeholder="Option D"
                value={q.option_d}
                onChange={(e) => updateQuestion(index, 'option_d', e.target.value)}
                style={styles.input}
                required
              />
              
              <div style={styles.row}>
                <select
                  value={q.correct_answer}
                  onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                  style={{...styles.input, flex: 1}}
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
                <input
                  type="number"
                  placeholder="Marks"
                  value={q.marks}
                  onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value))}
                  style={{...styles.input, flex: 1}}
                  required
                />
              </div>
            </div>
          ))}
          
          <button type="button" onClick={addQuestion} style={styles.addQuestionBtn}>
            + Add Question
          </button>
          
          <button type="submit" style={styles.submitBtn}>
            {editingExam ? 'Update Exam' : 'Create Exam'}
          </button>
        </form>
      )}

      <div style={styles.examList}>
        {exams.map(exam => (
          <div key={exam.id} style={styles.examCard}>
            <h3>{exam.title}</h3>
            <p>{exam.description}</p>
            <div style={styles.examMeta}>
              <span>⏱️ {exam.duration}min</span>
              <span>📝 {exam.total_marks} marks</span>
              <span>❓ {exam.questions?.length || 0} questions</span>
            </div>
            <div style={styles.actions}>
              <button onClick={() => editExam(exam.id)} style={styles.editBtn}>Edit</button>
              <button onClick={() => deleteExam(exam.id)} style={styles.deleteBtn}>Delete</button>
            </div>
          </div>
        ))}
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
  form: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px' },
  textarea: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '80px' },
  row: { display: 'flex', gap: '10px', marginBottom: '15px' },
  questionCard: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  removeBtn: { padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  addQuestionBtn: { width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  examList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  examCard: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  examMeta: { display: 'flex', gap: '15px', margin: '15px 0', fontSize: '14px', color: '#666' },
  actions: { display: 'flex', gap: '10px' },
  editBtn: { flex: 1, padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  deleteBtn: { flex: 1, padding: '8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default ExamManagement;
