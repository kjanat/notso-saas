import { BaseEntity } from './base.entity.js'

export enum KnowledgeBaseType {
  FAQ = 'FAQ',
  DOCUMENTATION = 'DOCUMENTATION',
  PRODUCTS = 'PRODUCTS',
  CUSTOM = 'CUSTOM',
}

export interface Document {
  id: string
  knowledgeBaseId: string
  title: string
  content: string
  embedding?: number[]
  metadata?: {
    source?: string
    author?: string
    createdDate?: string
    tags?: string[]
    category?: string
    [key: string]: string | string[] | undefined
  }
  createdAt: Date
  updatedAt: Date
}

export class KnowledgeBase extends BaseEntity {
  tenantId: string
  name: string
  type: KnowledgeBaseType
  description?: string
  documents: Document[]

  constructor(data: {
    id?: string
    tenantId: string
    name: string
    type: KnowledgeBaseType
    description?: string
    documents?: Document[]
    createdAt?: Date
    updatedAt?: Date
  }) {
    super({ createdAt: data.createdAt, id: data.id, updatedAt: data.updatedAt })
    this.tenantId = data.tenantId
    this.name = data.name
    this.type = data.type
    this.description = data.description
    this.documents = data.documents || []
  }

  addDocument(
    document: Omit<Document, 'id' | 'knowledgeBaseId' | 'createdAt' | 'updatedAt'>
  ): Document {
    const newDocument: Document = {
      ...document,
      createdAt: new Date(),
      id: this.generateId(),
      knowledgeBaseId: this.id,
      updatedAt: new Date(),
    }
    this.documents.push(newDocument)
    this.markUpdated()
    return newDocument
  }

  removeDocument(documentId: string): void {
    const index = this.documents.findIndex(doc => doc.id === documentId)
    if (index === -1) {
      throw new Error('Document not found')
    }
    this.documents.splice(index, 1)
    this.markUpdated()
  }

  updateDocument(
    documentId: string,
    updates: Partial<Pick<Document, 'title' | 'content' | 'metadata'>>
  ): void {
    const document = this.documents.find(doc => doc.id === documentId)
    if (!document) {
      throw new Error('Document not found')
    }
    Object.assign(document, updates, { updatedAt: new Date() })
    this.markUpdated()
  }

  getDocumentCount(): number {
    return this.documents.length
  }

  searchDocuments(query: string): Document[] {
    const lowercaseQuery = query.toLowerCase()
    return this.documents.filter(
      doc =>
        doc.title.toLowerCase().includes(lowercaseQuery) ||
        doc.content.toLowerCase().includes(lowercaseQuery)
    )
  }
}
