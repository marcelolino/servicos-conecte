// Complete Mobile App JavaScript with Authentication and Profile Management
class MobileApp {
  constructor() {
    this.apiBase = window.location.origin;
    this.categories = [];
    this.popularServices = [];
    this.currentOffers = [];
    this.searchResults = [];
    this.cart = JSON.parse(localStorage.getItem('mobile_cart') || '[]');
    this.reservas = [];
    this.currentUser = null;
    this.currentTab = 'home';
    this.currentReservasTab = 'todas';
    this.isLoggedIn = false;
    this.init();
  }

  async init() {
    // Show loading screen
    this.showLoading();
    
    // Check authentication first
    await this.checkAuthStatus();
    
    // If logged in, load main app data
    if (this.isLoggedIn) {
      await Promise.all([
        this.loadCategories(),
        this.loadPopularServices(),
        this.loadCurrentOffers(),
        this.loadUserProfile(),
        this.loadReservas()
      ]);
      this.showMainApp();
    } else {
      this.showAuthScreen();
    }
    
    // Setup event listeners
    this.setupEventListeners();
    this.setupAuthListeners();
    
    // Update cart UI
    this.updateCartUI();
    
    // Hide loading screen
    this.hideLoading();
    
    console.log('Mobile App initialized successfully');
  }

  showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }

  showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
  }

  showMainApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
  }

  async apiRequest(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers,
        ...options
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          this.isLoggedIn = false;
          this.showAuthScreen();
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      if (error.message === 'Authentication required') {
        throw error;
      }
      return [];
    }
  }

  async checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const user = await this.apiRequest('/api/auth/me');
        if (user && user.id) {
          this.currentUser = user;
          this.isLoggedIn = true;
          return true;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
      }
    }
    this.isLoggedIn = false;
    return false;
  }

  // Authentication Methods
  setupAuthListeners() {
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

    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const email = formData.get('email');
    const password = formData.get('password');
    
    this.showLoadingButton(form.querySelector('button[type="submit"]'));
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        this.currentUser = data.user;
        this.isLoggedIn = true;
        
        this.showToast('Login realizado com sucesso!', 'success');
        await this.loadUserProfile();
        await this.loadReservas();
        this.showMainApp();
      } else {
        this.showToast(data.message || 'Erro ao fazer login', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      this.hideLoadingButton(form.querySelector('button[type="submit"]'));
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      cpf: formData.get('cpf'),
      cep: formData.get('cep'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    };
    
    if (data.password !== data.confirmPassword) {
      this.showToast('As senhas não coincidem', 'error');
      return;
    }
    
    this.showLoadingButton(form.querySelector('button[type="submit"]'));
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('authToken', result.token);
        this.currentUser = result.user;
        this.isLoggedIn = true;
        
        this.showToast('Conta criada com sucesso!', 'success');
        await this.loadUserProfile();
        this.showMainApp();
      } else {
        this.showToast(result.message || 'Erro ao criar conta', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      this.showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      this.hideLoadingButton(form.querySelector('button[type="submit"]'));
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    
    this.showLoadingButton(form.querySelector('button[type="submit"]'));
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.showToast('Código enviado para seu email', 'success');
      } else {
        this.showToast(data.message || 'Erro ao enviar código', 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      this.showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      this.hideLoadingButton(form.querySelector('button[type="submit"]'));
    }
  }

  async loadUserProfile() {
    if (!this.isLoggedIn) return;
    
    try {
      const user = await this.apiRequest('/api/auth/me');
      if (user) {
        this.currentUser = user;
        this.updateProfileUI();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  async loadReservas() {
    if (!this.isLoggedIn) return;
    
    try {
      this.reservas = await this.apiRequest('/api/service-requests');
      this.updateReservasUI();
    } catch (error) {
      console.error('Failed to load reservas:', error);
      this.reservas = [];
      this.updateReservasUI();
    }
  }

  updateProfileUI() {
    if (!this.currentUser) return;
    
    // Update profile header
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileBadge = document.getElementById('profile-badge');
    const profileAvatar = document.getElementById('profile-avatar');
    
    if (profileName) profileName.textContent = this.currentUser.name;
    if (profileEmail) profileEmail.textContent = this.currentUser.email;
    if (profileBadge) {
      profileBadge.textContent = this.getUserTypeLabel(this.currentUser.userType);
    }
    
    if (profileAvatar) {
      if (this.currentUser.avatar) {
        profileAvatar.src = this.currentUser.avatar;
        profileAvatar.style.display = 'block';
        profileAvatar.parentElement.querySelector('.avatar-placeholder').style.display = 'none';
      } else {
        profileAvatar.style.display = 'none';
        profileAvatar.parentElement.querySelector('.avatar-placeholder').style.display = 'flex';
      }
    }
    
    // Update profile form inputs
    const formInputs = {
      'profile-name-input': this.currentUser.name,
      'profile-email-input': this.currentUser.email,
      'profile-phone-input': this.currentUser.phone,
      'profile-cpf-input': this.currentUser.cpf,
      'profile-cep-input': this.currentUser.cep,
      'profile-address-input': this.currentUser.address,
      'profile-city-input': this.currentUser.city,
      'profile-state-input': this.currentUser.state
    };
    
    Object.entries(formInputs).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input && value) {
        input.value = value;
      }
    });
  }

  async handleProfileUpdate(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      cpf: formData.get('cpf'),
      cep: formData.get('cep'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state')
    };
    
    this.showLoadingButton(form.querySelector('button[type="submit"]'));
    
    try {
      const response = await this.apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (response) {
        this.currentUser = { ...this.currentUser, ...data };
        this.updateProfileUI();
        this.showToast('Perfil atualizado com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      this.showToast('Erro ao atualizar perfil', 'error');
    } finally {
      this.hideLoadingButton(form.querySelector('button[type="submit"]'));
    }
  }

  updateReservasUI() {
    const reservasList = document.getElementById('reservas-list');
    const emptyReservas = document.getElementById('empty-reservas');
    
    if (!reservasList || !emptyReservas) return;
    
    if (this.reservas.length === 0) {
      reservasList.style.display = 'none';
      emptyReservas.style.display = 'block';
      return;
    }
    
    reservasList.style.display = 'block';
    emptyReservas.style.display = 'none';
    
    const filteredReservas = this.currentReservasTab === 'todas' 
      ? this.reservas 
      : this.reservas.filter(r => r.status === this.currentReservasTab);
    
    reservasList.innerHTML = filteredReservas.map(reserva => `
      <div class="reserva-card">
        <div class="reserva-header">
          <div>
            <h4 class="reserva-title">${reserva.title}</h4>
            <p class="reserva-category">${reserva.category?.name || 'Categoria'}</p>
          </div>
          <span class="reserva-status status-${reserva.status}">${this.getStatusLabel(reserva.status)}</span>
        </div>
        <div class="reserva-details">
          <div class="detail-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${reserva.address}, ${reserva.city} - ${reserva.state}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-calendar"></i>
            <span>${new Date(reserva.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          ${reserva.budget ? `<div class="detail-item">
            <i class="fas fa-dollar-sign"></i>
            <span>Orçamento: R$ ${parseFloat(reserva.budget).toFixed(2)}</span>
          </div>` : ''}
        </div>
      </div>
    `).join('');
  }

  getUserTypeLabel(userType) {
    const labels = {
      'client': 'Cliente',
      'provider': 'Prestador',
      'admin': 'Administrador'
    };
    return labels[userType] || 'Usuário';
  }

  getStatusLabel(status) {
    const labels = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }

  handleLogout() {
    localStorage.removeItem('authToken');
    this.currentUser = null;
    this.isLoggedIn = false;
    this.reservas = [];
    this.showToast('Logout realizado com sucesso', 'success');
    this.showAuthScreen();
  }

  showLoadingButton(button) {
    if (!button) return;
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    button.disabled = true;
  }

  hideLoadingButton(button) {
    if (!button) return;
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (btnText) btnText.style.display = 'block';
    if (btnLoading) btnLoading.style.display = 'none';
    button.disabled = false;
  }

  // Navigation and UI Management
  setupEventListeners() {
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        this.showTab(tab);
      });
    });

    // Tab listeners for reservas
    document.querySelectorAll('.reservas-tabs .tab-item').forEach(item => {
      item.addEventListener('click', () => {
        const status = item.dataset.status;
        this.setReservasTab(status);
      });
    });

    // More menu close
    document.addEventListener('click', (e) => {
      const moreMenu = document.getElementById('more-menu');
      if (moreMenu && !moreMenu.contains(e.target) && !e.target.closest('[data-tab="more"]')) {
        moreMenu.style.display = 'none';
      }
    });
  }

  showTab(tab) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Show/hide sections
    const sections = ['categories-section', 'popular-services-section', 'offers-section', 'search-results-section'];
    const specificSections = ['cart-section', 'reservas-section', 'profile-section'];

    // Hide all sections first
    [...sections, ...specificSections].forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) element.style.display = 'none';
    });

    // Show specific sections based on tab
    switch (tab) {
      case 'home':
        sections.forEach(sectionId => {
          const element = document.getElementById(sectionId);
          if (element && sectionId !== 'search-results-section') {
            element.style.display = 'block';
          }
        });
        break;
      case 'cart':
        document.getElementById('cart-section').style.display = 'block';
        this.renderCart();
        break;
      case 'reservas':
        if (this.isLoggedIn) {
          document.getElementById('reservas-section').style.display = 'block';
          this.loadReservas();
        } else {
          this.showToast('Faça login para ver suas reservas', 'info');
          this.showAuthScreen();
        }
        break;
      case 'offers':
        document.getElementById('offers-section').style.display = 'block';
        break;
      case 'profile':
        if (this.isLoggedIn) {
          document.getElementById('profile-section').style.display = 'block';
          this.updateProfileUI();
        } else {
          this.showToast('Faça login para acessar seu perfil', 'info');
          this.showAuthScreen();
        }
        break;
      case 'more':
        document.getElementById('more-menu').style.display = 'block';
        break;
    }

    this.currentTab = tab;
  }

  setReservasTab(status) {
    document.querySelectorAll('.reservas-tabs .tab-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
    
    this.currentReservasTab = status;
    this.updateReservasUI();
  }

  async loadCategories() {
    try {
      this.categories = await this.apiRequest('/api/categories');
      this.renderCategories();
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  async loadPopularServices() {
    try {
      this.popularServices = await this.apiRequest('/api/providers/popular');
      this.renderPopularServices();
    } catch (error) {
      console.error('Failed to load popular services:', error);
    }
  }

  async loadCurrentOffers() {
    try {
      this.currentOffers = await this.apiRequest('/api/providers/popular?limit=6');
      this.renderCurrentOffers();
    } catch (error) {
      console.error('Failed to load current offers:', error);
    }
  }

  renderCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    const categoryIcons = [
      'fas fa-truck', 'fas fa-bath', 'fas fa-home',
      'fas fa-bug', 'fas fa-cogs', 'fas fa-car'
    ];

    if (this.categories.length === 0) {
      container.innerHTML = '<p>Nenhuma categoria disponível</p>';
      return;
    }

    container.innerHTML = this.categories.slice(0, 6).map((category, index) => `
      <div class="category-item" data-category-id="${category.id}">
        <div class="category-icon">
          <i class="${categoryIcons[index] || 'fas fa-star'}"></i>
        </div>
        <span>${category.name}</span>
      </div>
    `).join('');
  }

  renderPopularServices() {
    const container = document.getElementById('popular-services');
    if (!container) return;

    if (this.popularServices.length === 0) {
      container.innerHTML = '<p>Nenhum serviço popular disponível</p>';
      return;
    }

    container.innerHTML = this.popularServices.slice(0, 8).map(provider => {
      const service = provider.services && provider.services[0] ? provider.services[0] : {
        name: provider.businessName || 'Serviço Disponível',
        pricing: { hourly: 50, fixed: 100 }
      };

      const imageUrl = provider.profilePhoto || this.generateServiceImage(service.name);
      const price = service.pricing?.hourly || service.pricing?.fixed || 50;

      return `
        <div class="service-card" data-provider-id="${provider.id}">
          <div class="service-image">
            <img src="${imageUrl}" alt="${service.name}">
            <div class="service-heart">
              <i class="far fa-heart"></i>
            </div>
          </div>
          <div class="service-info">
            <div class="service-title">${service.name}</div>
            <div class="service-price">
              <span class="price-current">R$ ${price}</span>
              <button class="service-add" onclick="window.mobileApp.addToCart('${provider.id}')">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCurrentOffers() {
    const container = document.getElementById('current-offers');
    if (!container) return;

    if (this.currentOffers.length === 0) {
      container.innerHTML = '<p>Nenhuma oferta disponível</p>';
      return;
    }

    container.innerHTML = this.currentOffers.map(provider => {
      const service = provider.services && provider.services[0] ? provider.services[0] : {
        name: provider.businessName || 'Serviço Disponível',
        pricing: { hourly: 50, fixed: 100 }
      };

      const imageUrl = provider.profilePhoto || this.generateServiceImage(service.name);
      const price = service.pricing?.hourly || service.pricing?.fixed || 50;

      return `
        <div class="service-card" data-provider-id="${provider.id}">
          <div class="service-image">
            <img src="${imageUrl}" alt="${service.name}">
            <div class="service-heart">
              <i class="far fa-heart"></i>
            </div>
          </div>
          <div class="service-info">
            <div class="service-title">${service.name}</div>
            <div class="service-price">
              <span class="price-current">R$ ${price}</span>
              <button class="service-add" onclick="window.mobileApp.addToCart('${provider.id}')">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Cart Management
  addToCart(providerId) {
    const provider = [...this.popularServices, ...this.currentOffers, ...this.searchResults]
      .find(p => p.id == providerId);
      
    if (!provider) {
      this.showToast('Serviço não encontrado', 'error');
      return;
    }

    const service = provider.services && provider.services[0] ? provider.services[0] : {
      name: provider.businessName || 'Serviço Disponível',
      pricing: { hourly: 50, fixed: 100 }
    };

    const cartItem = {
      id: `${provider.id}_${Date.now()}`,
      providerId: provider.id,
      providerName: provider.businessName || 'Prestador',
      serviceName: service.name,
      price: service.pricing?.hourly || service.pricing?.fixed || 50,
      image: provider.profilePhoto || this.generateServiceImage(service.name),
      quantity: 1
    };

    const existingIndex = this.cart.findIndex(item => item.providerId == providerId);
    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity += 1;
    } else {
      this.cart.push(cartItem);
    }

    this.saveCart();
    this.updateCartUI();
    this.showToast(`${service.name} adicionado ao carrinho`, 'success');
  }

  removeFromCart(itemId) {
    this.cart = this.cart.filter(item => item.id !== itemId);
    this.saveCart();
    this.updateCartUI();
    this.renderCart();
  }

  updateQuantity(itemId, change) {
    const itemIndex = this.cart.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
      this.cart[itemIndex].quantity += change;
      if (this.cart[itemIndex].quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        this.saveCart();
        this.updateCartUI();
        this.renderCart();
      }
    }
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartUI();
    this.renderCart();
    this.showToast('Carrinho limpo', 'info');
  }

  saveCart() {
    localStorage.setItem('mobile_cart', JSON.stringify(this.cart));
  }

  updateCartUI() {
    const cartBadge = document.getElementById('cart-badge');
    const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartBadge) {
      if (itemCount > 0) {
        cartBadge.textContent = itemCount;
        cartBadge.style.display = 'flex';
      } else {
        cartBadge.style.display = 'none';
      }
    }
  }

  renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCart = document.getElementById('empty-cart');
    const cartTotal = document.getElementById('cart-total');

    if (!cartItems) return;

    if (this.cart.length === 0) {
      cartItems.style.display = 'none';
      cartSummary.style.display = 'none';
      emptyCart.style.display = 'block';
      return;
    }

    cartItems.style.display = 'block';
    cartSummary.style.display = 'block';
    emptyCart.style.display = 'none';

    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) {
      cartTotal.textContent = total.toFixed(2).replace('.', ',');
    }

    cartItems.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.serviceName}">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.serviceName}</div>
          <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="quantity-btn" onclick="window.mobileApp.updateQuantity('${item.id}', -1)">
            <i class="fas fa-minus"></i>
          </button>
          <span class="quantity-display">${item.quantity}</span>
          <button class="quantity-btn" onclick="window.mobileApp.updateQuantity('${item.id}', 1)">
            <i class="fas fa-plus"></i>
          </button>
          <button class="quantity-btn" onclick="window.mobileApp.removeFromCart('${item.id}')" style="margin-left: 8px; color: var(--error);">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  generateServiceImage(serviceName) {
    const colors = ['#1E88E5', '#8E24AA', '#00ACC1', '#7CB342', '#FB8C00', '#5E35B1'];
    const color = colors[serviceName.length % colors.length];
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${color}"/>
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="14" font-family="Arial">
          ${serviceName.charAt(0).toUpperCase()}
        </text>
      </svg>
    `)}`;
  }
}

// Global functions for HTML events
window.showLogin = function() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('forgot-form').style.display = 'none';
};

window.showRegister = function() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('forgot-form').style.display = 'none';
};

window.showForgotPassword = function() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('forgot-form').style.display = 'block';
};

window.togglePassword = function(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'far fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'far fa-eye';
  }
};

window.showTab = function(tab) {
  if (window.mobileApp) {
    window.mobileApp.showTab(tab);
  }
};

window.proceedToCheckout = function() {
  if (window.mobileApp && window.mobileApp.isLoggedIn) {
    window.mobileApp.showToast('Funcionalidade em desenvolvimento', 'info');
  } else {
    window.mobileApp.showToast('Faça login para finalizar o pedido', 'info');
    window.mobileApp.showAuthScreen();
  }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.mobileApp = new MobileApp();
});