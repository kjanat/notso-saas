# Domain-Driven Design: Multi-Tenant 3D Avatar AI Chatbot Platform

## Bounded Contexts

### 1. Tenant Management Context

**Purpose**: Manage multi-tenancy, subscriptions, and platform-level user access

**Aggregates**:

- **`Tenant`** (Aggregate Root)
  - `TenantId` (Value Object)
  - `TenantSlug` (Value Object)
  - `SubscriptionPlan` (Value Object)
  - `DatabaseCredentials` (Value Object)
  - `BillingInformation` (Entity)
  - `ChatbotQuota` (Value Object)

**Domain Events**:

- `TenantCreated`
- `TenantUpgraded`
- `TenantSuspended`
- `TenantReactivated`
- `ChatbotQuotaExceeded`

### 2. Chatbot Configuration Context

**Purpose**: Manage multiple chatbot instances per tenant with unique 3D avatars and deployment configurations

**Aggregates**:

- **`Chatbot`** (Aggregate Root)
  - `ChatbotId` (Value Object)
  - `EmbedId` (Value Object) // Unique identifier for embed script
  - `DeploymentKey` (Value Object)
  - `PersonalityProfile` (Entity)
  - `Avatar3DConfiguration` (Entity)
  - `KnowledgeBase` (Entity)
  - `PlacementRules` (Entity)
  - `InteractionBehaviors` (Entity)

**Domain Events**:

- `ChatbotCreated`
- `ChatbotDeployed`
- `ChatbotConfigurationUpdated`
- `Avatar3DModelChanged`
- `AnimationMappingUpdated`
- `KnowledgeBaseUpdated`
- `EmbedScriptRegenerated`

### 3. Avatar Management Context

**Purpose**: Manage 3D avatar models, animations, and interactive behaviors

**Aggregates**:

- **`Avatar3D`** (Aggregate Root)
  - `AvatarId` (Value Object)
  - `ModelAsset` (Entity) // .glb file reference
  - `AnimationLibrary` (Entity Collection) // ~20 animations
  - `InteractionHandlers` (Entity)
  - `BehaviorRules` (Entity)

**Domain Events**:

- `AvatarModelUploaded`
- `AnimationAdded`
- `InteractionBehaviorUpdated`
- `AvatarActivated`

### 4. Conversation Context

**Purpose**: Handle real-time chat sessions with avatar synchronization

**Aggregates**:

- **`Conversation`** (Aggregate Root)
  - `ConversationId` (Value Object)
  - `ChatbotId` (Value Object)
  - `Visitor` (Entity)
  - `MessageThread` (Entity Collection)
  - `ConversationMetrics` (Value Object)
  - `AvatarState` (Entity)

**Domain Events**:

- `ConversationStarted`
- `MessageReceived`
- `MessageSent`
- `ConversationEnded`
- `SentimentAnalyzed`
- `AnimationTriggered`
- `AvatarInteractionOccurred`

### 5. AI Processing Context

**Purpose**: Handle AI/ML operations, sentiment analysis, animation selection, and response generation

**Aggregates**:

- **`AIJob`** (Aggregate Root)
  - `JobId` (Value Object)
  - `ChatbotId` (Value Object)
  - `ProcessingPipeline` (Entity)
  - `ModelConfiguration` (Value Object)
  - `ResponseStrategy` (Entity)
  - `AnimationSelector` (Entity)

**Domain Events**:

- `AIJobQueued`
- `ProcessingStarted`
- `ResponseGenerated`
- `SentimentCalculated`
- `AnimationSelected`
- `KnowledgeBaseQueried`

### 6. Knowledge Base Context

**Purpose**: Manage per-chatbot knowledge bases with RAG capabilities

**Aggregates**:

- **`KnowledgeBase`** (Aggregate Root)
  - `KnowledgeBaseId` (Value Object)
  - `ChatbotId` (Value Object)
  - `DocumentCollection` (Entity Collection)
  - `VectorIndex` (Entity)
  - `TrainingConfig` (Value Object)

**Domain Events**:

- `KnowledgeBaseCreated`
- `DocumentAdded`
- `VectorIndexUpdated`
- `TrainingCompleted`

### 7. Analytics Context

**Purpose**: Aggregate and report on multi-chatbot performance with per-avatar metrics

**Aggregates**:

- **`AnalyticsReport`** (Aggregate Root)
  - `ReportId` (Value Object)
  - `ChatbotId` (Value Object)
  - `MetricsCollection` (Entity)
  - `TimeRange` (Value Object)
  - `Aggregations` (Entity Collection)
  - `AvatarInteractionMetrics` (Entity)

**Read Models**:

- `ConversationSummaryView`
- `ChatbotPerformanceView`
- `VisitorInsightsView`
- `AvatarEngagementView`
- `AnimationUsageView`

### 8. Platform Administration Context

**Purpose**: System-wide administration, monitoring, and compliance

**Aggregates**:

- **`SystemConfiguration`** (Aggregate Root)
  - `SecuritySettings` (Entity)
  - `ComplianceRules` (Entity)
  - `SystemLimits` (Value Object)
  - `AvatarLibrary` (Entity)

**Domain Events**:

- `SecurityPolicyUpdated`
- `ComplianceRuleAdded`
- `SystemLimitChanged`
- `DefaultAvatarAdded`

## Cross-Context Integration

### Domain Services

```typescript
interface TenantProvisioningService {
  provisionNewTenant(command: CreateTenantCommand): Promise<TenantId>
  createTenantDatabase(tenantId: TenantId): Promise<void>
  setupDefaultChatbot(tenantId: TenantId): Promise<ChatbotId>
  assignChatbotQuota(tenantId: TenantId, plan: SubscriptionPlan): Promise<void>
}

interface ChatbotDeploymentService {
  createChatbot(command: CreateChatbotCommand): Promise<ChatbotId>
  generateEmbedScript(chatbotId: ChatbotId): Promise<EmbedScript>
  assignAvatar(chatbotId: ChatbotId, avatarId: AvatarId): Promise<void>
  updatePlacementRules(chatbotId: ChatbotId, rules: PlacementRules): Promise<void>
}

interface ConversationRoutingService {
  routeIncomingMessage(embedId: string, message: IncomingMessage): Promise<void>
  assignToAIProcessor(conversation: Conversation): Promise<void>
  syncAvatarState(conversationId: ConversationId, animation: string): Promise<void>
}

interface Avatar3DService {
  uploadModel(file: File, metadata: ModelMetadata): Promise<AvatarId>
  validateAnimations(avatarId: AvatarId): Promise<ValidationResult>
  mapAnimationTriggers(avatarId: AvatarId, mapping: AnimationMapping): Promise<void>
  getAnimationForSentiment(sentiment: SentimentScore): Promise<string>
}

interface MultiTenantDataService {
  executeInTenantContext<T>(tenantId: TenantId, operation: () => Promise<T>): Promise<T>
  validateTenantAccess(userId: UserId, tenantId: TenantId): Promise<boolean>
  validateChatbotAccess(chatbotId: ChatbotId, tenantId: TenantId): Promise<boolean>
}
```

### Anti-Corruption Layers

```typescript
// Legacy CSV Import Adapter
interface LegacyDataAdapter {
  transformCsvToConversation(csvRow: any): Conversation
  enrichWithAI(conversation: Conversation): Promise<EnrichedConversation>
}

// External AI Service Adapter
interface AIServiceAdapter {
  generateResponse(context: ConversationContext): Promise<AIResponse>
  analyzeSentiment(message: string): Promise<SentimentScore>
}
```

## Value Objects

```typescript
// Strong typing for domain concepts
type TenantId = Brand<string, 'TenantId'>
type ChatbotId = Brand<string, 'ChatbotId'>
type ConversationId = Brand<string, 'ConversationId'>
type DeploymentKey = Brand<string, 'DeploymentKey'>
type EmbedId = Brand<string, 'EmbedId'>
type AvatarId = Brand<string, 'AvatarId'>
type KnowledgeBaseId = Brand<string, 'KnowledgeBaseId'>

interface TenantSlug {
  value: string
  validate(): boolean
  toString(): string
}

interface SubscriptionPlan {
  tier: 'trial' | 'starter' | 'professional' | 'enterprise'
  limits: {
    chatbots: number
    conversationsPerMonth: number
    teamMembers: number
    customAvatars: number
    knowledgeBases: number
    storageGB: number
  }
}

interface Avatar3DConfiguration {
  modelUrl: string // CDN URL to .glb file
  animationMap: Map<string, AnimationConfig>
  interactionZones: InteractionZone[]
  defaultPosition: Vector3
  scale: number
}

interface AnimationConfig {
  name: string
  triggers: AnimationTrigger[]
  duration: number
  loop: boolean
  priority: number
}

interface AnimationTrigger {
  type: 'sentiment' | 'intent' | 'interaction' | 'idle'
  condition: string
  probability: number
}

interface PlacementRules {
  pages: string[] // URL patterns
  position: 'bottom-right' | 'bottom-left' | 'center' | 'custom'
  triggerDelay: number
  showConditions: ShowCondition[]
}

interface SentimentScore {
  value: number // -1 to 1
  confidence: number
  emotions: Map<Emotion, number>
  suggestedAnimation?: string
}

interface EmbedScript {
  embedId: string
  scriptUrl: string
  configuration: {
    chatbotId: string
    position: string
    theme: string
    autoLoad: boolean
  }
}
```

## Repository Interfaces

```typescript
interface TenantRepository {
  findById(id: TenantId): Promise<Tenant | null>
  findBySlug(slug: string): Promise<Tenant | null>
  save(tenant: Tenant): Promise<void>
  existsByDatabaseName(dbName: string): Promise<boolean>
  getChatbotCount(tenantId: TenantId): Promise<number>
}

interface ChatbotRepository {
  findById(id: ChatbotId): Promise<Chatbot | null>
  findByEmbedId(embedId: EmbedId): Promise<Chatbot | null>
  findByDeploymentKey(key: DeploymentKey): Promise<Chatbot | null>
  findAllByTenant(tenantId: TenantId): Promise<Chatbot[]>
  save(chatbot: Chatbot): Promise<void>
  countByTenant(tenantId: TenantId): Promise<number>
}

interface Avatar3DRepository {
  findById(id: AvatarId): Promise<Avatar3D | null>
  findByTenant(tenantId: TenantId): Promise<Avatar3D[]>
  findDefault(): Promise<Avatar3D[]>
  save(avatar: Avatar3D): Promise<void>
  saveAnimation(avatarId: AvatarId, animation: Animation): Promise<void>
}

interface ConversationRepository {
  findById(id: ConversationId): Promise<Conversation | null>
  findActiveByVisitor(visitorId: string, chatbotId: ChatbotId): Promise<Conversation | null>
  save(conversation: Conversation): Promise<void>
  appendMessage(conversationId: ConversationId, message: Message): Promise<void>
  updateAvatarState(conversationId: ConversationId, state: AvatarState): Promise<void>
}

interface KnowledgeBaseRepository {
  findById(id: KnowledgeBaseId): Promise<KnowledgeBase | null>
  findByChatbot(chatbotId: ChatbotId): Promise<KnowledgeBase | null>
  save(knowledgeBase: KnowledgeBase): Promise<void>
  addDocument(knowledgeBaseId: KnowledgeBaseId, document: Document): Promise<void>
  searchSimilar(knowledgeBaseId: KnowledgeBaseId, query: string, limit: number): Promise<Document[]>
}
```

## Saga Orchestration

```typescript
// Tenant Onboarding Saga
class TenantOnboardingSaga {
  async handle(command: CreateTenantCommand): Promise<void> {
    // 1. Create tenant in platform DB
    const tenantId = await this.tenantService.createTenant(command)

    // 2. Provision tenant database
    await this.databaseService.createTenantDatabase(tenantId)

    // 3. Create default chatbot with avatar
    const chatbotId = await this.chatbotService.createDefaultChatbot(tenantId)

    // 4. Assign default 3D avatar
    const defaultAvatarId = await this.avatarService.getDefaultAvatar()
    await this.chatbotService.assignAvatar(chatbotId, defaultAvatarId)

    // 5. Generate embed script
    await this.embedService.generateScript(chatbotId)

    // 6. Setup billing
    await this.billingService.createCustomer(tenantId)

    // 7. Send welcome email with quickstart guide
    await this.notificationService.sendWelcome(tenantId, chatbotId)
  }
}

// Chatbot Creation Saga
class ChatbotCreationSaga {
  async handle(command: CreateChatbotCommand): Promise<void> {
    // 1. Validate chatbot quota
    const canCreate = await this.tenantService.checkChatbotQuota(command.tenantId)
    if (!canCreate) throw new QuotaExceededException()

    // 2. Create chatbot
    const chatbotId = await this.chatbotService.create(command)

    // 3. Create knowledge base
    const knowledgeBaseId = await this.knowledgeService.createKnowledgeBase(chatbotId)

    // 4. Assign avatar
    await this.avatarService.assignAvatar(chatbotId, command.avatarId)

    // 5. Generate unique embed script
    const embedScript = await this.embedService.generateScript(chatbotId)

    // 6. Configure placement rules
    await this.placementService.configureRules(chatbotId, command.placementRules)

    // 7. Publish chatbot created event
    await this.eventBus.publish(new ChatbotCreatedEvent(chatbotId, embedScript))
  }
}

// Conversation Processing Saga with Avatar
class ConversationProcessingSaga {
  async handle(event: MessageReceivedEvent): Promise<void> {
    // 1. Get chatbot configuration
    const chatbot = await this.chatbotService.getByChatbotId(event.chatbotId)

    // 2. Search knowledge base if available
    let context = null
    if (chatbot.knowledgeBaseId) {
      context = await this.knowledgeService.searchRelevant(
        chatbot.knowledgeBaseId,
        event.message.content
      )
    }

    // 3. Analyze sentiment
    const sentiment = await this.aiService.analyzeSentiment(event.message)

    // 4. Generate AI response with context
    const response = await this.aiService.generateResponse({
      ...event,
      context,
      personality: chatbot.personality,
    })

    // 5. Select appropriate animation
    const animation = await this.avatarService.selectAnimation({
      sentiment,
      intent: response.intent,
      chatbotId: event.chatbotId,
    })

    // 6. Store in conversation with avatar state
    await this.conversationService.appendMessages(event.conversationId, [event.message, response])
    await this.conversationService.updateAvatarState(event.conversationId, {
      currentAnimation: animation,
      sentiment,
    })

    // 7. Send via WebSocket with animation command
    await this.realtimeService.sendMessage(event.visitorId, {
      message: response,
      animation,
      avatarAction: 'playAnimation',
    })

    // 8. Update analytics
    await this.analyticsService.trackInteraction({
      ...event,
      sentiment,
      animation,
    })
  }
}

// Avatar Upload Saga
class AvatarUploadSaga {
  async handle(command: UploadAvatarCommand): Promise<void> {
    // 1. Validate file format (.glb)
    const validation = await this.avatarService.validateModel(command.file)
    if (!validation.isValid) throw new InvalidModelException(validation.errors)

    // 2. Extract animations from model
    const animations = await this.avatarService.extractAnimations(command.file)

    // 3. Upload to CDN
    const modelUrl = await this.storageService.uploadAvatar(command.file)

    // 4. Create avatar record
    const avatarId = await this.avatarService.createAvatar({
      tenantId: command.tenantId,
      modelUrl,
      animations,
    })

    // 5. Map default animation triggers
    await this.avatarService.mapDefaultTriggers(avatarId, animations)

    // 6. Generate preview
    await this.avatarService.generatePreview(avatarId)

    // 7. Publish avatar ready event
    await this.eventBus.publish(new AvatarReadyEvent(avatarId))
  }
}
```

## Event Sourcing for Audit

```typescript
interface AuditableEvent {
  aggregateId: string
  aggregateType: string
  eventType: string
  eventData: any
  metadata: {
    userId?: string
    tenantId: string
    timestamp: Date
    ipAddress?: string
    correlationId: string
  }
}

class EventStore {
  async append(event: AuditableEvent): Promise<void>
  async getEvents(aggregateId: string): Promise<AuditableEvent[]>
  async getEventsByTenant(tenantId: string, from: Date, to: Date): Promise<AuditableEvent[]>
}
```
