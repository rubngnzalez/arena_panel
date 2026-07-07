/**
 * Cliente API para KiloCode - Generación de código con IA
 * Documentación: https://docs.kilocode.ai
 */

export interface KiloCodeConfig {
  apiKey: string
  projectId?: string
  baseUrl?: string
}

export interface CodeTemplate {
  id: string
  name: string
  description: string
  category: 'landing' | 'portfolio' | 'ecommerce' | 'blog' | 'dashboard' | 'custom'
  language: 'typescript' | 'javascript' | 'python' | 'rust'
  framework?: 'react' | 'nextjs' | 'vue' | 'svelte'
}

export interface GenerationRequest {
  template: string
  prompt: string
  context?: string
  targetFramework?: 'react' | 'nextjs' | 'vue' | 'svelte'
  language?: 'typescript' | 'javascript'
  includeStyles?: boolean
  includeTests?: boolean
}

export interface GenerationResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  code?: string
  previewUrl?: string
  error?: string
  metadata?: Record<string, any>
}

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'active' | 'archived'
}

/**
 * Cliente de KiloCode
 */
export class KiloCodeClient {
  private config: KiloCodeConfig
  private readonly baseUrl: string

  constructor(config: KiloCodeConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.kilocode.ai/v1'
  }

  /**
   * Obtiene los headers de autenticación
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Project-ID': this.config.projectId || '',
    }
  }

  /**
   * Genera código a partir de un prompt
   */
  async generateCode(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          template: request.template,
          prompt: request.prompt,
          context: request.context,
          target_framework: request.targetFramework,
          language: request.language || 'typescript',
          include_styles: request.includeStyles ?? true,
          include_tests: request.includeTests ?? false,
        }),
      })

      if (!response.ok) {
        throw new Error(`KiloCode API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating code:', error)
      return {
        id: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Obtiene el estado de una generación
   */
  async getGenerationStatus(generationId: string): Promise<GenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate/${generationId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`KiloCode API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting generation status:', error)
      return {
        id: generationId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Lista los proyectos en KiloCode
   */
  async listProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`KiloCode API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.projects || []
    } catch (error) {
      console.error('Error listing projects:', error)
      return []
    }
  }

  /**
   * Crea un nuevo proyecto en KiloCode
   */
  async createProject(name: string, description?: string): Promise<Project | null> {
    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name, description }),
      })

      if (!response.ok) {
        throw new Error(`KiloCode API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating project:', error)
      return null
    }
  }

  /**
   * Verifica si la configuración es válida
   */
  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Obtiene las plantillas disponibles
   */
  async getTemplates(): Promise<CodeTemplate[]> {
    // Plantillas predefinidas cuando no hay acceso a la API
    const defaultTemplates: CodeTemplate[] = [
      {
        id: 'landing-minimal',
        name: 'Landing Minimal',
        description: 'Landing page limpia y optimizada para conversión',
        category: 'landing',
        language: 'typescript',
        framework: 'nextjs',
      },
      {
        id: 'landing-saas',
        name: 'Landing SaaS',
        description: 'Landing page para producto SaaS con pricing',
        category: 'landing',
        language: 'typescript',
        framework: 'nextjs',
      },
      {
        id: 'portfolio-creative',
        name: 'Portfolio Creativo',
        description: 'Portfolio para diseñador/creativo',
        category: 'portfolio',
        language: 'typescript',
        framework: 'nextjs',
      },
      {
        id: 'portfolio-dev',
        name: 'Portfolio Developer',
        description: 'Portfolio para desarrollador',
        category: 'portfolio',
        language: 'typescript',
        framework: 'nextjs',
      },
      {
        id: 'ecommerce-basic',
        name: 'E-commerce Basic',
        description: 'Tienda online básica con catálogo',
        category: 'ecommerce',
        language: 'typescript',
        framework: 'nextjs',
      },
      {
        id: 'blog-markdown',
        name: 'Blog Markdown',
        description: 'Blog con posts en Markdown',
        category: 'blog',
        language: 'typescript',
        framework: 'nextjs',
      },
      {
        id: 'dashboard-admin',
        name: 'Dashboard Admin',
        description: 'Panel de administración básico',
        category: 'dashboard',
        language: 'typescript',
        framework: 'nextjs',
      },
      {
        id: 'custom-generator',
        name: 'Generador Personalizado',
        description: 'Genera código según tus necesidades',
        category: 'custom',
        language: 'typescript',
      },
    ]

    try {
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        return data.templates || defaultTemplates
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }

    return defaultTemplates
  }
}

/**
 * Cliente mock para desarrollo sin API Key real
 */
export class MockKiloCodeClient extends KiloCodeClient {
  constructor() {
    super({ apiKey: 'mock', projectId: 'mock' })
  }

  async generateCode(request: GenerationRequest): Promise<GenerationResponse> {
    // Simular generación
    await new Promise(resolve => setTimeout(resolve, 2000))

    return {
      id: `mock_${Date.now()}`,
      status: 'completed',
      code: this.getMockCode(request.template, request.targetFramework),
      previewUrl: '#',
      metadata: { template: request.template },
    }
  }

  async validateConfig(): Promise<boolean> {
    return true
  }

  private getMockCode(template: string, framework?: string): string {
    const fw = framework || 'nextjs'

    return `// Código generado para ${template}
// Framework: ${fw}

import React from 'react'

export default function GeneratedPage() {
  return (
    <div className="min-h-screen">
      <h1>Generated Component</h1>
      <p>This is a mock generated code for ${template}</p>
    </div>
  )
}`
  }
}

/**
 * Factory function para crear cliente de KiloCode
 */
export function createKiloCodeClient(config?: KiloCodeConfig): KiloCodeClient {
  if (!config || !config.apiKey || config.apiKey === 'mock') {
    return new MockKiloCodeClient()
  }

  return new KiloCodeClient(config)
}
