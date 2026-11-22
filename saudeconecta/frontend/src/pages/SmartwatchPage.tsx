import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { usePerfilPaciente } from "../hooks/usePerfilPaciente";
import { salvarPerfilNoBackend } from "../api";
import { lerLeiturasSmartwatch, PERFIS_DEMO, salvarLeiturasSmartwatch, type LeituraSmartwatch } from "../types";

type CamposLeitura = { sistolica: string; diastolica: string; saturacao: string; passos: string };
const camposVazios: CamposLeitura = { sistolica: "", diastolica: "", saturacao: "", passos: "" };

export default function SmartwatchPage() {
  const contexto = usePerfilPaciente();
  return <SmartwatchPerfil key={contexto.paciente.id} {...contexto} />;
}

function SmartwatchPerfil({ paciente, perfilAtual, podeEscolher, selecionarPaciente }: ReturnType<typeof usePerfilPaciente>) {
  const navigate = useNavigate();
  const [leituras, setLeituras] = useState(() => lerLeiturasSmartwatch(paciente.id));
  const [campos, setCampos] = useState<CamposLeitura>(camposVazios);
  const [origem, setOrigem] = useState<LeituraSmartwatch["origem"]>("Manual");
  const [aviso, setAviso] = useState("");
  const ultima = leituras[0];

  function simularSincronizacao() {
    setCampos({ sistolica: "120", diastolica: "80", saturacao: "98", passos: "6420" });
    setOrigem("Demonstração");
    setAviso("Dados fictícios carregados para demonstração. Nenhum smartwatch foi conectado.");
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nova: LeituraSmartwatch = {
      id: crypto.randomUUID(),
      dataHora: new Date().toISOString(),
      pressaoSistolica: Number(campos.sistolica),
      pressaoDiastolica: Number(campos.diastolica),
      saturacaoOxigenio: Number(campos.saturacao),
      passos: Number(campos.passos),
      origem,
    };
    const atualizadas = [nova, ...leituras];
    setLeituras(atualizadas);
    salvarLeiturasSmartwatch(paciente.id, atualizadas);
    void salvarPerfilNoBackend(paciente.id);
    setAviso(origem === "Demonstração" ? "Leitura fictícia salva no perfil." : "Leitura manual salva no perfil.");
    setCampos(camposVazios);
    setOrigem("Manual");
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" gutterBottom>Dados do smartwatch</Typography>
      {podeEscolher && <TextField select label="Perfil do paciente" value={paciente.id} onChange={(event) => selecionarPaciente(event.target.value)} sx={{ mb: 2, minWidth: 280 }}>
        {PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente").map((perfil) => <MenuItem key={perfil.id} value={perfil.id}>{perfil.nome}</MenuItem>)}
      </TextField>}
      <Alert severity="warning" sx={{ mb: 3 }}>Este protótipo não se conecta a relógios. Você pode registrar dados manualmente ou carregar valores fictícios de demonstração. Não use estes dados para tomar decisões médicas.</Alert>
      {ultima && <>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>Última leitura · {new Date(ultima.dataHora).toLocaleString("pt-BR")}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 1.5, mb: 3 }}>
          {[{ label: "Pressão arterial", value: `${ultima.pressaoSistolica}/${ultima.pressaoDiastolica} mmHg` }, { label: "Saturação de oxigênio", value: `${ultima.saturacaoOxigenio}%` }, { label: "Passos registrados", value: ultima.passos.toLocaleString("pt-BR") }].map((medida) => <Card key={medida.label}><CardContent><Typography color="text.secondary">{medida.label}</Typography><Typography variant="h5" sx={{ mt: 1 }}>{medida.value}</Typography></CardContent></Card>)}
        </Box>
      </>}
      <Card variant="outlined" sx={{ mb: 3 }}><CardContent component="form" onSubmit={salvar}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Registrar leitura para {paciente.nome}</Typography>
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField type="number" label="Pressão sistólica (mmHg)" value={campos.sistolica} onChange={(event) => { setCampos((atual) => ({ ...atual, sistolica: event.target.value })); setOrigem("Manual"); }} slotProps={{ htmlInput: { min: 40, max: 260 } }} required />
            <TextField type="number" label="Pressão diastólica (mmHg)" value={campos.diastolica} onChange={(event) => { setCampos((atual) => ({ ...atual, diastolica: event.target.value })); setOrigem("Manual"); }} slotProps={{ htmlInput: { min: 30, max: 180 } }} required />
            <TextField type="number" label="Saturação de oxigênio (%)" value={campos.saturacao} onChange={(event) => { setCampos((atual) => ({ ...atual, saturacao: event.target.value })); setOrigem("Manual"); }} slotProps={{ htmlInput: { min: 50, max: 100 } }} required />
            <TextField type="number" label="Passos" value={campos.passos} onChange={(event) => { setCampos((atual) => ({ ...atual, passos: event.target.value })); setOrigem("Manual"); }} slotProps={{ htmlInput: { min: 0, max: 200000 } }} required />
          </Box>
          {aviso && <Alert severity={aviso.includes("fictícia") || aviso.startsWith("Dados fictícios") ? "info" : "success"}>{aviso}</Alert>}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <Button type="submit" variant="contained">Salvar leitura</Button>
            <Button type="button" variant="outlined" onClick={simularSincronizacao}>Simular sincronização</Button>
          </Box>
        </Stack>
      </CardContent></Card>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Histórico</Typography>
      {!leituras.length ? <Alert severity="info">Nenhuma leitura salva para este perfil.</Alert> : <Stack spacing={1}>{leituras.slice(0, 10).map((leitura) => <Card key={leitura.id} variant="outlined"><CardContent sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Typography>{new Date(leitura.dataHora).toLocaleString("pt-BR")}</Typography>
        <Typography>{leitura.pressaoSistolica}/{leitura.pressaoDiastolica} mmHg · O₂ {leitura.saturacaoOxigenio}% · {leitura.passos.toLocaleString("pt-BR")} passos</Typography>
        <Typography variant="body2" color="text.secondary">Origem: {leitura.origem}</Typography>
      </CardContent></Card>)}</Stack>}
      {perfilAtual?.tipo === "paciente" && <Button onClick={() => navigate("/dashboard")} sx={{ mt: 2 }}>Voltar ao início</Button>}
    </Container>
  );
}
