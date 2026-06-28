# Zuppi MVP

Aplicacao web MVP em React + TypeScript + Tailwind para compras coletivas B2B.

## Rodar localmente

1. `npm install`
2. `npm run dev`
3. Abrir `http://localhost:5173`

## Build de producao

- `npm run build`
- `npm run preview`

## Rotas principais

- `/` Home publica
- `/auth` Escolha e cadastro/login simulado
- `/ofertas` Lista de ofertas
- `/ofertas/:id` Detalhe da oferta e reserva
- `/comprador` Dashboard comprador
- `/comprador/pedidos` Meus pedidos
- `/fornecedor` Dashboard fornecedor
- `/fornecedor/criar-oferta` Form de nova oferta
- `/admin` Painel administrativo

## Regras MVP implementadas

- Oferta so confirma status de meta quando `reservedQty >= minGoal`.
- Antes disso, reserva e intencao de compra.
- Quando meta e batida, status vira `meta_atingida`.
- Comprador enxerga status atualizado em Meus pedidos.
- Fornecedor enxerga volume consolidado no dashboard.
- Dados persistidos em `localStorage`.
