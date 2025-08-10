// Mobile App JavaScript - Complete implementation
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
        this.loadReservas(),
        this.loadCartFromServer()
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
          // Token expired or invalid
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

  async loadCategories() {
    try {
      console.log('Loading categories...');
      this.categories = await this.apiRequest('/api/categories');
      this.renderCategories();
    } catch (error) {
      console.error('Failed to load categories:', error);
      this.renderEmptyState('categories-grid', 'Não foi possível carregar as categorias');
    }
  }

  async loadPopularServices() {
    try {
      console.log('Loading popular services...');
      this.popularServices = await this.apiRequest('/api/providers/popular');
      this.renderPopularServices();
    } catch (error) {
      console.error('Failed to load popular services:', error);
      this.renderEmptyState('popular-services', 'Não foi possível carregar os serviços populares');
    }
  }

  async loadCurrentOffers() {
    try {
      console.log('Loading current offers...');
      // Using popular services as offers for now - could be a separate endpoint
      this.currentOffers = await this.apiRequest('/api/providers/popular?limit=6');
      this.renderCurrentOffers();
    } catch (error) {
      console.error('Failed to load current offers:', error);
      this.renderEmptyState('current-offers', 'Não foi possível carregar as ofertas');
    }
  }

  renderCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    const categoryIcons = [
      'fas fa-truck',
      'fas fa-bath',
      'fas fa-home',
      'fas fa-bug',
      'fas fa-cogs',
      'fas fa-car'
    ];

    if (this.categories.length === 0) {
      this.renderEmptyState('categories-grid', 'Nenhuma categoria disponível');
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
      this.renderEmptyState('popular-services', 'Nenhum serviço popular disponível');
      return;
    }

    container.innerHTML = this.popularServices.slice(0, 8).map(provider => {
      // Get first service or create default
      const service = provider.services && provider.services[0] ? provider.services[0] : {
        name: provider.businessName || 'Serviço Disponível',
        pricing: { hourly: 50, fixed: 100 }
      };

      const imageUrl = provider.profilePhoto || this.generateServiceImage(service.name);
      const price = service.pricing?.hourly || service.pricing?.fixed || 50;
      const originalPrice = Math.round(price * 1.3);

      return `
        <div class="service-card" data-provider-id="${provider.id}">
          <div class="service-image">
            <img src="${imageUrl}" alt="${service.name}" onerror="this.src='${this.generateServiceImage(service.name)}'">
            <div class="service-badge">100$ OFF</div>
            <div class="service-heart">
              <i class="far fa-heart"></i>
            </div>
          </div>
          <div class="service-info">
            <div class="service-title">${service.name}</div>
            <div class="service-price">
              <span class="price-current">R$ ${price}</span>
              <span class="price-old">R$ ${originalPrice}</span>
              <button class="service-add">
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
      this.renderEmptyState('current-offers', 'Nenhuma oferta disponível no momento');
      return;
    }

    container.innerHTML = this.currentOffers.slice(0, 6).map(provider => {
      const service = provider.services && provider.services[0] ? provider.services[0] : {
        name: provider.businessName || 'Serviço em Oferta',
        pricing: { hourly: 40, fixed: 80 }
      };

      const imageUrl = provider.profilePhoto || this.generateServiceImage(service.name);
      const price = service.pricing?.hourly || service.pricing?.fixed || 40;

      return `
        <div class="offer-card" data-provider-id="${provider.id}">
          <div class="offer-image">
            <img src="${imageUrl}" alt="${service.name}" onerror="this.src='${this.generateServiceImage(service.name)}'">
            <div class="service-badge">10% OFF</div>
            <div class="service-heart">
              <i class="far fa-heart"></i>
            </div>
          </div>
          <div class="offer-info">
            <div class="offer-title">${service.name}</div>
            <div class="offer-price">R$ ${price}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  generateServiceImage(serviceName) {
    const colors = ['4CAF50', '2196F3', 'FF9800', '9C27B0', 'F44336', '00BCD4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const text = encodeURIComponent(serviceName.substring(0, 20));
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'%3E%3Crect fill='%23${color}' width='200' height='120'/%3E%3Ctext x='100' y='65' text-anchor='middle' fill='white' font-size='14' font-family='Arial'%3E${text}%3C/text%3E%3C/svg%3E`;
  }

  renderEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        padding: 40px 20px; 
        color: #757575; 
        text-align: center;
        grid-column: 1 / -1;
      ">
        <div>
          <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5;"></i>
          <p style="margin: 0; font-size: 14px;">${message}</p>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = item.dataset.tab;
        if (tab) {
          this.showTab(tab);
        }
      });
    });

    // More menu toggle
    const moreNavItem = document.querySelector('[data-tab="more"]');
    const moreMenu = document.getElementById('more-menu');
    const closeMenu = document.querySelector('.close-menu');

    if (moreNavItem && moreMenu) {
      moreNavItem.addEventListener('click', () => {
        if (moreMenu.style.display === 'block') {
          moreMenu.style.display = 'none';
        } else {
          moreMenu.style.display = 'block';
        }
      });
    }

    if (closeMenu && moreMenu) {
      closeMenu.addEventListener('click', () => {
        moreMenu.style.display = 'none';
      });

      // Close menu when clicking outside
      moreMenu.addEventListener('click', (e) => {
        if (e.target === moreMenu) {
          moreMenu.style.display = 'none';
        }
      });
    }

    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = item.dataset.action;
        if (action) {
          this.handleMenuAction(action);
          if (moreMenu) moreMenu.style.display = 'none';
        }
      });
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');
    const clearSearch = document.getElementById('clear-search');

    if (searchInput && searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.performSearch(searchInput.value);
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch(searchInput.value);
        }
      });

      searchInput.addEventListener('input', (e) => {
        if (!e.target.value.trim()) {
          this.clearSearch();
        }
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Cart functionality
    const clearCart = document.getElementById('clear-cart');
    if (clearCart) {
      clearCart.addEventListener('click', () => {
        this.clearCart();
      });
    }

    // Service and offer card clicks
    document.addEventListener('click', (e) => {
      const serviceCard = e.target.closest('.service-card');
      const offerCard = e.target.closest('.offer-card');
      const categoryItem = e.target.closest('.category-item');
      const serviceAdd = e.target.closest('.service-add');

      if (serviceAdd) {
        e.preventDefault();
        e.stopPropagation();
        const card = serviceAdd.closest('.service-card, .offer-card');
        if (card) {
          const providerId = card.dataset.providerId;
          this.addToCart(providerId);
        }
      } else if (serviceCard) {
        const providerId = serviceCard.dataset.providerId;
        this.showServiceDetails(providerId);
      } else if (offerCard) {
        const providerId = offerCard.dataset.providerId;
        this.showServiceDetails(providerId);
      } else if (categoryItem) {
        const categoryId = categoryItem.dataset.categoryId;
        this.showCategoryServices(categoryId);
      }
    });

    // Heart icons toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.service-heart')) {
        e.preventDefault();
        e.stopPropagation();
        const heart = e.target.closest('.service-heart').querySelector('i');
        heart.classList.toggle('far');
        heart.classList.toggle('fas');
        heart.style.color = heart.classList.contains('fas') ? '#F44336' : '';
        
        // Save to favorites (could implement API call here)
        this.showToast(heart.classList.contains('fas') ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info');
      }
    });

    // FAB button
    const fab = document.querySelector('.fab');
    if (fab) {
      fab.addEventListener('click', () => {
        this.showTab('cart');
      });
    }

    // Banner indicators
    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });
  }

  // Tab Navigation System
  showTab(tabName) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Hide all sections
    const sections = ['categories-section', 'popular-services-section', 'offers-section', 'search-results', 'cart-section'];
    sections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) section.style.display = 'none';
    });
    
    // Show selected section
    this.currentTab = tabName;
    
    switch(tabName) {
      case 'home':
        document.getElementById('categories-section').style.display = 'block';
        document.getElementById('popular-services-section').style.display = 'block';
        document.getElementById('offers-section').style.display = 'block';
        document.getElementById('fab').style.display = 'flex';
        break;
      case 'cart':
        document.getElementById('cart-section').style.display = 'block';
        document.getElementById('fab').style.display = 'none';
        this.renderCart();
        break;
      case 'bookings':
        this.showToast('Redirecionando para suas reservas...', 'info');
        setTimeout(() => {
          window.open(`${this.apiBase}/client-reservas`, '_blank');
        }, 500);
        break;
      case 'offers':
        document.getElementById('offers-section').style.display = 'block';
        document.getElementById('fab').style.display = 'none';
        this.scrollToSection('#offers-section');
        break;
      case 'more':
        // Menu toggle is handled in event listeners
        break;
    }
  }

  // Search Functionality
  async performSearch(query) {
    if (!query.trim()) {
      this.showToast('Digite algo para pesquisar', 'warning');
      return;
    }
    
    try {
      console.log('Searching for:', query);
      this.showToast(`Pesquisando por "${query}"...`, 'info');
      
      // Search in services API
      const results = await this.apiRequest(`/api/services/search?q=${encodeURIComponent(query)}`);
      
      if (results && results.length > 0) {
        this.searchResults = results;
        this.renderSearchResults(query);
        this.showSearchResults();
      } else {
        // Fallback search in existing data
        this.searchInExistingData(query);
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.searchInExistingData(query);
    }
  }

  searchInExistingData(query) {
    const lowerQuery = query.toLowerCase();
    const matchingServices = this.popularServices.filter(provider => {
      const businessName = (provider.businessName || '').toLowerCase();
      const services = provider.services || [];
      const serviceMatches = services.some(service => 
        (service.name || '').toLowerCase().includes(lowerQuery)
      );
      return businessName.includes(lowerQuery) || serviceMatches;
    });

    if (matchingServices.length > 0) {
      this.searchResults = matchingServices;
      this.renderSearchResults(query);
      this.showSearchResults();
    } else {
      this.showToast(`Nenhum resultado encontrado para "${query}"`, 'warning');
    }
  }

  showSearchResults() {
    // Hide other sections
    const sections = ['categories-section', 'popular-services-section', 'offers-section', 'cart-section'];
    sections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) section.style.display = 'none';
    });

    // Show search results
    document.getElementById('search-results').style.display = 'block';
    document.getElementById('fab').style.display = 'none';
  }

  renderSearchResults(query) {
    const container = document.getElementById('search-results-list');
    const header = document.querySelector('#search-results h3');
    
    if (header) {
      header.textContent = `Resultados para "${query}"`;
    }

    if (!container) return;

    if (this.searchResults.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; color: #757575;">
          <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
          <p>Nenhum resultado encontrado</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.searchResults.map(provider => {
      const service = provider.services && provider.services[0] ? provider.services[0] : {
        name: provider.businessName || 'Serviço Disponível',
        pricing: { hourly: 50, fixed: 100 }
      };

      const imageUrl = provider.profilePhoto || this.generateServiceImage(service.name);
      const price = service.pricing?.hourly || service.pricing?.fixed || 50;

      return `
        <div class="service-card" data-provider-id="${provider.id}">
          <div class="service-image">
            <img src="${imageUrl}" alt="${service.name}" onerror="this.src='${this.generateServiceImage(service.name)}'">
            <div class="service-heart">
              <i class="far fa-heart"></i>
            </div>
          </div>
          <div class="service-info">
            <div class="service-title">${service.name}</div>
            <div class="service-price">
              <span class="price-current">R$ ${price}</span>
              <button class="service-add">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  clearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    this.searchResults = [];
    document.getElementById('search-results').style.display = 'none';
    this.showTab('home');
  }

  // Enhanced Cart Management
  async addToCart(providerId, serviceData = null) {
    try {
      // Find the provider/service data
      const provider = [...this.popularServices, ...this.currentOffers, ...this.searchResults]
        .find(p => p.id == providerId);
        
      if (!provider) {
        this.showToast('Serviço não encontrado', 'error');
        return;
      }

      // Use provided service data or fallback to default
      const service = serviceData || (provider.services && provider.services[0] ? provider.services[0] : {
        name: provider.businessName || 'Serviço Disponível',
        pricing: { hourly: 50, fixed: 100 }
      });

      // Check if user is logged in, redirect to checkout directly if has backend cart
      if (this.isLoggedIn && this.currentUser) {
        try {
          // Add to server cart via API
          const cartResponse = await this.apiRequest('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({
              providerServiceId: service.id || provider.id,
              quantity: 1,
              unitPrice: service.pricing?.hourly || service.pricing?.fixed || 50,
              notes: `Serviço: ${service.name}`
            })
          });

          if (cartResponse) {
            this.showToast(`${service.name} adicionado ao carrinho`, 'success');
            // Update local cart display
            await this.loadCartFromServer();
            this.updateCartUI();
            return;
          }
        } catch (error) {
          console.error('Error adding to server cart:', error);
          // Fallback to local cart
        }
      }

      // Local cart management (fallback or for guest users)
      const cartItem = {
        id: `${provider.id}_${Date.now()}`,
        providerId: provider.id,
        providerServiceId: service.id || provider.id,
        providerName: provider.businessName || provider.user?.name || 'Prestador',
        serviceName: service.name,
        price: service.pricing?.hourly || service.pricing?.fixed || 50,
        image: provider.profilePhoto || provider.user?.avatar || this.generateServiceImage(service.name),
        quantity: 1,
        category: service.category || provider.category || { name: 'Serviços' },
        chargingTypes: service.chargingTypes || [],
        description: service.description || provider.description || ''
      };

      // Check if item already exists
      const existingIndex = this.cart.findIndex(item => item.providerId == providerId);
      if (existingIndex >= 0) {
        this.cart[existingIndex].quantity += 1;
      } else {
        this.cart.push(cartItem);
      }

      this.saveCart();
      this.updateCartUI();
      this.showToast(`${service.name} adicionado ao carrinho`, 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showToast('Erro ao adicionar ao carrinho', 'error');
    }
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

  async loadCartFromServer() {
    if (!this.isLoggedIn) return;

    try {
      const serverCart = await this.apiRequest('/api/cart');
      if (serverCart && serverCart.items) {
        // Convert server cart to local format
        this.cart = serverCart.items.map(item => ({
          id: item.id,
          providerId: item.providerService?.provider?.id || 0,
          providerServiceId: item.providerServiceId,
          providerName: item.providerService?.provider?.user?.name || 'Prestador',
          serviceName: item.providerService?.name || item.providerService?.category?.name || 'Serviço',
          price: parseFloat(item.unitPrice || '0'),
          quantity: item.quantity,
          image: this.getServiceImage(item.providerService),
          category: item.providerService?.category || { name: 'Serviços' },
          totalPrice: parseFloat(item.totalPrice || '0'),
          notes: item.notes || ''
        }));
        this.saveCart();
      }
    } catch (error) {
      console.error('Error loading cart from server:', error);
    }
  }

  getServiceImage(providerService) {
    try {
      if (providerService?.images) {
        const images = JSON.parse(providerService.images);
        if (images && images.length > 0) {
          return images[0];
        }
      }
      if (providerService?.provider?.user?.avatar) {
        return providerService.provider.user.avatar;
      }
    } catch (e) {
      console.error('Error parsing service images:', e);
    }
    return this.generateServiceImage(providerService?.name || 'Serviço');
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

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceFee = subtotal * 0.1; // 10% service fee
    const total = subtotal + serviceFee;
    
    if (cartTotal) {
      cartTotal.textContent = total.toFixed(2).replace('.', ',');
    }

    // Add subtotal and service fee display
    const cartSummaryElement = document.getElementById('cart-summary');
    if (cartSummaryElement) {
      cartSummaryElement.innerHTML = `
        <div class="cart-totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="total-row">
            <span>Taxa de serviço (10%):</span>
            <span>R$ ${serviceFee.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="total-row total-final">
            <span><strong>Total:</strong></span>
            <span><strong>R$ <span id="cart-total">${total.toFixed(2).replace('.', ',')}</span></strong></span>
          </div>
        </div>
        <button class="checkout-btn" onclick="window.mobileApp.proceedToCheckout()">
          <i class="fas fa-credit-card"></i>
          Finalizar Pedido
        </button>
      `;
    }

    cartItems.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.serviceName}" onerror="this.src='${this.generateServiceImage(item.serviceName)}'">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.serviceName}</div>
          <div class="cart-item-provider">${item.providerName}</div>
          <div class="cart-item-category">${item.category?.name || 'Serviços'}</div>
          <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')} x ${item.quantity}</div>
        </div>
        <div class="cart-item-controls">
          <button class="quantity-btn" onclick="window.mobileApp.updateQuantity('${item.id}', -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
            <i class="fas fa-minus"></i>
          </button>
          <span class="quantity-display">${item.quantity}</span>
          <button class="quantity-btn" onclick="window.mobileApp.updateQuantity('${item.id}', 1)">
            <i class="fas fa-plus"></i>
          </button>
          <button class="quantity-btn remove-btn" onclick="window.mobileApp.removeFromCart('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Service Details and Category Navigation (keep within mobile app)
  showServiceDetails(providerId) {
    this.showToast('Visualizando detalhes do serviço...', 'info');
    // Could implement a modal or dedicated page within the mobile app
    // For now, show provider info in a toast
    const provider = [...this.popularServices, ...this.currentOffers, ...this.searchResults]
      .find(p => p.id == providerId);
    
    if (provider) {
      const serviceName = provider.services?.[0]?.name || provider.businessName || 'Serviço';
      this.showToast(`${serviceName} - Toque em + para adicionar ao carrinho`, 'info');
    }
  }

  showCategoryServices(categoryId) {
    const category = this.categories.find(c => c.id == categoryId);
    const categoryName = category ? category.name : 'categoria';
    
    // Filter services by category within the mobile app
    this.searchResults = this.popularServices.filter(provider => 
      provider.services && provider.services.some(service => service.categoryId == categoryId)
    );
    
    if (this.searchResults.length > 0) {
      this.renderSearchResults(`Categoria: ${categoryName}`);
      this.showSearchResults();
    } else {
      this.showToast(`Nenhum serviço encontrado na categoria ${categoryName}`, 'warning');
    }
  }

  handleMenuAction(action) {
    console.log('Menu action:', action);
    
    switch(action) {
      case 'profile':
        this.showToast('Redirecionando para o perfil...', 'info');
        setTimeout(() => {
          window.open(`${this.apiBase}/profile`, '_blank');
        }, 500);
        break;
      case 'inbox':
        this.showToast('Redirecionando para mensagens...', 'info');
        setTimeout(() => {
          window.open(`${this.apiBase}/client-chat`, '_blank');
        }, 500);
        break;
      case 'language':
        this.showToast('Idioma: Português (Brasil)', 'info');
        break;
      case 'settings':
        this.showToast('Redirecionando para configurações...', 'info');
        setTimeout(() => {
          window.open(`${this.apiBase}/profile`, '_blank');
        }, 500);
        break;
      case 'track':
        this.showToast('Redirecionando para rastreamento...', 'info');
        setTimeout(() => {
          window.open(`${this.apiBase}/client-reservas`, '_blank');
        }, 500);
        break;
      case 'coupons':
        this.showToast('Redirecionando para cupons...', 'info');
        setTimeout(() => {
          window.open(`${this.apiBase}/client-offers`, '_blank');
        }, 500);
        break;
    }
  }

  performSearch(query) {
    if (!query.trim()) {
      this.showToast('Digite algo para pesquisar', 'warning');
      return;
    }
    
    console.log('Search query:', query);
    this.showToast(`Pesquisando por: "${query}"...`, 'info');
    
    // Could implement search functionality here
    // For now, just show a message
    setTimeout(() => {
      this.showToast('Funcionalidade de pesquisa em desenvolvimento', 'info');
    }, 1000);
  }

  openServiceDetails(providerId) {
    console.log('Open service details for provider:', providerId);
    this.showToast('Abrindo detalhes do serviço...', 'info');
    
    // Could redirect to main app's service details
    setTimeout(() => {
      window.open(`${this.apiBase}/services?provider=${providerId}`, '_blank');
    }, 500);
  }

  openOfferDetails(providerId) {
    console.log('Open offer details for provider:', providerId);
    this.showToast('Abrindo detalhes da oferta...', 'info');
    
    // Could redirect to main app's offer details
    setTimeout(() => {
      window.open(`${this.apiBase}/services?provider=${providerId}`, '_blank');
    }, 500);
  }

  openCategoryServices(categoryId) {
    console.log('Open category services:', categoryId);
    const category = this.categories.find(c => c.id == categoryId);
    const categoryName = category ? category.name : 'categoria';
    
    this.showToast(`Abrindo serviços de ${categoryName}...`, 'info');
    
    // Could redirect to main app's services by category
    setTimeout(() => {
      window.open(`${this.apiBase}/services?category=${categoryId}`, '_blank');
    }, 500);
  }

  handleFabClick() {
    console.log('FAB clicked');
    this.showToast('Adicionar serviço em desenvolvimento', 'info');
  }

  // Checkout functionality
  async proceedToCheckout() {
    if (this.cart.length === 0) {
      this.showToast('Carrinho vazio', 'warning');
      return;
    }
    
    if (!this.isLoggedIn) {
      this.showToast('Faça login para continuar', 'warning');
      setTimeout(() => {
        window.location.href = '/mobile-app/location-register.html';
      }, 1000);
      return;
    }
    
    // Show checkout modal instead of redirecting
    this.showCheckoutModal();
  }

  showCheckoutModal() {
    // Create checkout modal with payment options
    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    modal.id = 'checkout-modal';
    
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceFee = subtotal * 0.1;
    const total = subtotal + serviceFee;
    
    modal.innerHTML = `
      <div class="checkout-modal-content">
        <div class="checkout-header">
          <h3>Finalizar Pedido</h3>
          <button class="close-checkout" onclick="this.closest('.checkout-modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="checkout-body">
          <!-- Order Summary -->
          <div class="checkout-section">
            <h4><i class="fas fa-receipt"></i> Resumo do Pedido</h4>
            <div class="order-summary">
              ${this.cart.map(item => `
                <div class="order-item">
                  <span>${item.serviceName} x${item.quantity}</span>
                  <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              `).join('')}
              <div class="order-totals">
                <div class="order-item">
                  <span>Subtotal:</span>
                  <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="order-item">
                  <span>Taxa de serviço:</span>
                  <span>R$ ${serviceFee.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="order-item total">
                  <span><strong>Total:</strong></span>
                  <span><strong>R$ ${total.toFixed(2).replace('.', ',')}</strong></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Delivery Address -->
          <div class="checkout-section">
            <h4><i class="fas fa-map-marker-alt"></i> Endereço de Entrega</h4>
            <div class="address-form">
              <input type="text" id="checkout-address" placeholder="Endereço completo" value="${this.currentUser?.address || ''}" required>
              <div class="address-row">
                <input type="text" id="checkout-city" placeholder="Cidade" value="${this.currentUser?.city || ''}" required>
                <input type="text" id="checkout-cep" placeholder="CEP" value="${this.currentUser?.cep || ''}" required>
              </div>
              <textarea id="checkout-notes" placeholder="Observações adicionais (opcional)"></textarea>
            </div>
          </div>
          
          <!-- Payment Method -->
          <div class="checkout-section">
            <h4><i class="fas fa-credit-card"></i> Forma de Pagamento</h4>
            <div class="payment-methods">
              <div class="payment-option selected" data-method="cash">
                <i class="fas fa-money-bill-wave"></i>
                <div>
                  <strong>Dinheiro</strong>
                  <small>Pagamento na entrega</small>
                </div>
                <input type="radio" name="payment-method" value="cash" checked>
              </div>
              <div class="payment-option" data-method="pix">
                <i class="fas fa-qrcode"></i>
                <div>
                  <strong>PIX</strong>
                  <small>Pagamento instantâneo</small>
                </div>
                <input type="radio" name="payment-method" value="pix">
              </div>
              <div class="payment-option" data-method="card">
                <i class="fas fa-credit-card"></i>
                <div>
                  <strong>Cartão</strong>
                  <small>Crédito ou débito</small>
                </div>
                <input type="radio" name="payment-method" value="card">
              </div>
            </div>
          </div>
          
          <!-- Scheduling -->
          <div class="checkout-section">
            <h4><i class="fas fa-calendar-alt"></i> Agendamento</h4>
            <div class="scheduling-form">
              <input type="date" id="checkout-date" min="${new Date().toISOString().split('T')[0]}" required>
              <select id="checkout-time" required>
                <option value="">Selecione o horário</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="checkout-footer">
          <button class="btn-secondary" onclick="this.closest('.checkout-modal').remove()">
            Voltar
          </button>
          <button class="btn-primary checkout-confirm" onclick="window.mobileApp.confirmCheckout()">
            <i class="fas fa-check"></i>
            Confirmar Pedido - R$ ${total.toFixed(2).replace('.', ',')}
          </button>
        </div>
      </div>
    `;
    
    // Add modal styles
    if (!document.getElementById('checkout-modal-styles')) {
      this.injectCheckoutModalStyles();
    }
    
    document.body.appendChild(modal);
    
    // Add event listeners for payment method selection
    document.querySelectorAll('.payment-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        option.querySelector('input[type="radio"]').checked = true;
      });
    });
  }

  injectCheckoutModalStyles() {
    const style = document.createElement('style');
    style.id = 'checkout-modal-styles';
    style.textContent = `
      .checkout-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        backdrop-filter: blur(5px);
        overflow-y: auto;
      }
      
      .checkout-modal-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        margin: 20px 0;
      }
      
      .checkout-header {
        display: flex;
        justify-content: between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e5e5;
        background: #f8f9fa;
        border-radius: 12px 12px 0 0;
      }
      
      .checkout-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #2d3748;
        flex-grow: 1;
      }
      
      .close-checkout {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #718096;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .close-checkout:hover {
        background: #e2e8f0;
        color: #2d3748;
      }
      
      .checkout-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }
      
      .checkout-section {
        margin-bottom: 24px;
      }
      
      .checkout-section h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #2d3748;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .order-summary {
        background: #f7fafc;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e2e8f0;
      }
      
      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .order-item:last-child {
        border-bottom: none;
      }
      
      .order-totals {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 2px solid #e2e8f0;
      }
      
      .order-item.total {
        font-size: 18px;
        color: #2d3748;
        border-bottom: none;
        padding-top: 12px;
      }
      
      .address-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .address-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .address-form input,
      .address-form textarea,
      .scheduling-form input,
      .scheduling-form select {
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s ease;
      }
      
      .address-form input:focus,
      .address-form textarea:focus,
      .scheduling-form input:focus,
      .scheduling-form select:focus {
        outline: none;
        border-color: #4299e1;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
      }
      
      .address-form textarea {
        min-height: 80px;
        resize: vertical;
        font-family: inherit;
      }
      
      .payment-methods {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .payment-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: white;
      }
      
      .payment-option:hover {
        border-color: #cbd5e0;
        background: #f7fafc;
      }
      
      .payment-option.selected {
        border-color: #4299e1;
        background: #ebf8ff;
        box-shadow: 0 0 0 1px rgba(66, 153, 225, 0.2);
      }
      
      .payment-option i {
        font-size: 20px;
        color: #4299e1;
        min-width: 20px;
      }
      
      .payment-option div {
        flex: 1;
      }
      
      .payment-option strong {
        display: block;
        font-size: 14px;
        color: #2d3748;
      }
      
      .payment-option small {
        color: #718096;
        font-size: 12px;
      }
      
      .payment-option input[type="radio"] {
        margin: 0;
      }
      
      .scheduling-form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .checkout-footer {
        display: flex;
        gap: 12px;
        padding: 20px;
        border-top: 1px solid #e5e5e5;
        background: #f8f9fa;
        border-radius: 0 0 12px 12px;
      }
      
      .checkout-footer button {
        flex: 1;
        padding: 14px 20px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      
      .btn-secondary {
        background: #e2e8f0;
        color: #4a5568;
      }
      
      .btn-secondary:hover {
        background: #cbd5e0;
      }
      
      .btn-primary {
        background: #4299e1;
        color: white;
      }
      
      .btn-primary:hover {
        background: #3182ce;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
      }
      
      .btn-primary:disabled {
        background: #a0aec0;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      /* Cart item styles */
      .cart-totals {
        background: #f7fafc;
        padding: 16px;
        border-radius: 8px;
        margin-top: 16px;
      }
      
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 14px;
      }
      
      .total-final {
        border-top: 2px solid #e2e8f0;
        padding-top: 12px;
        margin-top: 8px;
        font-size: 16px;
      }
      
      .cart-item-provider {
        font-size: 12px;
        color: #718096;
        margin-bottom: 4px;
      }
      
      .cart-item-category {
        font-size: 11px;
        color: #a0aec0;
        background: #f1f5f9;
        padding: 2px 8px;
        border-radius: 12px;
        display: inline-block;
        margin-bottom: 4px;
      }
      
      .quantity-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .remove-btn {
        color: #e53e3e !important;
      }
      
      .remove-btn:hover {
        background: #fed7d7 !important;
      }
    `;
    document.head.appendChild(style);
  }

  async confirmCheckout() {
    const address = document.getElementById('checkout-address').value;
    const city = document.getElementById('checkout-city').value;
    const cep = document.getElementById('checkout-cep').value;
    const notes = document.getElementById('checkout-notes').value;
    const date = document.getElementById('checkout-date').value;
    const time = document.getElementById('checkout-time').value;
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    if (!address || !city || !cep || !date || !time) {
      this.showToast('Por favor, preencha todos os campos obrigatórios', 'error');
      return;
    }

    const confirmButton = document.querySelector('.checkout-confirm');
    confirmButton.disabled = true;
    confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
      // Prepare order data
      const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const serviceFee = subtotal * 0.1;
      const total = subtotal + serviceFee;

      const orderData = {
        items: this.cart.map(item => ({
          providerServiceId: item.providerServiceId || item.providerId,
          quantity: item.quantity,
          unitPrice: item.price,
          notes: item.notes || `Serviço: ${item.serviceName}`
        })),
        address,
        city,
        cep,
        state: this.currentUser?.state || 'SP',
        notes,
        scheduledDate: date,
        scheduledTime: time,
        paymentMethod,
        totalAmount: total,
        subtotal: subtotal,
        serviceFee: serviceFee
      };

      console.log('Creating order:', orderData);

      // Create order via API
      const response = await this.apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      if (response) {
        // Clear cart
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        
        // Close modal
        document.getElementById('checkout-modal').remove();
        
        // Show success message
        this.showToast('Pedido criado com sucesso! Você receberá atualizações sobre o status.', 'success');
        
        // Switch to orders tab
        setTimeout(() => {
          this.showTab('reservas');
          this.loadReservas();
        }, 2000);
      } else {
        throw new Error('Falha ao criar pedido');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      this.showToast('Erro ao processar pedido. Tente novamente.', 'error');
      
      // Re-enable button
      confirmButton.disabled = false;
      const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const serviceFee = subtotal * 0.1;
      const total = subtotal + serviceFee;
      confirmButton.innerHTML = `<i class="fas fa-check"></i> Confirmar Pedido - R$ ${total.toFixed(2).replace('.', ',')}`;
    }
  }

  // Enhanced quantity management for mobile cart
  async updateQuantity(itemId, delta) {
    const itemIndex = this.cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const newQuantity = this.cart[itemIndex].quantity + delta;
    
    if (newQuantity <= 0) {
      return this.removeFromCart(itemId);
    }

    // Update server cart if logged in
    if (this.isLoggedIn && this.currentUser) {
      try {
        const response = await this.apiRequest('/api/cart/update-quantity', {
          method: 'PATCH',
          body: JSON.stringify({
            cartItemId: this.cart[itemIndex].providerServiceId || this.cart[itemIndex].id,
            quantity: newQuantity
          })
        });

        if (response) {
          this.cart[itemIndex].quantity = newQuantity;
          this.saveCart();
          this.updateCartUI();
          return;
        }
      } catch (error) {
        console.error('Error updating cart quantity on server:', error);
        // Fallback to local update
      }
    }

    // Local cart update
    this.cart[itemIndex].quantity = newQuantity;
    this.saveCart();
    this.updateCartUI();
  }

  // Clear entire cart
  async clearCart() {
    if (this.isLoggedIn && this.currentUser) {
      try {
        await this.apiRequest('/api/cart/clear', {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error clearing server cart:', error);
      }
    }
    
    this.cart = [];
    this.saveCart();
    this.updateCartUI();
    this.showToast('Carrinho limpo', 'success');
  }

  // Show All functions for navigation
  showAllServices() {
    if (this.popularServices.length > 0) {
      this.searchResults = [...this.popularServices];
      this.renderSearchResults('Todos os Serviços');
      this.showSearchResults();
    }
  }

  showAllOffers() {
    if (this.currentOffers.length > 0) {
      this.searchResults = [...this.currentOffers];
      this.renderSearchResults('Todas as Ofertas');
      this.showSearchResults();
    }
  }

  async refreshData() {
    this.showToast('Atualizando dados...', 'info');
    
    try {
      await Promise.all([
        this.loadCategories(),
        this.loadPopularServices(),
        this.loadCurrentOffers()
      ]);
      
      this.showToast('Dados atualizados!', 'success');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      this.showToast('Erro ao atualizar dados', 'error');
    }
  }

  scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

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

  // Authentication Functions
  checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    return !!(token && userData);
  }

  getUserData() {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  updateAuthUI() {
    const profileBtn = document.getElementById('profile-btn');
    if (!profileBtn) return;

    if (this.isLoggedIn) {
      const userData = this.getUserData();
      profileBtn.classList.add('logged-in');
      profileBtn.innerHTML = userData?.name ? 
        `<span style="font-size: 12px; font-weight: 600;">${userData.name.charAt(0).toUpperCase()}</span>` : 
        '<i class="fas fa-user-check"></i>';
      profileBtn.title = userData?.name || 'Perfil';
    } else {
      profileBtn.classList.remove('logged-in');
      profileBtn.innerHTML = '<i class="fas fa-user"></i>';
      profileBtn.title = 'Fazer Login';
    }
  }

  handleLogin(userData, token) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    this.isLoggedIn = true;
    this.updateAuthUI();
    this.showToast(`Bem-vindo, ${userData.name}!`, 'success');
  }

  handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('mobile_cart');
    this.isLoggedIn = false;
    this.cart = [];
    this.updateAuthUI();
    this.updateCartUI();
    this.showToast('Logout realizado com sucesso', 'info');
  }

  requestLocationPermission() {
    // Check if we've already asked for permission
    const hasAskedPermission = localStorage.getItem('mobile_locationPermissionAsked');
    const hasLocation = localStorage.getItem('mobile_userLocation') || localStorage.getItem('selectedCity');
    
    if (hasAskedPermission || hasLocation) {
      return; // Don't ask again
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log('Geolocation not supported by this browser');
      return;
    }

    // Create and show location request modal
    this.showLocationRequestModal();
  }

  showLocationRequestModal() {
    // Create modal HTML similar to the browser's location request
    const modalHtml = `
      <div id="location-request-modal" class="location-request-modal">
        <div class="location-modal-backdrop" onclick="window.mobileApp.closeLocationModal('block')"></div>
        <div class="location-modal-content">
          <div class="location-modal-header">
            <div class="location-modal-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="location-modal-text">
              <p class="location-site">${window.location.host} quer</p>
              <p class="location-message">Saber sua localização</p>
            </div>
            <button class="location-modal-close" onclick="window.mobileApp.closeLocationModal('block')">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="location-modal-buttons">
            <button class="location-btn location-btn-block" onclick="window.mobileApp.handleLocationResponse('block')">
              Bloquear
            </button>
            <button class="location-btn location-btn-once" onclick="window.mobileApp.handleLocationResponse('once')">
              Somente dessa vez
            </button>
            <button class="location-btn location-btn-allow" onclick="window.mobileApp.handleLocationResponse('allow')">
              Permitir
            </button>
          </div>
        </div>
      </div>
    `;

    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add modal styles dynamically
    this.addLocationModalStyles();
  }

  addLocationModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .location-request-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .location-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
      }
      
      .location-modal-content {
        position: relative;
        background: #2d3748;
        border-radius: 8px;
        max-width: 400px;
        width: 100%;
        color: white;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      }
      
      .location-modal-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid #4a5568;
      }
      
      .location-modal-icon {
        color: #4299e1;
        font-size: 20px;
      }
      
      .location-modal-text {
        flex: 1;
      }
      
      .location-site {
        font-size: 13px;
        color: #a0aec0;
        margin: 0 0 2px 0;
      }
      
      .location-message {
        font-size: 14px;
        font-weight: 500;
        margin: 0;
        color: white;
      }
      
      .location-modal-close {
        background: none;
        border: none;
        color: #a0aec0;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      
      .location-modal-close:hover {
        background: #4a5568;
        color: white;
      }
      
      .location-modal-buttons {
        padding: 16px 20px;
        display: flex;
        gap: 8px;
      }
      
      .location-btn {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .location-btn-block,
      .location-btn-once {
        background: #4a5568;
        color: white;
      }
      
      .location-btn-block:hover,
      .location-btn-once:hover {
        background: #2d3748;
      }
      
      .location-btn-allow {
        background: #4299e1;
        color: white;
      }
      
      .location-btn-allow:hover {
        background: #3182ce;
      }
      
      .location-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
    
    document.head.appendChild(style);
  }

  handleLocationResponse(action) {
    const modal = document.getElementById('location-request-modal');
    
    switch (action) {
      case 'block':
        localStorage.setItem('mobile_locationPermissionAsked', 'blocked');
        this.closeLocationModal();
        break;
        
      case 'once':
      case 'allow':
        this.requestCurrentLocation();
        break;
    }
  }

  requestCurrentLocation() {
    // Disable buttons and show loading
    const buttons = document.querySelectorAll('.location-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent !== 'Bloquear') {
        btn.textContent = btn.textContent === 'Permitir' ? 'Obtendo...' : 'Obtendo...';
      }
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Save location data
        const locationData = {
          lat: latitude,
          lng: longitude,
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mobile_userLocation', JSON.stringify(locationData));
        localStorage.setItem('mobile_locationPermissionAsked', 'granted');
        
        // Update the location display in header
        this.updateLocationDisplay(locationData);
        
        // Try to reverse geocode for a better address
        this.reverseGeocodeLocation(latitude, longitude);
        
        this.showToast('Localização obtida com sucesso!', 'success');
        this.closeLocationModal();
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        localStorage.setItem('mobile_locationPermissionAsked', 'denied');
        
        let message = 'Não foi possível obter sua localização.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Permissão de localização negada.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Localização não disponível.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Tempo esgotado para obter localização.';
        }
        
        this.showToast(message, 'warning');
        this.closeLocationModal();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  }

  async reverseGeocodeLocation(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Update stored location with proper address
        const locationData = {
          lat,
          lng,
          address,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mobile_userLocation', JSON.stringify(locationData));
        this.updateLocationDisplay(locationData);
      }
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
    }
  }

  updateLocationDisplay(locationData) {
    const locationElement = document.getElementById('user-location');
    if (locationElement && locationData.address) {
      // Extract a more readable part of the address
      const addressParts = locationData.address.split(',');
      const displayAddress = addressParts.slice(0, 3).join(',').trim();
      locationElement.textContent = displayAddress || locationData.address;
    }
  }

  closeLocationModal(action = null) {
    const modal = document.getElementById('location-request-modal');
    if (modal) {
      modal.remove();
    }
    
    // If blocked by clicking close button, mark as asked
    if (action === 'block') {
      localStorage.setItem('mobile_locationPermissionAsked', 'dismissed');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.mobileApp = new MobileApp();
});

// Global functions for HTML onclick events
window.showTab = function(tab) {
  if (window.mobileApp) {
    window.mobileApp.showTab(tab);
  }
};

window.proceedToCheckout = function() {
  if (window.mobileApp) {
    window.mobileApp.proceedToCheckout();
  }
};

window.handleProfileClick = function() {
  if (window.mobileApp) {
    if (window.mobileApp.isLoggedIn) {
      // Show profile menu
      const userData = window.mobileApp.getUserData();
      const options = [
        { text: 'Ver Perfil', action: () => window.open(`${window.mobileApp.apiBase}/profile`, '_blank') },
        { text: 'Minhas Reservas', action: () => window.open(`${window.mobileApp.apiBase}/client-reservas`, '_blank') },
        { text: 'Configurações', action: () => window.open(`${window.mobileApp.apiBase}/profile`, '_blank') },
        { text: 'Sair', action: () => window.mobileApp.handleLogout() }
      ];
      
      // Show simple menu using confirm for demo
      const choice = confirm(`${userData?.name || 'Usuário'}\n\n1. Ver Perfil\n2. Minhas Reservas\n3. Configurações\n4. Sair\n\nEscolha uma opção (1-4):`);
      
      if (choice) {
        // For demo, just open profile or logout
        const input = prompt('Digite o número da opção (1-4):');
        const optionIndex = parseInt(input) - 1;
        if (optionIndex >= 0 && optionIndex < options.length) {
          options[optionIndex].action();
        }
      }
    } else {
      // Redirect to location-aware registration
      window.location.href = '/mobile-app/location-register.html';
    }
  }
};

// Handle offline/online status
window.addEventListener('online', () => {
  if (window.mobileApp) {
    window.mobileApp.showToast('Conexão restaurada', 'success');
    window.mobileApp.refreshData();
  }
});

window.addEventListener('offline', () => {
  if (window.mobileApp) {
    window.mobileApp.showToast('Sem conexão com a internet', 'warning');
  }
});

// Handle visibility change (when user comes back to app)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.mobileApp) {
    // Refresh data when user comes back
    setTimeout(() => {
      window.mobileApp.refreshData();
    }, 500);
  }
});