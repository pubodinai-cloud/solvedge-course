// SolvEdge Course Platform - Frontend JavaScript

const API_BASE = '/api';

// ===== Authentication =====

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  
  if (token && user) {
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    return true;
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    return false;
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// ===== API Calls =====

// Auth API
async function register(email, password, name) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }
  
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

// Courses API
async function getCourses() {
  const response = await fetch(`${API_BASE}/courses`);
  return response.json();
}

async function getCourse(id) {
  const response = await fetch(`${API_BASE}/courses/${id}`);
  return response.json();
}

// Orders API
async function createOrder(courseId) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ course_id: courseId })
  });
  
  return response.json();
}

async function getMyOrders() {
  const response = await fetch(`${API_BASE}/orders/my`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

async function getEnrolledCourses() {
  const response = await fetch(`${API_BASE}/orders/enrolled`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

// Stripe API
async function createPaymentIntent(orderId) {
  const response = await fetch(`${API_BASE}/stripe/create-payment-intent`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ order_id: orderId })
  });
  
  return response.json();
}

// Admin API
async function getAdminDashboard() {
  const response = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

async function getAdminCourses() {
  const response = await fetch(`${API_BASE}/admin/courses`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

async function createCourse(courseData) {
  const response = await fetch(`${API_BASE}/admin/courses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(courseData)
  });
  return response.json();
}

async function updateCourse(id, courseData) {
  const response = await fetch(`${API_BASE}/admin/courses/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(courseData)
  });
  return response.json();
}

async function deleteCourse(id) {
  const response = await fetch(`${API_BASE}/admin/courses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.json();
}

async function getAdminUsers() {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

async function getAdminOrders() {
  const response = await fetch(`${API_BASE}/admin/orders`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

// ===== UI Helpers =====

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
    color: white;
    border-radius: 12px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Format currency
function formatCurrency(amount) {
  return `฿${amount.toLocaleString()}`;
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('th-TH', options);
}

// ===== Initialize =====

// Run auth check on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
