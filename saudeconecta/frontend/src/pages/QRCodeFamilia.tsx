import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Alert, Box, Button, Container, Paper, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { usePerfilPaciente } from "../hooks/usePerfilPaciente";
import { lerFamiliaDoPerfil } from "../types";

export default function QRCodeFamilia() {
  const { paciente, perfilAtual } = usePerfilPaciente();
  const familia = lerFamiliaDoPerfil(paciente.id);
  const [mensagem, setMensagem] = useState("");

  async function compartilhar() {
    const dados = `Família: ${familia?.responsavel}\nID: ${familia?.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "QR Code familiar", text: dados });
      else {
        await navigator.clipboard.writeText(dados);
        setMensagem("Identificação copiada para a área de transferência.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setMensagem("Não foi possível compartilhar. Verifique a permissão do navegador.");
      }
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 6 } }}>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>QR Code familiar</Typography>
        {!familia ? (
          <>
            <Typography color="text.secondary" sx={{ mb: 3 }}>Cadastre uma família para gerar sua identificação.</Typography>
            <Button component={RouterLink} to={perfilAtual?.tipo === "paciente" ? "/cadastro-familia" : `/cadastro-familia?perfil=${paciente.id}`} variant="contained">Cadastrar família</Button>
          </>
        ) : (
          <>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{familia.responsavel} · Perfil: {paciente.nome}</Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <QRCodeSVG value={familia.id} size={220} level="M" title={`QR Code da família ${familia.responsavel}`} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>ID: {familia.id}</Typography>
            {mensagem && <Alert severity="info" sx={{ mb: 2, textAlign: "left" }}>{mensagem}</Alert>}
            <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1.5 }}>
              <Button variant="contained" onClick={compartilhar}>Compartilhar</Button>
              <Button variant="outlined" onClick={() => window.print()}>Imprimir</Button>
              <Button component={RouterLink} to={perfilAtual?.tipo === "paciente" ? "/cadastro-familia" : `/cadastro-familia?perfil=${paciente.id}`}>Editar cadastro</Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}
