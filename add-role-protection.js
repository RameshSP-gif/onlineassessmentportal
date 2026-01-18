// This file is just for reference on which routes need protection
// The actual protection is added via targeted replacements

const routesToProtect = {
  // Admin routes
  admin: [
    { pattern: "app.get('/api/admin/dashboard'", replacement: "app.get('/api/admin/dashboard', verifyAuth, requireRole(['admin'])" },
    { pattern: "app.get('/api/admin/students'", replacement: "app.get('/api/admin/students', verifyAuth, requireRole(['admin'])" },
    { pattern: "app.delete('/api/admin/students/:id'", replacement: "app.delete('/api/admin/students/:id', verifyAuth, requireRole(['admin'])" },
    { pattern: "app.put('/api/admin/students/:id'", replacement: "app.put('/api/admin/students/:id', verifyAuth, requireRole(['admin'])" },
    { pattern: "app.get('/api/admin/payments/pending'", replacement: "app.get('/api/admin/payments/pending', verifyAuth, requireRole(['admin'])" },
    { pattern: "app.post('/api/admin/payments/approve'", replacement: "app.post('/api/admin/payments/approve', verifyAuth, requireRole(['admin'])" },
    { pattern: "app.post('/api/admin/payments/reject'", replacement: "app.post('/api/admin/payments/reject', verifyAuth, requireRole(['admin'])" },
  ],
  // HR routes
  hr: [
    { pattern: "app.get('/api/hr/dashboard-stats'", replacement: "app.get('/api/hr/dashboard-stats', verifyAuth, requireRole(['hr'])" },
    { pattern: "app.get('/api/hr/interview-requests'", replacement: "app.get('/api/hr/interview-requests', verifyAuth, requireRole(['hr'])" },
    { pattern: "app.post('/api/hr/interview-request/:id/approve'", replacement: "app.post('/api/hr/interview-request/:id/approve', verifyAuth, requireRole(['hr'])" },
    { pattern: "app.post('/api/hr/interview-request/:id/reject'", replacement: "app.post('/api/hr/interview-request/:id/reject', verifyAuth, requireRole(['hr'])" },
  ],
  // Student routes
  student: [
    { pattern: "app.post('/api/exams/:id/submit'", replacement: "app.post('/api/exams/:id/submit', verifyAuth, requireRole(['student'])" },
    { pattern: "app.post('/api/payments/create-order'", replacement: "app.post('/api/payments/create-order', verifyAuth, requireRole(['student'])" },
    { pattern: "app.get('/api/submissions/me'", replacement: "app.get('/api/submissions/me', verifyAuth, requireRole(['student'])" },
  ]
};
