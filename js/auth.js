const API_URL = "https://momentz-4l9o.onrender.com/api";


console.log('Auth.js loaded - API URL:', API_URL);

// Show/Hide loading
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
        console.log('Showing loading spinner');
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
        console.log('Hiding loading spinner');
    }
}

// Show alert
function showAlert(message, type = 'error') {
    console.log('Alert:', type, message);
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 18px 30px;
        background: ${type === 'error' ? '#e74c3c' : 'linear-gradient(135deg, #f09433, #dc2743)'};
        color: white;
        border-radius: 12px;
        z-index: 10000;
        font-size: 15px;
        font-weight: 600;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        animation: slideDown 0.4s ease-out;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideUp 0.4s ease-out';
        setTimeout(() => alertDiv.remove(), 400);
    }, 3000);
}

// Modal handling
const registerModal = document.getElementById('registerModal');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const showRegisterBtn = document.getElementById('showRegister');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const closeButtons = document.querySelectorAll('.close');

if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'block';
    });
}

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.style.display = 'block';
    });
}

closeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Username:', username);
        console.log('API URL:', `${API_URL}/auth/login`);
        
        if (!username || !password) {
            showAlert('Please fill in all fields');
            return;
        }
        
        showLoading();
        
        try {
            console.log('Sending POST request...');
            
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (response.ok && data.token) {
                console.log('========================================');
                console.log('✅ LOGIN SUCCESSFUL!');
                console.log('Token received:', data.token);
                console.log('User ID:', data.id);
                console.log('Username:', data.username);
                console.log('========================================');

                // Save to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.id.toString());
                localStorage.setItem('username', data.username);

                // VERIFY it was saved
                const savedToken = localStorage.getItem('token');
                const savedUserId = localStorage.getItem('userId');
                const savedUsername = localStorage.getItem('username');

                console.log('========================================');
                console.log('📦 VERIFICATION - Data saved to localStorage:');
                console.log('Saved Token:', savedToken);
                console.log('Saved User ID:', savedUserId);
                console.log('Saved Username:', savedUsername);
                console.log('========================================');

                if (savedToken && savedUserId && savedUsername) {
                    showAlert('Login successful! Redirecting...', 'success');

                    setTimeout(() => {
                        console.log('🚀 NOW REDIRECTING TO HOME...');
                        window.location.href = '/home.html';
                    }, 1500);
                } else {
                    console.error('❌ FAILED to save to localStorage!');
                    showAlert('Login error! Please try again.', 'error');
                }
            } else {
                console.error('Login failed:', data);
                showAlert(data.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('=== LOGIN ERROR ===');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            showAlert('Connection error. Server might be down or on different port. Check console for details.');
        } finally {
            hideLoading();
        }
    });
}

// Register form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value.trim();
        const fullName = document.getElementById('registerFullName').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        
        console.log('Register attempt:', username);
        
        if (!email || !username || !password) {
            showAlert('Please fill in all required fields');
            return;
        }
        
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters');
            return;
        }
        
        showLoading();
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    fullName,
                    username,
                    password
                })
            });
            
            const data = await response.json();
            console.log('Register response:', data);
            
            if (response.ok) {
                showAlert('Account created! Please login.', 'success');
                registerModal.style.display = 'none';
                registerForm.reset();
                document.getElementById('loginUsername').value = username;
            } else {
                showAlert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Connection error. Please try again.');
        } finally {
            hideLoading();
        }
    });
}

// Forgot password form
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailUsername = document.getElementById('forgotEmailUsername').value.trim();
        
        if (!emailUsername) {
            showAlert('Please enter your email or username');
            return;
        }
        
        showAlert('Password reset link sent! (Demo feature)', 'success');
        console.log('Password reset for:', emailUsername);
        forgotPasswordModal.style.display = 'none';
        forgotPasswordForm.reset();
    });
}

// Check if already logged in
if (localStorage.getItem('token')) {
    console.log('User already logged in, redirecting to home...');
    window.location.href = '/home.html';
}

// ======================
// MOBILE EXPERIENCE FIXES
// ======================

// Ensure inputs stay visible when keyboard opens
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('focus', () => {
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  });
});

// Adjust alert for mobile
const originalShowAlert = showAlert;
showAlert = function(message, type = 'error') {
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 90%;
    padding: 16px 22px;
    background: ${type === 'error' ? '#e74c3c' : 'linear-gradient(135deg, #f09433, #dc2743)'};
    color: white;
    border-radius: 14px;
    z-index: 9999;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  `;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
};

// Better modal handling for mobile
window.addEventListener('resize', () => {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(m => {
    if (window.innerWidth < 768) {
      m.style.alignItems = 'flex-start';
      m.style.paddingTop = '60px';
    } else {
      m.style.alignItems = 'center';
      m.style.paddingTop = '0';
    }
  });
});

// On mobile, center content after opening modal
const modals = document.querySelectorAll('.modal');
modals.forEach(modal => {
  modal.addEventListener('transitionend', () => {
    if (window.innerWidth < 768 && modal.style.display === 'block') {
      window.scrollTo(0, 0);
    }
  });
});


// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -30px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -30px); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('=== Auth.js Setup Complete ===');
console.log('API URL:', API_URL);
console.log('Login form found:', !!loginForm);
console.log('Register form found:', !!registerForm);