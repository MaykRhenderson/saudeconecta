import { useState } from "react";
import { Alert, Box, Button, Container, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { sincronizarPerfilAoEntrar } from "../api";
import { PERFIL_STORAGE_KEY, PERFIS_DEMO, ROTULOS_PERFIL, type PerfilTipo } from "../types";

function grupoDoPerfil(tipo: PerfilTipo) {
  if (tipo === "paciente") return "Pessoa usuária";
  if (tipo === "medico" || tipo === "agente") return "Equipe de saúde";
  const posicoes: Record<Extract<PerfilTipo, "recepcao" | "coordenacao" | "agenda" | "cadastro">, number> = {
    recepcao: 1,
    coordenacao: 2,
    agenda: 3,
    cadastro: 4,
  };
  return `Equipe administrativa — ${posicoes[tipo]} de 4`;
}

export default function Login() {
  const navigate = useNavigate();
  const [perfilId, setPerfilId] = useState(PERFIS_DEMO[0].id);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setCarregando(true);
    localStorage.setItem(PERFIL_STORAGE_KEY, perfilId);
    if (PERFIS_DEMO.find((perfil) => perfil.id === perfilId)?.tipo === "paciente") {
      await sincronizarPerfilAoEntrar(perfilId);
    }
    navigate("/dashboard");
  }

  return (
    <Box sx={{ minHeight: "100svh", background: "linear-gradient(135deg, #e3f2fd, #f5f7fa)", display: "flex", alignItems: "center", py: 3 }}>
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4 }}>
          <Typography component="div" aria-hidden="true" align="center" sx={{ fontSize: "3.5rem", mb: 1 }}>🏥</Typography>
          <Typography variant="h3" component="h1" align="center" sx={{ color: "#1565c0", fontWeight: 700, mb: 1 }}>SaúdeConecta</Typography>
          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>Protótipo de atendimento da UBS Jardim das Flores</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>Escolha um perfil para explorar as telas. A API e o banco SQLite salvam os dados quando estiverem em execução; o navegador mantém uma cópia local.</Alert>
          <TextField select fullWidth label="Entrar como" value={perfilId} onChange={(event) => setPerfilId(event.target.value)}>
            {PERFIS_DEMO.map((perfil) => (
              <MenuItem key={perfil.id} value={perfil.id}>
                {grupoDoPerfil(perfil.tipo)}: {perfil.nome} — {ROTULOS_PERFIL[perfil.tipo]}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" fullWidth size="large" sx={{ mt: 3, height: 50 }} onClick={entrar} disabled={carregando}>{carregando ? "Carregando perfil…" : "Abrir painel do perfil"}</Button>
        </Paper>
      </Container>
    </Box>
  );
}
