# Central Aliança 360

Dashboard operacional e comercial da Aliança Móveis — centraliza consultores externos, visitas, vendas, montagens, checklist, agendamentos, pendências e divergências em um único painel.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS**
- **PostgreSQL** + **Prisma ORM**
- **NextAuth.js v5** (autenticação com credenciais)
- **xlsx** para leitura de planilhas Excel/CSV
- **Playwright** para automação dos sistemas externos

---

## 1. Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ rodando localmente ou em nuvem
- (Opcional) Playwright para automação: `npx playwright install chromium`

---

## 2. Instalação

```bash
cd central-alianca-360
npm install
```

---

## 3. Configurar `.env`

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

Edite `.env`:

```env
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/central_alianca_360

# NextAuth — gere com: openssl rand -base64 32
NEXTAUTH_SECRET=sua-chave-secreta-aqui
NEXTAUTH_URL=http://localhost:3000

# Exact (sistema externo — automação Playwright)
EXACT_URL=https://url-do-exact.com.br
EXACT_USER=seu-usuario
EXACT_PASSWORD=sua-senha

# Minha Visita (sistema externo — automação Playwright)
MINHA_VISITA_URL=https://url-do-minhavisita.com.br
MINHA_VISITA_USER=seu-usuario
MINHA_VISITA_PASSWORD=sua-senha
```

> **Segurança:** O arquivo `.env` nunca é versionado. Senhas nunca são salvas no banco, logs ou screenshots.

---

## 4. Criar banco de dados

Crie o banco no PostgreSQL:

```sql
CREATE DATABASE central_alianca_360;
```

---

## 5. Rodar migrations do Prisma

```bash
npm run prisma:migrate
```

Isso cria todas as tabelas: users, consultores, clientes, visitas, vendas, montagens, checklists, divergencias, importacoes, comissoes, etc.

---

## 6. Rodar seed (dados fictícios)

```bash
npm run prisma:seed
```

O seed cria:
- **Usuário admin:** `admin@aliancamoveis.com.br` / senha: `admin123`
- **Usuário gestor:** `gestor@aliancamoveis.com.br` / senha: `gestor123`
- 3 consultores fictícios
- 5 clientes, 5 visitas, 5 vendas, 3 montagens, 2 checklists
- Divergências e pendências de exemplo

---

## 7. Iniciar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

Login com `admin@aliancamoveis.com.br` / `admin123`

---

## 8. Rodar automação Playwright

### Exact

```bash
npm run automation:exact
```

O robô irá:
1. Abrir o navegador
2. Fazer login no Exact com as credenciais do `.env`
3. Baixar relatórios de vendas, montagens, checklist e agendamentos
4. Salvar em `/storage/imports/exact/`
5. Registrar logs em `integration_jobs` e `integration_job_logs`

> **Importante:** Os seletores CSS/HTML do Exact ainda precisam ser mapeados. Veja os arquivos em `automation/exact/` — cada função tem comentários `// TODO:` indicando onde mapear os seletores reais da tela.

### Minha Visita

```bash
npm run automation:minha-visita
```

Mesmo processo, para o sistema Minha Visita.

---

## 9. Upload manual de planilhas

1. Acesse o menu **Importações**
2. Selecione o tipo: Vendas, Visitas, Montagens, Checklist, Status Tático ou Valores Revertidos
3. Faça upload do arquivo `.xlsx`, `.xls` ou `.csv`
4. O sistema processa automaticamente, evita duplicidades e gera logs
5. Divergências são criadas automaticamente quando necessário

### Colunas esperadas por tipo:

**Vendas:** `nomeCliente`, `dataVenda`, `valorVendido`, `valorRevertido`, `numeroVenda`, `numeroOrcamento`, `vendedor`, `status`, `cancelada`

**Visitas:** `nomeCliente`, `dataVisita`, `tipoVisita`, `telefone`, `endereco`, `status`, `observacoes`

**Montagens:** `nomeCliente`, `numeroVenda`, `endereco`, `montador`, `dataAgendada`, `dataRealizada`, `status`

---

## 10. Executar sincronização manual

Na tela de **Integrações**, clique em **Sincronizar Exact** ou **Sincronizar Minha Visita**.

Isso registra um job no banco. Para executar a sincronização completa via Playwright, rode os comandos acima no terminal.

---

## 11. Acessar logs

**Via interface:** Menu → Integrações → Logs Recentes

**Via Prisma Studio:**
```bash
npm run prisma:studio
```
Acesse as tabelas `integration_job_logs` e `importacao_logs`.

**Screenshots de erro:** Salvos em `/storage/screenshots/`

---

## 12. Adicionar novos relatórios no Exact

1. Abra `automation/exact/`
2. Crie um novo arquivo `exact.download-[nome].ts`
3. Siga o padrão dos arquivos existentes
4. Mapeie os seletores com `page.fill()`, `page.click()`, etc.
5. Importe e chame no `exact.client.ts`
6. Registre logs com `logConsole()`

---

## 13. Adicionar novos relatórios no Minha Visita

Mesmo processo em `automation/minha-visita/`:
1. Crie `minha-visita.download-[nome].ts`
2. Mapeie seletores (os `// TODO:` marcam onde mapear)
3. Importe no `minha-visita.client.ts`

---

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia em modo produção |
| `npm run lint` | Verifica código |
| `npm run prisma:migrate` | Roda migrations |
| `npm run prisma:studio` | Abre Prisma Studio |
| `npm run prisma:seed` | Popula banco com dados fictícios |
| `npm run automation:exact` | Roda automação Playwright do Exact |
| `npm run automation:minha-visita` | Roda automação Playwright do Minha Visita |

---

## Perfis de usuário

| Perfil | Permissões |
|--------|-----------|
| `admin` | Acesso total — importar, sincronizar, confirmar divergências, editar |
| `gestor` | Visualizar, importar, confirmar divergências |
| `consultor` | Ver apenas seus próprios dados |
| `visualizador` | Somente leitura |

---

## Estrutura de diretórios

```
central-alianca-360/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Tela de login
│   ├── (dashboard)/        # Todas as páginas protegidas
│   └── api/                # Rotas de API
├── automation/
│   ├── exact/              # Playwright — Exact
│   ├── minha-visita/       # Playwright — Minha Visita
│   └── shared/             # Browser, logger, downloads
├── components/
│   ├── layout/             # Sidebar, Topbar
│   ├── tables/             # DataTable
│   └── ui/                 # StatCard, StatusBadge, etc.
├── lib/                    # auth, prisma, normalize, dates, money
├── prisma/                 # schema.prisma + seed.ts
├── server/services/        # Lógica de negócio
├── storage/                # Arquivos gerados (não versionados)
│   ├── imports/
│   ├── screenshots/
│   └── processed/
└── .env.example
```

---

## Mapeamento dos seletores (TODO)

Os seletores CSS/HTML dos sistemas externos (Exact e Minha Visita) precisam ser mapeados após acesso real às telas. Busque por `// TODO:` nos arquivos de automação:

```bash
grep -r "TODO" automation/
```

Cada TODO indica um seletor ou ação que deve ser preenchido após inspecionar a tela real do sistema.
