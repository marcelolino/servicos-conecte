# API Services Endpoints - Documentação para App Nativo

## Endpoints Disponíveis

### 1. **GET /api/services**
Busca todos os serviços com filtros opcionais
```
GET /api/services?category=1&city=Goiania&state=GO&search=limpeza
```

**Query Parameters:**
- `category` (opcional): ID da categoria
- `city` (opcional): Nome da cidade
- `state` (opcional): Estado (UF)
- `search` (opcional): Termo de busca (nome ou descrição)

**Response:**
```json
[
  {
    "id": 1,
    "providerId": 7,
    "categoryId": 1,
    "name": "Limpeza Residencial",
    "description": "Limpeza completa da residência",
    "price": "150.00",
    "minimumPrice": "100.00",
    "estimatedDuration": "3 horas",
    "isActive": true
  }
]
```

### 2. **GET /api/services/:id**
Busca um serviço específico por ID (inclui dados do provedor)
```
GET /api/services/1
```

**Response:**
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

### 3. **GET /api/services/category/:categoryId**
Busca serviços por categoria
```
GET /api/services/category/1
```

### 4. **GET /api/services/provider/:providerId**
Busca serviços de um provedor específico
```
GET /api/services/provider/7
```

### 5. **GET /api/services/popular**
Busca serviços populares (baseado na avaliação dos provedores)
```
GET /api/services/popular
```

### 6. **GET /api/services/search**
Busca avançada de serviços
```
GET /api/services/search?q=limpeza&category=1&city=Goiania&minPrice=50&maxPrice=200
```

**Query Parameters:**
- `q` (obrigatório): Termo de busca
- `category` (opcional): ID da categoria
- `city` (opcional): Nome da cidade
- `state` (opcional): Estado (UF)
- `minPrice` (opcional): Preço mínimo
- `maxPrice` (opcional): Preço máximo

### 7. **GET /api/services/all** (Legacy)
Busca todos os serviços (mantido para compatibilidade)
```
GET /api/services/all
```

## Outros Endpoints Úteis

### Categorias
- `GET /api/categories` - Lista todas as categorias

### Provedores
- `GET /api/providers/popular` - Lista provedores populares
- `GET /api/providers/:id` - Dados de um provedor específico

### Banners/Promoções
- `GET /api/banners` - Lista banners promocionais

## Exemplos de Uso no App Nativo

### Buscar serviços de limpeza em Goiânia:
```
GET /api/services?category=1&city=Goiania&state=GO
```

### Buscar por termo específico:
```
GET /api/services/search?q=encanamento
```

### Obter detalhes de um serviço:
```
GET /api/services/123
```

### Listar serviços populares:
```
GET /api/services/popular
```

## Status Codes
- `200` - Sucesso
- `400` - Parâmetros inválidos
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## Notas
- Todos os endpoints `/api/services/*` são públicos (não precisam de autenticação)
- Os preços são retornados como string com 2 casas decimais
- Campos opcionais podem retornar `null` se não preenchidos