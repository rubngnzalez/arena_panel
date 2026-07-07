/**
 * Cliente API para OpenDesign - Colaboración en diseños
 * Documentación: https://docs.opendesign.co
 */

export interface OpenDesignConfig {
  apiKey: string
  teamId?: string
  baseUrl?: string
}

export interface DesignProject {
  id: string
  name: string
  description?: string
  status: 'active' | 'archived' | 'draft'
  thumbnail?: string
  lastModified: string
  collaboratorCount: number
  fileCount: number
}

export interface DesignFile {
  id: string
  name: string
  type: 'figma' | 'sketch' | 'xd' | 'image'
  thumbnail?: string
  createdAt: string
  updatedAt: string
  url?: string
}

export interface Comment {
  id: string
  fileId: string
  content: string
  author: string
  createdAt: string
  resolved: boolean
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  avatar?: string
}

/**
 * Cliente de OpenDesign
 */
export class OpenDesignClient {
  private config: OpenDesignConfig
  private readonly baseUrl: string

  constructor(config: OpenDesignConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.opendesign.co/v1'
  }

  /**
   * Obtiene los headers de autenticación
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Team-ID': this.config.teamId || '',
    }
  }

  /**
   * Lista los proyectos del equipo
   */
  async listProjects(): Promise<DesignProject[]> {
    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`OpenDesign API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.projects || []
    } catch (error) {
      console.error('Error listing projects:', error)
      return []
    }
  }

  /**
   * Obtiene detalles de un proyecto
   */
  async getProject(projectId: string): Promise<DesignProject | null> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`OpenDesign API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting project:', error)
      return null
    }
  }

  /**
   * Lista los archivos de un proyecto
   */
  async listProjectFiles(projectId: string): Promise<DesignFile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectId}/files`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`OpenDesign API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }

  /**
   * Obtiene comentarios de un archivo
   */
  async getFileComments(fileId: string): Promise<Comment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}/comments`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`OpenDesign API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.comments || []
    } catch (error) {
      console.error('Error getting comments:', error)
      return []
    }
  }

  /**
   * Añade un comentario a un archivo
   */
  async addComment(fileId: string, content: string): Promise<Comment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}/comments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error(`OpenDesign API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error adding comment:', error)
      return null
    }
  }

  /**
   * Lista los miembros del equipo
   */
  async listTeamMembers(): Promise<TeamMember[]> {
    try {
      const response = await fetch(`${this.baseUrl}/team/members`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`OpenDesign API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.members || []
    } catch (error) {
      console.error('Error listing team members:', error)
      return []
    }
  }

  /**
   * Sincroniza un proyecto con OpenDesign
   */
  async syncProject(projectData: {
    name: string
    description?: string
    files?: Array<{ name: string; content: string }>
  }): Promise<DesignProject | null> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/sync`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        throw new Error(`OpenDesign API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error syncing project:', error)
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
   * Obtiene URL de invitación para el equipo
   */
  async getInviteLink(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/team/invite`, {
        method: 'POST',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`OpenDesign API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.inviteUrl || null
    } catch (error) {
      console.error('Error getting invite link:', error)
      return null
    }
  }
}

/**
 * Cliente mock para desarrollo sin API Key real
 */
export class MockOpenDesignClient extends OpenDesignClient {
  private mockProjects: DesignProject[] = [
    {
      id: 'opendesign_1',
      name: 'Identidad Corp - Arena13',
      description: 'Rediseño de identidad visual',
      status: 'active',
      thumbnail: '/api/placeholder/200/150',
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      collaboratorCount: 3,
      fileCount: 12,
    },
    {
      id: 'opendesign_2',
      name: 'UI Kit Dashboard',
      description: 'Sistema de diseño para dashboards',
      status: 'active',
      thumbnail: '/api/placeholder/200/150',
      lastModified: new Date(Date.now() - 172800000).toISOString(),
      collaboratorCount: 2,
      fileCount: 8,
    },
    {
      id: 'opendesign_3',
      name: 'Landing Page SaaS',
      description: 'Diseño de landing para producto SaaS',
      status: 'draft',
      lastModified: new Date(Date.now() - 259200000).toISOString(),
      collaboratorCount: 1,
      fileCount: 5,
    },
  ]

  constructor() {
    super({ apiKey: 'mock', teamId: 'mock' })
  }

  async listProjects(): Promise<DesignProject[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return this.mockProjects
  }

  async getProject(projectId: string): Promise<DesignProject | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return this.mockProjects.find(p => p.id === projectId) || null
  }

  async listProjectFiles(projectId: string): Promise<DesignFile[]> {
    await new Promise(resolve => setTimeout(resolve, 400))

    const mockFiles: DesignFile[] = [
      { id: 'file_1', name: 'Homepage.fig', type: 'figma', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'file_2', name: 'Components.fig', type: 'figma', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'file_3', name: 'Logo.png', type: 'image', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ]

    return mockFiles
  }

  async listTeamMembers(): Promise<TeamMember[]> {
    await new Promise(resolve => setTimeout(resolve, 300))

    return [
      { id: 'member_1', name: 'Admin Arena13', email: 'admin@arenatrece.com', role: 'owner' },
      { id: 'member_2', name: 'Designer One', email: 'designer@arenatrece.com', role: 'editor' },
    ]
  }

  async validateConfig(): Promise<boolean> {
    return true
  }

  async syncProject(projectData: { name: string; description?: string }): Promise<DesignProject | null> {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newProject: DesignProject = {
      id: `opendesign_${Date.now()}`,
      name: projectData.name,
      description: projectData.description,
      status: 'active',
      lastModified: new Date().toISOString(),
      collaboratorCount: 1,
      fileCount: 0,
    }

    this.mockProjects.push(newProject)
    return newProject
  }
}

/**
 * Factory function para crear cliente de OpenDesign
 */
export function createOpenDesignClient(config?: OpenDesignConfig): OpenDesignClient {
  if (!config || !config.apiKey || config.apiKey === 'mock') {
    return new MockOpenDesignClient()
  }

  return new OpenDesignClient(config)
}
