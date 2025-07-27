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

### 🔧 Serviços
- `GET /api/services` - Listar serviços
- `GET /api/services/all` - Listar todos os serviços
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
  async getServices() {
    return this.request('/api/services');
  }

  async createServiceRequest(data) {
    return this.request('/api/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Uso
const api = new QservicosAPI('https://seu-app.replit.app');
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