// Mobile App JavaScript - Consumes existing APIs
class MobileApp {
  constructor() {
    this.apiBase = window.location.origin;
    this.categories = [];
    this.popularServices = [];
    this.currentOffers = [];
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
        // Remove active class from all items
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');
        
        const text = item.querySelector('span').textContent.toLowerCase();
        this.handleNavigation(text);
      });
    });

    // More menu toggle
    const moreNavItem = document.querySelector('.nav-item:last-child');
    const moreMenu = document.getElementById('more-menu');
    const closeMenu = document.querySelector('.close-menu');

    if (moreNavItem && moreMenu) {
      moreNavItem.addEventListener('click', () => {
        moreMenu.style.display = 'block';
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
        const text = item.querySelector('span').textContent.toLowerCase();
        this.handleMenuAction(text);
        if (moreMenu) moreMenu.style.display = 'none';
      });
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchInput && searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.performSearch(searchInput.value);
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch(searchInput.value);
        }
      });
    }

    // Service and offer card clicks
    document.addEventListener('click', (e) => {
      const serviceCard = e.target.closest('.service-card');
      const offerCard = e.target.closest('.offer-card');
      const categoryItem = e.target.closest('.category-item');

      if (serviceCard) {
        const providerId = serviceCard.dataset.providerId;
        this.openServiceDetails(providerId);
      } else if (offerCard) {
        const providerId = offerCard.dataset.providerId;
        this.openOfferDetails(providerId);
      } else if (categoryItem) {
        const categoryId = categoryItem.dataset.categoryId;
        this.openCategoryServices(categoryId);
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
      }
    });

    // FAB button
    const fab = document.querySelector('.fab');
    if (fab) {
      fab.addEventListener('click', () => {
        this.handleFabClick();
      });
    }

    // Banner indicators
    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        // Could implement banner slide change here
      });
    });
  }

  handleNavigation(section) {
    console.log('Navigate to:', section);
    
    switch(section) {
      case 'home':
        // Already on home - could refresh data
        this.refreshData();
        break;
      case 'bookings':
        this.showToast('Funcionalidade de reservas em desenvolvimento', 'info');
        break;
      case 'offers':
        this.scrollToSection('.offers-section');
        break;
      case 'more':
        // Handled by menu toggle
        break;
    }
  }

  handleMenuAction(action) {
    console.log('Menu action:', action);
    
    switch(action) {
      case 'profile':
        this.showToast('Redirecionando para o perfil...', 'info');
        // Could redirect to main app's profile page
        window.open(`${this.apiBase}/profile`, '_blank');
        break;
      case 'inbox':
        this.showToast('Caixa de entrada em desenvolvimento', 'info');
        break;
      case 'language':
        this.showToast('Seleção de idioma em desenvolvimento', 'info');
        break;
      case 'settings':
        this.showToast('Configurações em desenvolvimento', 'info');
        break;
      case 'track booking':
        this.showToast('Rastreamento de reservas em desenvolvimento', 'info');
        break;
      case 'coupons':
        this.showToast('Cupons em desenvolvimento', 'info');
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

  async refreshData() {
    this.showToast('Atualizando dados...', 'info');
    
    try {
      await Promise.all([
        this.loadCategories(),
        this.loadPopularServices(),
        this.loadCurrentOffers()
      ]);
      
      this.showToast('Dados atualizados com sucesso!', 'success');
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.mobileApp = new MobileApp();
});

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