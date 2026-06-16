export interface ExactVenda {
  numeroVenda?: string
  numeroOrcamento?: string
  nomeCliente?: string
  vendedor?: string
  dataVenda?: string
  valorVendido?: number
  valorRevertido?: number
  status?: string
  statusTatico?: string
  cancelada?: boolean
}

export interface ExactMontagem {
  numeroVenda?: string
  nomeCliente?: string
  endereco?: string
  montador?: string
  dataAgendada?: string
  dataRealizada?: string
  status?: string
  problema?: string
  observacoes?: string
}

export interface ExactChecklist {
  nomeCliente?: string
  tipo?: string
  dataChecklist?: string
  status?: string
  pendente?: boolean
  observacoes?: string
}
