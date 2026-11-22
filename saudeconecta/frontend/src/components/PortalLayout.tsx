import { Alert, AppBar, Box, Button, Snackbar, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { simularDadosDoPerfil } from "../api";
import { lerPerfil, ROTULOS_PERFIL, type PerfilTipo } from "../types";

type LinkPainel = { texto: string; rota: string };
const linksPorPerfil: Record<PerfilTipo, LinkPainel[]> = {
  paciente: [{ texto: "Início", rota: "/dashboard" }, { texto: "Agendar", rota: "/agendar" }, { texto: "Consultas", rota: "/consultas" }, { texto: "Minha família", rota: "/familias" }, { texto: "Pesagem", rota: "/pesagem" }, { texto: "Vacinação", rota: "/vacinacao" }, { texto: "Smartwatch", rota: "/saude-conectada" }, { texto: "QR Code", rota: "/qr-code" }],
  medico: [{ texto: "Início", rota: "/dashboard" }, { texto: "Minha agenda", rota: "/consultas" }],
  agente: [{ texto: "Início", rota: "/dashboard" }, { texto: "Visitas", rota: "/visitas" }, { texto: "Famílias", rota: "/familias" }],
  recepcao: [{ texto: "Início", rota: "/dashboard" }, { texto: "Atendimento", rota: "/consultas" }, { texto: "Famílias", rota: "/familias" }],
  coordenacao: [{ texto: "Início", rota: "/dashboard" }, { texto: "Indicadores", rota: "/consultas" }, { texto: "Famílias", rota: "/familias" }],
  agenda: [{ texto: "Início", rota: "/dashboard" }, { texto: "Agendar consulta", rota: "/agendar" }, { texto: "Agenda da unidade", rota: "/consultas" }],
  cadastro: [{ texto: "Início", rota: "/dashboard" }, { texto: "Cadastros", rota: "/familias" }],
};

export default function PortalLayout() {
  const [simulando, setSimulando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const perfil = lerPerfil();
  const navigate = useNavigate();
  const location = useLocation();
  if (!perfil) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  const perfilId = perfil.id;

  async function simularDados() {
    const confirmou = window.confirm("Carregar dados fictícios para este perfil? Isso substituirá os dados atuais deste paciente no protótipo.");
    if (!confirmou) return;
    setSimulando(true);
    const salvouNoBanco = await simularDadosDoPerfil(perfilId);
    setMensagem(salvouNoBanco ? "Dados fictícios carregados e salvos no SQLite." : "Dados fictícios carregados localmente. Inicie a API para gravar no SQLite.");
    setSimulando(false);
    window.setTimeout(() => window.location.reload(), 1300);
  }

  return (
    <>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar sx={{ flexWrap: "wrap", gap: 1, py: 1 }}>
          <Box sx={{ flexGrow: 1, minWidth: 180 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>SaúdeConecta</Typography>
            <Typography variant="caption">{perfil.nome} · {ROTULOS_PERFIL[perfil.tipo]}</Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
            {perfil.tipo === "paciente" && <Button color="inherit" size="small" onClick={simularDados} disabled={simulando}>{simulando ? "Carregando…" : "Simular dados"}</Button>}
            {linksPorPerfil[perfil.tipo].map((link) => (
              <Button key={link.rota} color="inherit" size="small" onClick={() => navigate(link.rota)} aria-current={location.pathname === link.rota ? "page" : undefined} sx={{ textDecoration: location.pathname === link.rota ? "underline" : "none" }}>
                {link.texto}
              </Button>
            ))}
            <Button color="inherit" size="small" onClick={() => { localStorage.removeItem("saudeconecta:perfil"); navigate("/"); }}>Sair</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Outlet />
      <Snackbar open={Boolean(mensagem)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}><Alert severity="info">{mensagem}</Alert></Snackbar>
    </>
  );
}
