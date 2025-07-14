# API Reference

Base URL: `http://localhost:3000`

## Authentication

All API requests require JWT authentication except for login/register endpoints.

### Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### POST /auth/register

Create new tenant account.

**Request:**

```json
{
  "email": "admin@company.com",
  "password": "SecurePassword123!",
  "name": "Company Name",
  "slug": "company-slug"
}
```

**Response:** `201 Created`

```json
{
  "tenant": {
    "id": "clh3m2n5c0000356tmg5vwxyz",
    "name": "Company Name",
    "slug": "company-slug"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/login

Authenticate user.

**Request:**

```json
{
  "email": "admin@company.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "admin@company.com",
    "tenantId": "tenant-id"
  }
}
```

### Tenants

#### GET /tenants/me

Get current tenant details.

**Response:** `200 OK`

```json
{
  "id": "tenant-id",
  "name": "Company Name",
  "slug": "company-slug",
  "subscription": {
    "plan": "professional",
    "maxChatbots": 20,
    "currentChatbots": 3
  }
}
```

### Chatbots

#### GET /chatbots

List all chatbots for tenant.

**Response:** `200 OK`

```json
{
  "chatbots": [
    {
      "id": "chatbot-id",
      "name": "Sales Assistant",
      "embedId": "abc123def456",
      "purpose": "sales",
      "isActive": true
    }
  ]
}
```

#### POST /chatbots

Create new chatbot.

**Request:**

```json
{
  "name": "Support Bot",
  "purpose": "support",
  "avatar": {
    "modelUrl": "https://cdn.example.com/model.glb",
    "scale": 1.0,
    "position": { "x": 0, "y": 0, "z": 0 }
  },
  "personality": {
    "traits": "helpful, friendly",
    "systemPrompt": "You are a helpful support agent..."
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "chatbot-id",
  "embedId": "xyz789abc123",
  "embedScript": "<script src='https://api.example.com/embed/xyz789abc123.js'></script>",
  "name": "Support Bot"
}
```

#### GET /chatbots/:id

Get chatbot details.

#### PUT /chatbots/:id

Update chatbot configuration.

#### DELETE /chatbots/:id

Delete chatbot.

### Conversations

#### POST /conversations/start

Start new conversation.

**Request:**

```json
{
  "chatbotId": "chatbot-id",
  "sessionId": "unique-session-id",
  "metadata": {
    "pageUrl": "https://example.com/products",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:** `201 Created`

```json
{
  "conversationId": "conv-id",
  "sessionId": "unique-session-id",
  "chatbot": {
    "name": "Sales Assistant",
    "avatar": { ... }
  }
}
```

#### POST /conversations/:id/messages

Send message in conversation.

**Request:**

```json
{
  "content": "Tell me about your pricing",
  "type": "user"
}
```

**Response:** `200 OK`

```json
{
  "messageId": "msg-id",
  "response": {
    "content": "Our pricing starts at $99/month...",
    "animation": "talking",
    "sentiment": "positive"
  }
}
```

### AI Providers

#### GET /ai/providers

List available AI providers.

**Response:** `200 OK`

```json
{
  "providers": ["openai", "anthropic", "vertex"]
}
```

#### POST /ai/generate

Generate AI response (internal use).

**Request:**

```json
{
  "provider": "openai",
  "messages": [
    { "role": "system", "content": "You are..." },
    { "role": "user", "content": "Hello" }
  ],
  "options": {
    "model": "gpt-4",
    "temperature": 0.7,
    "stream": true
  }
}
```

## WebSocket Events

Connect to: `ws://localhost:3001`

### Client Events

#### join

Join conversation room.

```json
{
  "conversationId": "conv-id",
  "sessionId": "session-id"
}
```

#### message

Send chat message.

```json
{
  "conversationId": "conv-id",
  "content": "Hello"
}
```

### Server Events

#### message

Receive chat message.

```json
{
  "id": "msg-id",
  "content": "Hello! How can I help?",
  "role": "assistant",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

#### stream

Streaming response chunks.

```json
{
  "chunk": "I can help you with",
  "isComplete": false
}
```

#### animation

Avatar animation trigger.

```json
{
  "type": "gesture",
  "animation": "wave",
  "duration": 2000
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

Common HTTP status codes:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
