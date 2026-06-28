# 🚀 Evolution API - Setup Local com Docker

## Passo 1: Iniciar Evolution API

Abra o PowerShell na pasta `G:\Meu Drive\Zup` e execute:

```powershell
docker-compose up -d
```

Isso vai:
- Baixar a imagem Evolution API (~500MB)
- Iniciar Evolution API na porta **8080**
- Iniciar Banco de Dados Postgres automaticamente

**Espere 30-60 segundos para tudo iniciar.**

---

## Passo 2: Verificar se está rodando

```powershell
docker ps
```

Você deve ver 2 containers rodando:
- `evolution-api-zup`
- `evolution-db-zup`

---

## Passo 3: Acessar Evolution API

Abra no navegador:
```
http://localhost:8080
```

Se aparecer a página do Evolution, está funcionando! ✅

---

## Passo 4: Testar WhatsApp no Zup

1. Acesse: `http://localhost:3000/gestao`
2. Vá em **Gestão → WhatsApp → Conexão**
3. Clique em **"Gerar QR Code"**
4. Escaneie com seu WhatsApp no celular
5. ✅ Pronto! Conectado!

---

## Parar Evolution API

```powershell
docker-compose down
```

---

## Logs em tempo real

```powershell
docker-compose logs -f evolution-api
```

---

## 📱 Testar envio de mensagem

Depois que conectar, crie um comprador ou fornecedor no Zup.
A mensagem será enviada automaticamente via WhatsApp! 🎉
