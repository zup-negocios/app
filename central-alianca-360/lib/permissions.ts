type Role = 'admin' | 'gestor' | 'consultor' | 'visualizador'

const permissoes: Record<string, Role[]> = {
  importar: ['admin', 'gestor'],
  sincronizar: ['admin'],
  confirmarDivergencias: ['admin', 'gestor'],
  editarDados: ['admin'],
  configuracoesCriticas: ['admin'],
  verTodosDashboards: ['admin', 'gestor', 'visualizador'],
  verPropriosDados: ['consultor'],
}

export function temPermissao(role: Role, acao: string): boolean {
  return permissoes[acao]?.includes(role) ?? false
}

export function isAdmin(role: string): boolean {
  return role === 'admin'
}

export function isGestor(role: string): boolean {
  return role === 'gestor' || role === 'admin'
}
