import React, { useState, useEffect } from 'react';
import api from '../api';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'student'
  });
  const [assignRole, setAssignRole] = useState('');

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [filters, pagination.page]);

  const loadUsers = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await api.get('/admin/users', { params });
      setUsers(response.data.users);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser._id}`, formData);
        alert('User updated successfully!');
      } else {
        await api.post('/admin/users', formData);
        alert('User created successfully!');
      }
      
      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      fullName: user.fullName || '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${id}`);
      alert('User deleted successfully!');
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleAssignRole = async () => {
    if (!assignRole) {
      alert('Please select a role');
      return;
    }

    try {
      await api.patch(`/admin/users/${selectedUser._id}/role`, { role: assignRole });
      alert('Role assigned successfully!');
      setShowRoleModal(false);
      setSelectedUser(null);
      setAssignRole('');
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign role');
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setAssignRole(user.role);
    setShowRoleModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'student'
    });
    setEditingUser(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      admin: 'role-admin',
      hr: 'role-hr',
      interviewer: 'role-interviewer',
      student: 'role-student'
    };
    return roleMap[role] || 'role-default';
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="user-management">
      <div className="user-header">
        <h2>User Management</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Role:</label>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="interviewer">Interviewer</option>
            <option value="student">Student</option>
            {roles.map(role => (
              <option key={role._id} value={role.name}>{role.displayName}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Username, email, or name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user._id}>
                  <td><strong>{user.username}</strong></td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.fullName || 'N/A'}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="btn-small btn-edit" onClick={() => handleEdit(user)}>
                      Edit
                    </button>
                    <button className="btn-small btn-role" onClick={() => openRoleModal(user)}>
                      Assign Role
                    </button>
                    <button className="btn-small btn-delete" onClick={() => handleDelete(user._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username*</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label>Password{editingUser ? ' (leave blank to keep current)' : '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required={!editingUser}
                />
              </div>

              <div className="form-group">
                <label>Role*</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                  <option value="interviewer">Interviewer</option>
                  {roles.map(role => (
                    <option key={role._id} value={role.name}>{role.displayName}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Assign Role</h2>
            <p className="modal-subtitle">User: <strong>{selectedUser.username}</strong></p>
            <p className="modal-subtitle">Current Role: <strong>{selectedUser.role}</strong></p>
            
            <div className="form-group">
              <label>Select New Role*</label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
                required
              >
                <option value="">-- Select Role --</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="interviewer">Interviewer</option>
                {roles.map(role => (
                  <option key={role._id} value={role.name}>{role.displayName}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRoleModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleAssignRole}>
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
