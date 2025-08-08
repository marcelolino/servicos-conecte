// Mobile App JavaScript - Consumes existing APIs
class MobileApp {
  constructor() {
    this.apiBase = window.location.origin;
    this.categories = [];
    this.popularServices = [];
    this.currentOffers = [];
    this.searchResults = [];
    this.cart = JSON.parse(localStorage.getItem('mobile_cart') || '[]');
    this.currentTab = 'home';
    this.isLoggedIn = this.checkAuthStatus();
    this.init();
  }

  async init() {
    // Show loading screen
    this.showLoading();
    
    // Load data from APIs
    await Promise.all([
      this.loadCategories(),
      this.loadPopularServices(),
      this.loadCurrentOffers()
    ]);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update cart UI
    this.updateCartUI();
    
    // Update auth UI
    this.updateAuthUI();
    
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
    document.getElementById('main-app').style.display = 'block';
  }

  async apiRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return [];
    }
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
          <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
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
  proceedToCheckout() {
    if (this.cart.length === 0) {
      this.showToast('Carrinho vazio', 'warning');
      return;
    }

    this.showToast('Redirecionando para checkout...', 'info');
    
    // Save cart to main app's session/localStorage for checkout
    localStorage.setItem('checkout_cart', JSON.stringify(this.cart));
    
    // Redirect to main app's checkout
    setTimeout(() => {
      window.open(`${this.apiBase}/checkout`, '_blank');
    }, 1000);
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
      // Redirect to auth page
      window.location.href = '/mobile/auth';
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