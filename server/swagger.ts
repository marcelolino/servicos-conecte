import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qserviços API',
      version: '1.0.0',
      description: 'API completa para plataforma de serviços Qserviços - conectando clientes e prestadores de serviços',
      contact: {
        name: 'Qserviços Support',
        email: 'suporte@qservicos.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://qservicos.replit.app' 
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token para autenticação. Use: Bearer <seu-token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'joao@example.com' },
            name: { type: 'string', example: 'João Silva' },
            phone: { type: 'string', example: '11999999999' },
            userType: { 
              type: 'string', 
              enum: ['client', 'provider', 'admin', 'employee'],
              example: 'client'
            },
            address: { type: 'string', example: 'Rua das Flores, 123' },
            cep: { type: 'string', example: '01234-567' },
            city: { type: 'string', example: 'São Paulo' },
            state: { type: 'string', example: 'SP' },
            latitude: { type: 'number', format: 'decimal', example: -23.5505 },
            longitude: { type: 'number', format: 'decimal', example: -46.6333 },
            avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Provider: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            status: { 
              type: 'string', 
              enum: ['pending', 'approved', 'rejected', 'suspended'],
              example: 'approved'
            },
            serviceRadius: { type: 'integer', example: 10 },
            basePrice: { type: 'number', format: 'decimal', example: 50.00 },
            description: { type: 'string', example: 'Prestador experiente em limpeza' },
            experience: { type: 'string', example: '5 anos de experiência' },
            rating: { type: 'number', format: 'decimal', example: 4.8 },
            totalReviews: { type: 'integer', example: 25 },
            totalServices: { type: 'integer', example: 100 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            providerId: { type: 'integer', example: 1 },
            categoryId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Limpeza Residencial' },
            description: { type: 'string', example: 'Limpeza completa da casa' },
            price: { type: 'number', format: 'decimal', example: 80.00 },
            duration: { type: 'integer', example: 120 },
            isActive: { type: 'boolean', example: true }
          }
        },
        ServiceCategory: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Limpeza' },
            description: { type: 'string', example: 'Serviços de limpeza residencial e comercial' },
            icon: { type: 'string', example: 'cleaning' },
            imageUrl: { type: 'string', example: 'https://example.com/category.jpg' },
            color: { type: 'string', example: '#3B82F6' },
            isActive: { type: 'boolean', example: true }
          }
        },
        ServiceRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            clientId: { type: 'integer', example: 1 },
            categoryId: { type: 'integer', example: 1 },
            serviceId: { type: 'integer', example: 1 },
            providerId: { type: 'integer', example: 1 },
            description: { type: 'string', example: 'Preciso de limpeza completa' },
            address: { type: 'string', example: 'Rua das Flores, 123' },
            scheduledFor: { type: 'string', format: 'date-time' },
            status: { 
              type: 'string', 
              enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
              example: 'pending'
            },
            price: { type: 'number', format: 'decimal', example: 80.00 },
            notes: { type: 'string', example: 'Observações do cliente' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            clientId: { type: 'integer', example: 1 },
            providerId: { type: 'integer', example: 1 },
            status: { 
              type: 'string', 
              enum: ['cart', 'pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled'],
              example: 'confirmed'
            },
            totalAmount: { type: 'number', format: 'decimal', example: 150.00 },
            paymentMethod: { 
              type: 'string', 
              enum: ['digital', 'cash', 'credit_card', 'debit_card', 'pix'],
              example: 'pix'
            },
            paymentStatus: { 
              type: 'string', 
              enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
              example: 'completed'
            },
            scheduledFor: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' }
          }
        },
        ChatConversation: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            participantOneId: { type: 'integer', example: 1 },
            participantTwoId: { type: 'integer', example: 2 },
            serviceRequestId: { type: 'integer', example: 1 },
            status: { 
              type: 'string', 
              enum: ['active', 'closed', 'archived'],
              example: 'active'
            },
            lastMessageAt: { type: 'string', format: 'date-time' }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            conversationId: { type: 'integer', example: 1 },
            senderId: { type: 'integer', example: 1 },
            message: { type: 'string', example: 'Olá, gostaria de agendar o serviço' },
            status: { 
              type: 'string', 
              enum: ['sent', 'delivered', 'read'],
              example: 'delivered'
            },
            sentAt: { type: 'string', format: 'date-time' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            serviceRequestId: { type: 'integer', example: 1 },
            clientId: { type: 'integer', example: 1 },
            providerId: { type: 'integer', example: 1 },
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', example: 'Excelente serviço!' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Erro na operação' },
            code: { type: 'string', example: 'INVALID_INPUT' },
            details: { type: 'object' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'joao@example.com' },
            password: { type: 'string', format: 'password', example: 'senha123' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'userType'],
          properties: {
            email: { type: 'string', format: 'email', example: 'joao@example.com' },
            password: { type: 'string', format: 'password', example: 'senha123' },
            name: { type: 'string', example: 'João Silva' },
            phone: { type: 'string', example: '11999999999' },
            userType: { 
              type: 'string', 
              enum: ['client', 'provider'],
              example: 'client'
            },
            address: { type: 'string', example: 'Rua das Flores, 123' },
            cep: { type: 'string', example: '01234-567' },
            city: { type: 'string', example: 'São Paulo' },
            state: { type: 'string', example: 'SP' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./server/routes.ts'], // Caminho para os arquivos com documentação
};

export const specs = swaggerJsdoc(options);