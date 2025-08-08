// Mobile Auth JavaScript
class MobileAuth {
  constructor() {
    this.apiBase = window.location.origin;
    this.currentForm = 'login';
    this.otpTimer = null;
    this.otpTimeLeft = 60;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupPasswordStrength();
    this.setupPhoneMask();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Forgot password form
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
    }

    // OTP form
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
      otpForm.addEventListener('submit', (e) => this.handleOTPVerification(e));
    }

    // Password strength checking
    const registerPassword = document.getElementById('register-password');
    if (registerPassword) {
      registerPassword.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
    }

    // Confirm password validation
    const confirmPassword = document.getElementById('register-confirm');
    if (confirmPassword) {
      confirmPassword.addEventListener('input', (e) => this.validatePasswordMatch());
    }
  }

  setupPasswordStrength() {
    // Password strength indicator implementation
  }

  setupPhoneMask() {
    const phoneInput = document.getElementById('register-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 11) {
          value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 7) {
          value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
          value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
        e.target.value = value;
      });
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    this.setLoading(form, true);
    this.clearErrors();

    try {
      const response = await this.apiRequest('/api/auth/login', 'POST', data);
      
      // Check if response contains token and user (successful login)
      if (response.token && response.user) {
        this.showToast('Login realizado com sucesso!', 'success');
        
        // Save user data
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        // Redirect to main app
        setTimeout(() => {
          window.location.href = '/mobile';
        }, 1000);
      } else {
        // Handle error response
        const errorMessage = response.message || 'Credenciais inválidas';
        this.showToast(errorMessage, 'error');
        
        if (errorMessage.toLowerCase().includes('email')) {
          this.showFieldError('login-email', errorMessage);
        } else if (errorMessage.toLowerCase().includes('senha')) {
          this.showFieldError('login-password', errorMessage);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      this.setLoading(form, false);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate form
    if (!this.validateRegistrationForm(data)) {
      return;
    }

    this.setLoading(form, true);
    this.clearErrors();

    try {
      const response = await this.apiRequest('/api/auth/register', 'POST', data);
      
      // Check if response contains token and user (successful registration)
      if (response.token && response.user) {
        this.showToast('Conta criada com sucesso!', 'success');
        
        // Save user data and redirect
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        setTimeout(() => {
          window.location.href = '/mobile';
        }, 1000);
      } else {
        // Handle error response
        const errorMessage = response.message || 'Erro ao criar conta';
        this.showToast(errorMessage, 'error');
        
        // Show specific field errors
        if (errorMessage.toLowerCase().includes('email')) {
          this.showFieldError('register-email', errorMessage);
        } else if (errorMessage.toLowerCase().includes('telefone') || errorMessage.toLowerCase().includes('phone')) {
          this.showFieldError('register-phone', errorMessage);
        } else if (errorMessage.toLowerCase().includes('nome')) {
          this.showFieldError('register-name', errorMessage);
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      this.showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      this.setLoading(form, false);
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    this.setLoading(form, true);

    try {
      const response = await this.apiRequest('/api/auth/forgot-password', 'POST', data);
      
      if (response.success) {
        this.showToast('Instruções enviadas para seu email!', 'success');
        setTimeout(() => {
          this.showLogin();
        }, 2000);
      } else {
        this.showToast(response.message || 'Erro ao enviar instruções', 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      this.showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      this.setLoading(form, false);
    }
  }

  async handleOTPVerification(e) {
    e.preventDefault();
    const form = e.target;
    
    // Get OTP code
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
      this.showToast('Digite o código completo', 'warning');
      return;
    }

    this.setLoading(form, true);

    try {
      const response = await this.apiRequest('/api/auth/verify-otp', 'POST', { otp });
      
      if (response.success) {
        this.showToast('Telefone verificado com sucesso!', 'success');
        
        // Save user data and redirect
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        setTimeout(() => {
          window.location.href = '/mobile';
        }, 1000);
      } else {
        this.showToast(response.message || 'Código inválido', 'error');
        
        // Clear OTP inputs
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      this.showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      this.setLoading(form, false);
    }
  }

  validateRegistrationForm(data) {
    // Clear previous errors
    this.clearErrors();

    let isValid = true;

    // Name validation
    if (!data.name || data.name.trim().length < 2) {
      this.showFieldError('register-name', 'Nome deve ter pelo menos 2 caracteres');
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      this.showFieldError('register-email', 'Email inválido');
      isValid = false;
    }

    // Phone validation
    const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
    if (!data.phone || !phoneRegex.test(data.phone)) {
      this.showFieldError('register-phone', 'Telefone inválido');
      isValid = false;
    }

    // Password validation
    if (!data.password || data.password.length < 6) {
      this.showFieldError('register-password', 'Senha deve ter pelo menos 6 caracteres');
      isValid = false;
    }

    // Confirm password validation
    if (data.password !== data.confirmPassword) {
      this.showFieldError('register-confirm', 'Senhas não coincidem');
      isValid = false;
    }

    // Terms validation
    if (!document.getElementById('accept-terms').checked) {
      this.showToast('Aceite os termos para continuar', 'warning');
      isValid = false;
    }

    return isValid;
  }

  checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;

    let strength = 0;
    let text = '';
    let color = '';

    if (password.length === 0) {
      text = 'Digite uma senha';
      color = '#E0E0E0';
    } else if (password.length < 6) {
      strength = 25;
      text = 'Muito fraca';
      color = '#F44336';
    } else if (password.length < 8) {
      strength = 50;
      text = 'Fraca';
      color = '#FF9800';
    } else if (password.match(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      strength = 100;
      text = 'Forte';
      color = '#4CAF50';
    } else {
      strength = 75;
      text = 'Boa';
      color = '#2196F3';
    }

    strengthBar.style.width = `${strength}%`;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
  }

  validatePasswordMatch() {
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const confirmField = document.getElementById('register-confirm').parentElement;
    
    if (confirmPassword && password !== confirmPassword) {
      this.showFieldError('register-confirm', 'Senhas não coincidem');
    } else {
      this.clearFieldError('register-confirm');
    }
  }

  // Form Navigation
  showLogin() {
    this.hideAllForms();
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('login-form').classList.add('fade-in');
    this.currentForm = 'login';
  }

  showRegister() {
    this.hideAllForms();
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('register-form').classList.add('fade-in');
    this.currentForm = 'register';
  }

  showForgotPassword() {
    this.hideAllForms();
    document.getElementById('forgot-form').style.display = 'block';
    document.getElementById('forgot-form').classList.add('fade-in');
    this.currentForm = 'forgot';
  }

  showOTPForm(phone) {
    this.hideAllForms();
    document.getElementById('otp-form').style.display = 'block';
    document.getElementById('otp-form').classList.add('fade-in');
    this.currentForm = 'otp';
    
    // Update subtitle with phone
    const subtitle = document.querySelector('#otp-form .form-subtitle');
    if (subtitle && phone) {
      subtitle.textContent = `Digite o código enviado para ${phone}`;
    }
    
    // Start timer
    this.startOTPTimer();
    
    // Focus first input
    document.querySelector('.otp-input').focus();
  }

  hideAllForms() {
    const forms = ['login-form', 'register-form', 'forgot-form', 'otp-form'];
    forms.forEach(formId => {
      const form = document.getElementById(formId);
      if (form) {
        form.style.display = 'none';
        form.classList.remove('fade-in');
      }
    });
  }

  // OTP Timer
  startOTPTimer() {
    this.otpTimeLeft = 60;
    const timerElement = document.getElementById('timer');
    const resendBtn = document.getElementById('resend-btn');
    
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
    }
    
    this.otpTimer = setInterval(() => {
      this.otpTimeLeft--;
      
      if (timerElement) {
        timerElement.textContent = this.otpTimeLeft;
      }
      
      if (this.otpTimeLeft <= 0) {
        clearInterval(this.otpTimer);
        
        // Hide timer and show resend button
        if (timerElement && timerElement.parentElement) {
          timerElement.parentElement.style.display = 'none';
        }
        if (resendBtn) {
          resendBtn.style.display = 'block';
        }
      }
    }, 1000);
  }

  async resendOTP() {
    try {
      const response = await this.apiRequest('/api/auth/resend-otp', 'POST');
      
      if (response.success) {
        this.showToast('Código reenviado!', 'success');
        
        // Restart timer
        const timerElement = document.getElementById('timer');
        const resendBtn = document.getElementById('resend-btn');
        
        if (timerElement && timerElement.parentElement) {
          timerElement.parentElement.style.display = 'block';
        }
        if (resendBtn) {
          resendBtn.style.display = 'none';
        }
        
        this.startOTPTimer();
        
        // Clear inputs and focus first
        document.querySelectorAll('.otp-input').forEach(input => input.value = '');
        document.querySelector('.otp-input').focus();
      } else {
        this.showToast(response.message || 'Erro ao reenviar código', 'error');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      this.showToast('Erro de conexão. Tente novamente.', 'error');
    }
  }

  // Error Handling
  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const group = field.closest('.form-group');
    
    group.classList.add('error');
    
    // Remove existing error message
    const existingError = group.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    field.parentElement.appendChild(errorDiv);
  }

  clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const group = field.closest('.form-group');
    
    group.classList.remove('error');
    
    const errorMessage = group.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  }

  clearErrors() {
    document.querySelectorAll('.form-group.error').forEach(group => {
      group.classList.remove('error');
    });
    document.querySelectorAll('.error-message').forEach(error => {
      error.remove();
    });
  }

  // Loading States
  setLoading(form, loading) {
    const button = form.querySelector('button[type="submit"]');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
      btnText.style.opacity = '0';
      btnLoading.style.display = 'block';
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      btnText.style.opacity = '1';
      btnLoading.style.display = 'none';
    }
  }

  // API Request Helper
  async apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${this.apiBase}${endpoint}`, options);
    return await response.json();
  }

  // Toast Notifications
  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${this.getToastIcon(type)}"></i>
      <span>${message}</span>
    `;
    
    // Style toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: this.getToastColor(type),
      color: 'white',
      padding: '12px 20px',
      borderRadius: '25px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '1000',
      maxWidth: 'calc(100% - 40px)',
      opacity: '0',
      transition: 'all 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    // Show toast
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || icons.info;
  }

  getToastColor(type) {
    const colors = {
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3'
    };
    return colors[type] || colors.info;
  }
}

// Global Functions
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/mobile';
  }
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector('.toggle-password');
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'far fa-eye';
  }
}

function showLogin() {
  window.mobileAuth.showLogin();
}

function showRegister() {
  window.mobileAuth.showRegister();
}

function showForgotPassword() {
  window.mobileAuth.showForgotPassword();
}

function showTerms() {
  window.open('/terms', '_blank');
}

function showPrivacy() {
  window.open('/privacy', '_blank');
}

async function signInWithGoogle() {
  window.mobileAuth.showToast('Login com Google em desenvolvimento', 'info');
}

function resendOTP() {
  window.mobileAuth.resendOTP();
}

// OTP Input Navigation
function moveToNext(input, index) {
  if (input.value.length === 1 && index < 5) {
    const nextInput = document.querySelectorAll('.otp-input')[index + 1];
    if (nextInput) {
      nextInput.focus();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.mobileAuth = new MobileAuth();
});

// Handle back button
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    goBack();
  }
});