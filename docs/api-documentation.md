# Qserviços API Documentation

## 📚 Visão Geral

A API do Qserviços oferece um conjunto completo de endpoints para conectar clientes e prestadores de serviços. Esta documentação detalha todos os endpoints disponíveis, métodos de autenticação e estruturas de dados.

## 🔗 Acesso à Documentação Interativa

A documentação completa e interativa está disponível em:
- **Desenvolvimento**: `http://localhost:5000/api-docs`
- **Produção**: `https://seu-app.replit.app/api-docs`

## 🔐 Autenticação

A API utiliza autenticação JWT (JSON Web Tokens). Para acessar endpoints protegidos:

1. Faça login através do endpoint `/api/auth/login`
2. Use o token retornado no header: `Authorization: Bearer <seu-token>`

### Exemplo de Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'senha123'
  })
});

const { token, user } = await response.json();
```

## 📱 Endpoints Principais

### 🔑 Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login do usuário
- `GET /api/auth/me` - Obter dados do usuário atual

### 👥 Usuários
- `GET /api/users` - Listar usuários (admin)
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário (admin)

### 🏷️ Categorias de Serviços
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria (admin)
- `PUT /api/categories/:id` - Atualizar categoria (admin)
- `DELETE /api/categories/:id` - Excluir categoria (admin)

### 🔧 Serviços (Endpoints Públicos para App Nativo)
- `GET /api/services` - Listar serviços com filtros (categoria, cidade, estado, busca)
- `GET /api/services/:id` - Obter serviço específico com dados do prestador
- `GET /api/services/category/:categoryId` - Serviços por categoria
- `GET /api/services/provider/:providerId` - Serviços de um prestador específico
- `GET /api/services/popular` - Serviços populares baseados em avaliações
- `GET /api/services/search` - Busca avançada com filtros de preço
- `GET /api/services/test` - Endpoint de teste para verificar API
- `GET /api/services/all` - Listar todos os serviços (legacy)

### 🔧 Gerenciamento de Serviços (Autenticado)
- `POST /api/services` - Criar serviço (provider)
- `PUT /api/services/:id` - Atualizar serviço (provider)
- `DELETE /api/services/:id` - Excluir serviço (provider)

### 👨‍🔧 Prestadores
- `GET /api/providers` - Listar prestadores
- `GET /api/providers/popular` - Prestadores populares
- `GET /api/providers/me` - Dados do prestador atual
- `POST /api/providers/apply` - Candidatar-se como prestador
- `PUT /api/providers/:id/status` - Atualizar status (admin)

### 📋 Solicitações de Serviços
- `GET /api/service-requests` - Listar solicitações
- `GET /api/service-requests/client` - Solicitações do cliente
- `GET /api/service-requests/provider` - Solicitações do prestador
- `POST /api/service-requests` - Criar solicitação
- `PUT /api/service-requests/:id/accept` - Aceitar solicitação (provider)
- `PUT /api/service-requests/:id/start` - Iniciar serviço (provider)
- `PUT /api/service-requests/:id/complete` - Finalizar serviço (provider)

### 🛒 Pedidos e Carrinho
- `GET /api/cart` - Obter carrinho
- `POST /api/cart/items` - Adicionar ao carrinho
- `PUT /api/cart/items/:id` - Atualizar item do carrinho
- `DELETE /api/cart/items/:id` - Remover do carrinho
- `POST /api/orders` - Criar pedido
- `GET /api/orders` - Listar pedidos

### 💰 Pagamentos
- `POST /api/payments/create-payment-intent` - Criar intenção de pagamento (Stripe)
- `POST /api/payments/card` - Pagamento com cartão (MercadoPago)
- `POST /api/payments/pix` - Pagamento PIX (MercadoPago)
- `POST /api/payments/webhook` - Webhook de pagamentos

### 💬 Chat
- `GET /api/chat/conversations` - Listar conversas
- `POST /api/chat/conversations` - Criar conversa
- `GET /api/chat/conversations/:id/messages` - Obter mensagens
- `POST /api/chat/conversations/:id/messages` - Enviar mensagem
- `GET /api/chat/unread-count` - Contar mensagens não lidas

### ⭐ Avaliações
- `GET /api/reviews` - Listar avaliações
- `POST /api/reviews` - Criar avaliação
- `GET /api/reviews/provider/:id` - Avaliações do prestador

### 📊 Estatísticas
- `GET /api/stats/client` - Estatísticas do cliente
- `GET /api/stats/provider` - Estatísticas do prestador
- `GET /api/stats/admin` - Estatísticas do admin

### 📤 Upload de Arquivos
- `POST /api/upload/image` - Upload de imagem
- `POST /api/upload/banner` - Upload de banner
- `POST /api/upload/service` - Upload de imagem de serviço
- `POST /api/upload/category` - Upload de imagem de categoria
- `POST /api/upload/provider` - Upload de imagem de prestador
- `POST /api/upload/multiple` - Upload múltiplo

## 🏗️ Estruturas de Dados

### User (Usuário)
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "name": "João Silva",
  "phone": "11999999999",
  "userType": "client",
  "address": "Rua das Flores, 123",
  "cep": "01234-567",
  "city": "São Paulo",
  "state": "SP",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "avatar": "https://example.com/avatar.jpg",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Provider (Prestador)
```json
{
  "id": 1,
  "userId": 1,
  "status": "approved",
  "serviceRadius": 10,
  "basePrice": 50.00,
  "description": "Prestador experiente",
  "rating": 4.8,
  "totalReviews": 25,
  "totalServices": 100
}
```

### Service (Serviço)
```json
{
  "id": 1,
  "providerId": 1,
  "categoryId": 1,
  "name": "Limpeza Residencial",
  "description": "Limpeza completa da casa",
  "price": 80.00,
  "duration": 120,
  "isActive": true
}
```

## 📱 Detalhamento dos Endpoints /services

### GET /api/services
Lista todos os serviços com filtros opcionais para apps nativos.

**Query Parameters:**
- `category` (opcional) - ID da categoria
- `city` (opcional) - Nome da cidade
- `state` (opcional) - Estado (UF)
- `search` (opcional) - Termo de busca no nome/descrição

**Exemplo de Uso:**
```
GET /api/services?category=1&city=Goiania&state=GO&search=limpeza
```

### GET /api/services/:id
Obter detalhes de um serviço específico incluindo dados do prestador.

**Exemplo de Resposta:**
```json
{
  "id": 1,
  "providerId": 7,
  "categoryId": 1,
  "name": "Limpeza Residencial",
  "description": "Limpeza completa da residência",
  "price": "150.00",
  "provider": {
    "id": 7,
    "userId": 14,
    "status": "approved",
    "city": "Goiânia",
    "state": "GO",
    "rating": "4.80"
  }
}
```

### GET /api/services/search
Busca avançada de serviços com múltiplos filtros.

**Query Parameters:**
- `q` (obrigatório) - Termo de busca
- `category` (opcional) - ID da categoria
- `city` (opcional) - Nome da cidade
- `state` (opcional) - Estado (UF)
- `minPrice` (opcional) - Preço mínimo
- `maxPrice` (opcional) - Preço máximo

**Exemplo:**
```
GET /api/services/search?q=encanamento&category=2&minPrice=50&maxPrice=200
```

### GET /api/services/test
Endpoint de diagnóstico para verificar se a API está funcionando.

**Resposta:**
```json
{
  "status": "API Working",
  "version": "1.0",
  "servicesCount": 15,
  "availableEndpoints": [
    "GET /api/services",
    "GET /api/services/:id",
    "GET /api/services/category/:categoryId",
    "GET /api/services/provider/:providerId",
    "GET /api/services/popular",
    "GET /api/services/search?q=term"
  ],
  "sampleService": { /* exemplo de serviço */ }
}
```

## 🚀 Exemplo de Integração Mobile

### React Native
```javascript
class QservicosAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;
  }

  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('qservicos_token', token);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    return response.json();
  }

  // Métodos de autenticação
  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      await this.setToken(response.token);
    }
    return response;
  }

  // Métodos de serviços
  async getServices(filters = {}) {
    const params = new URLSearchParams(filters);
    const endpoint = params.toString() ? `/api/services?${params}` : '/api/services';
    return this.request(endpoint);
  }

  async getServiceById(id) {
    return this.request(`/api/services/${id}`);
  }

  async getServicesByCategory(categoryId) {
    return this.request(`/api/services/category/${categoryId}`);
  }

  async getServicesByProvider(providerId) {
    return this.request(`/api/services/provider/${providerId}`);
  }

  async getPopularServices() {
    return this.request('/api/services/popular');
  }

  async searchServices(searchParams) {
    const params = new URLSearchParams(searchParams);
    return this.request(`/api/services/search?${params}`);
  }

  async createServiceRequest(data) {
    return this.request('/api/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Exemplos de uso
const api = new QservicosAPI('https://seu-app.replit.app');

// Buscar serviços de limpeza em Goiânia
const cleaningServices = await api.getServices({
  category: '1',
  city: 'Goiania',
  state: 'GO'
});

// Buscar serviços por termo
const searchResults = await api.searchServices({
  q: 'encanamento',
  minPrice: '50',
  maxPrice: '200'
});

// Obter serviços populares
const popularServices = await api.getPopularServices();
```

### Flutter
```dart
class QservicosAPI {
  final String baseUrl;
  String? _token;

  QservicosAPI(this.baseUrl);

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('qservicos_token', token);
  }

  Future<Map<String, dynamic>> request(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final requestHeaders = {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
      ...?headers,
    };

    late http.Response response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await http.get(uri, headers: requestHeaders);
        break;
      case 'post':
        response = await http.post(
          uri,
          headers: requestHeaders,
          body: body != null ? json.encode(body) : null,
        );
        break;
      // ... outros métodos
    }

    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await request('/api/auth/login',
      method: 'POST',
      body: {'email': email, 'password': password},
    );
    
    if (response['token'] != null) {
      await setToken(response['token']);
    }
    
    return response;
  }

  // Métodos de serviços
  Future<List<dynamic>> getServices({Map<String, String>? filters}) async {
    String endpoint = '/api/services';
    if (filters != null && filters.isNotEmpty) {
      final params = Uri(queryParameters: filters).query;
      endpoint = '/api/services?$params';
    }
    final response = await request(endpoint);
    return response as List<dynamic>;
  }

  Future<Map<String, dynamic>> getServiceById(int id) async {
    final response = await request('/api/services/$id');
    return response;
  }

  Future<List<dynamic>> getServicesByCategory(int categoryId) async {
    final response = await request('/api/services/category/$categoryId');
    return response as List<dynamic>;
  }

  Future<List<dynamic>> getPopularServices() async {
    final response = await request('/api/services/popular');
    return response as List<dynamic>;
  }

  Future<List<dynamic>> searchServices(Map<String, String> searchParams) async {
    final params = Uri(queryParameters: searchParams).query;
    final response = await request('/api/services/search?$params');
    return response as List<dynamic>;
  }
}
```

## 🔧 Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Não encontrado
- `409` - Conflito (ex: email já existe)
- `500` - Erro interno do servidor

## 🌐 CORS e Headers

A API suporta CORS para permitir requisições de diferentes origens. Headers importantes:

- `Authorization: Bearer <token>` - Para autenticação
- `Content-Type: application/json` - Para dados JSON
- `Accept: application/json` - Para respostas JSON

## 📞 Suporte

Para dúvidas sobre a API, entre em contato:
- Email: suporte@qservicos.com
- Documentação interativa: `/api-docs`