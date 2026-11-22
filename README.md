# SaúdeConecta — Ambiente de demonstração

## Iniciar API e banco

Em um terminal, na pasta do projeto:

```powershell
node .\Backend\server.mjs
```

A API inicia na porta `8000`. O SQLite é criado automaticamente em `Database/saudeconecta.sqlite` usando `Database/schema.sql`.

## Iniciar o frontend

Em outro terminal:

```powershell
Set-Location .\saudeconecta\frontend
npm.cmd run dev -- --host 0.0.0.0
```

No computador, abra `http://localhost:5173`. O Vite encaminha `/api` para a API local. Computador e Android precisam estar na mesma rede Wi-Fi; no Android, abra `http://IP-DO-COMPUTADOR:5173` no navegador.

## Dados de demonstração

Entre com um perfil de paciente e use **Simular dados** no topo. Isso cria registros fictícios de família, dependentes, consulta, pesagem, vacinação, visita e smartwatch para aquele perfil. Quando a API estiver ativa, os registros são gravados no SQLite; também ficam em `localStorage` para a interface funcionar sem a API.Ou entre com outros perfis já criados para testes.

Verifique a API em `http://localhost:8000/api/health`.

Este ambiente não tem autenticação, autorização real nem conexão com wearables. Não use dados de pacientes reais nem exponha os servidores à internet.
