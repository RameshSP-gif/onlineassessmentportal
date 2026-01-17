import React, { useState, useEffect } from 'react';
import api from '../api';
import './RoleManagement.css';

function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: '',
    isActive: true
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const roleData = {
        ...formData,
        permissions: formData.permissions.split(',').map(p => p.trim()).filter(p => p)
      };

      if (editingRole) {
        await api.put(`/admin/roles/${editingRole._id}`, roleData);
        alert('Role updated successfully!');
      } else {
        await api.post('/admin/roles', roleData);
        alert('Role created successfully!');
      }
      
      setShowModal(false);
      resetForm();
      loadRoles();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save role');
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions?.join(', ') || '',
      isActive: role.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await api.delete(`/admin/roles/${id}`);
      alert('Role deleted successfully!');
      loadRoles();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete role');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: '',
      isActive: true
    });
    setEditingRole(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) return <div className="loading">Loading roles...</div>;

  return (
    <div className="role-management">
      <div className="role-header">
        <h2>Role Management</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add New Role
        </button>
      </div>

      <div className="roles-grid">
        {roles.length === 0 ? (
          <div className="no-data">No roles found. Create your first role!</div>
        ) : (
          roles.map(role => (
            <div key={role._id} className={`role-card ${!role.isActive ? 'inactive' : ''}`}>
              <div className="role-card-header">
                <h3>{role.displayName}</h3>
                <span className={`status-badge ${role.isActive ? 'active' : 'inactive'}`}>
                  {role.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="role-name">System Name: <code>{role.name}</code></p>
              <p className="role-description">{role.description || 'No description'}</p>
              <div className="role-permissions">
                <strong>Permissions:</strong>
                {role.permissions && role.permissions.length > 0 ? (
                  <div className="permissions-list">
                    {role.permissions.map((perm, idx) => (
                      <span key={idx} className="permission-tag">{perm}</span>
                    ))}
                  </div>
                ) : (
                  <span className="no-permissions">No permissions defined</span>
                )}
              </div>
              <div className="role-actions">
                <button className="btn-edit" onClick={() => handleEdit(role)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(role._id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role Name (System)*</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., super_admin, moderator"
                  required
                />
                <small>Lowercase, no spaces (use underscore)</small>
              </div>

              <div className="form-group">
                <label>Display Name*</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Super Administrator"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this role..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Permissions</label>
                <input
                  type="text"
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  placeholder="e.g., read, write, delete (comma-separated)"
                />
                <small>Enter permissions separated by commas</small>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagement;
