import { container, injectable } from 'tsyringe'
import type {
  IAIProvider,
  IChatRequest,
  IChatResponse,
  IStreamResponse,
} from '../interfaces/ai.interfaces.js'
import { BaseAIProvider } from './base.provider.js'

@injectable()
export class VertexAIProvider extends BaseAIProvider implements IAIProvider {
  private readonly projectId: string
  private readonly location: string
  private readonly apiKey: string | undefined

  constructor() {
    super()
    const config = container.resolve<{
      vertex: { projectId: string; location: string; apiKey?: string }
    }>('config')
    this.projectId = config.vertex.projectId
    this.location = config.vertex.location
    this.apiKey = config.vertex.apiKey
  }

  async chat(request: IChatRequest): Promise<IChatResponse> {
    const model = request.model || 'gemini-1.5-pro'
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:generateContent`

    const vertexRequest = {
      contents: [
        {
          parts: [{ text: request.messages[request.messages.length - 1].content }],
          role: 'user',
        },
      ],
      generationConfig: {
        maxOutputTokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.7,
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
      ],
    }

    if (request.messages.length > 1) {
      // Convert message history to Vertex AI format
      vertexRequest.contents = request.messages.map(msg => ({
        parts: [{ text: msg.content }],
        role: msg.role === 'assistant' ? 'model' : 'user',
      }))
    }

    const response = await fetch(endpoint, {
      body: JSON.stringify(vertexRequest),
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vertex AI error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]

    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error('No response generated from Vertex AI')
    }

    const content = candidate.content.parts[0].text
    const usage = data.usageMetadata

    return {
      content,
      finishReason: candidate.finishReason?.toLowerCase() || 'stop',
      usage: {
        completionTokens: usage?.candidatesTokenCount || 0,
        promptTokens: usage?.promptTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
      },
    }
  }

  async *streamChat(request: IChatRequest): AsyncGenerator<IStreamResponse> {
    const model = request.model || 'gemini-1.5-pro'
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:streamGenerateContent`

    const vertexRequest = {
      contents: request.messages.map(msg => ({
        parts: [{ text: msg.content }],
        role: msg.role === 'assistant' ? 'model' : 'user',
      })),
      generationConfig: {
        maxOutputTokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.7,
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
      ],
    }

    const response = await fetch(endpoint, {
      body: JSON.stringify(vertexRequest),
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vertex AI error: ${response.status} - ${error}`)
    }

    // Vertex AI uses newline-delimited JSON for streaming
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue

        try {
          const data = JSON.parse(line)
          const candidate = data.candidates?.[0]

          if (candidate?.content?.parts?.[0]?.text) {
            yield {
              choices: [
                {
                  delta: {
                    content: candidate.content.parts[0].text,
                  },
                  finishReason: candidate.finishReason?.toLowerCase(),
                },
              ],
            }
          }

          if (data.usageMetadata) {
            yield {
              choices: [
                {
                  delta: {},
                  finishReason: 'stop',
                },
              ],
              usage: {
                completionTokens: data.usageMetadata.candidatesTokenCount || 0,
                promptTokens: data.usageMetadata.promptTokenCount || 0,
                totalTokens: data.usageMetadata.totalTokenCount || 0,
              },
            }
          }
        } catch (err) {
          console.error('Failed to parse Vertex AI stream chunk:', err)
        }
      }
    }
  }

  async embedText(text: string): Promise<number[]> {
    const model = 'text-embedding-004'
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`

    const response = await fetch(endpoint, {
      body: JSON.stringify({
        instances: [
          {
            content: text,
            taskType: 'RETRIEVAL_DOCUMENT',
          },
        ],
      }),
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vertex AI embeddings error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const embeddings = data.predictions?.[0]?.embeddings?.values

    if (!embeddings || !Array.isArray(embeddings)) {
      throw new Error('No embeddings returned from Vertex AI')
    }

    return embeddings
  }
}
