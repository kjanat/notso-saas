import type { FastifyReply, FastifyRequest } from 'fastify'

// Authentication context
export interface AuthContext {
  id: string
  email: string
  tenantId: string
  role?: string
}

// Authenticated request
export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthContext
}

// Generic request with typed body
export interface TypedRequest<TBody> extends AuthenticatedRequest {
  body: TBody
}

// Generic request with typed params
export interface TypedParamsRequest<TParams> extends AuthenticatedRequest {
  params: TParams
}

// Generic request with typed query
export interface TypedQueryRequest<TQuery> extends AuthenticatedRequest {
  query: TQuery
}

// Combined typed request
export interface TypedFullRequest<TBody, TParams, TQuery> extends AuthenticatedRequest {
  body: TBody
  params: TParams
  query: TQuery
}

// Reply helpers
export type TypedReply = FastifyReply
