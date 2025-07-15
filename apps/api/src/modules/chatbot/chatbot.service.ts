import { inject, injectable } from 'tsyringe'
import type { Chatbot } from '../../domain/entities/chatbot.entity.js'
import type { ICacheService, IQueueService } from '../../shared/interfaces/base.interfaces.js'
import { logger } from '../../shared/utils/logger.js'
import type {
  CreateChatbotDto,
  IChatbotRepository,
  IChatbotService,
  UpdateChatbotDto,
} from './chatbot.interfaces.js'

@injectable()
export class ChatbotService implements IChatbotService {
  constructor(
    @inject('IChatbotRepository') private chatbotRepository: IChatbotRepository,
    @inject('ICacheService') private cacheService: ICacheService,
    @inject('IQueueService') private queueService: IQueueService
  ) {}

  async create(data: CreateChatbotDto): Promise<Chatbot> {
    const chatbot = await this.chatbotRepository.create(data)

    // Clear tenant's chatbot cache
    await this.cacheService.delete(`chatbots:tenant:${data.tenantId}`)

    // Emit event for analytics
    await this.queueService.addJob('analytics', 'chatbot.created', {
      chatbotId: chatbot.id,
      tenantId: data.tenantId,
      timestamp: new Date(),
    })

    logger.info('Chatbot created', { chatbotId: chatbot.id, tenantId: data.tenantId })
    return chatbot
  }

  async findById(id: string): Promise<Chatbot | null> {
    // Try cache first
    const cached = await this.cacheService.get<Chatbot>(`chatbot:${id}`)
    if (cached) return cached

    const chatbot = await this.chatbotRepository.findById(id)

    if (chatbot) {
      // Cache for 5 minutes
      await this.cacheService.set(`chatbot:${id}`, chatbot, 300)
    }

    return chatbot
  }

  async findByEmbedId(embedId: string): Promise<Chatbot | null> {
    // Try cache first
    const cached = await this.cacheService.get<Chatbot>(`chatbot:embed:${embedId}`)
    if (cached) return cached

    const chatbot = await this.chatbotRepository.findByEmbedId(embedId)

    if (chatbot) {
      // Cache for 5 minutes
      await this.cacheService.set(`chatbot:embed:${embedId}`, chatbot, 300)
    }

    return chatbot
  }

  async findAllByTenant(tenantId: string): Promise<Chatbot[]> {
    // Try cache first
    const cached = await this.cacheService.get<Chatbot[]>(`chatbots:tenant:${tenantId}`)
    if (cached) return cached

    const chatbots = await this.chatbotRepository.findAllByTenant(tenantId)

    // Cache for 5 minutes
    await this.cacheService.set(`chatbots:tenant:${tenantId}`, chatbots, 300)

    return chatbots
  }

  async update(id: string, data: UpdateChatbotDto): Promise<Chatbot> {
    const chatbot = await this.chatbotRepository.update(id, data)

    // Clear caches
    await this.cacheService.delete(`chatbot:${id}`)
    await this.cacheService.delete(`chatbot:embed:${chatbot.embedId}`)
    await this.cacheService.delete(`chatbots:tenant:${chatbot.tenantId}`)

    // Emit event for analytics
    await this.queueService.addJob('analytics', 'chatbot.updated', {
      changes: Object.keys(data),
      chatbotId: chatbot.id,
      tenantId: chatbot.tenantId,
      timestamp: new Date(),
    })

    logger.info('Chatbot updated', { chatbotId: id })
    return chatbot
  }

  async delete(id: string): Promise<void> {
    const chatbot = await this.findById(id)
    if (!chatbot) {
      throw new Error('Chatbot not found')
    }

    await this.chatbotRepository.delete(id)

    // Clear caches
    await this.cacheService.delete(`chatbot:${id}`)
    await this.cacheService.delete(`chatbot:embed:${chatbot.embedId}`)
    await this.cacheService.delete(`chatbots:tenant:${chatbot.tenantId}`)

    // Emit event for analytics
    await this.queueService.addJob('analytics', 'chatbot.deleted', {
      chatbotId: id,
      tenantId: chatbot.tenantId,
      timestamp: new Date(),
    })

    logger.info('Chatbot deleted', { chatbotId: id })
  }

  async generateEmbedScript(chatbotId: string): Promise<string> {
    const chatbot = await this.findById(chatbotId)
    if (!chatbot) {
      throw new Error('Chatbot not found')
    }

    // Generate embed script
    const script = `<!-- ${chatbot.name} Chatbot -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['SaaSChatbot']=o;w[o]=w[o]||function(){
    (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','chatbot','${process.env.WIDGET_CDN_URL || 'https://widget.yourplatform.com'}/embed/${chatbot.embedId}.js'));
  
  chatbot('init', {
    embedId: '${chatbot.embedId}',
    position: '${chatbot.placement?.position || 'bottom-right'}',
    theme: ${JSON.stringify(chatbot.theme || {})},
    behaviors: ${JSON.stringify(chatbot.behaviors || {})}
  });
</script>`

    return script
  }
}
