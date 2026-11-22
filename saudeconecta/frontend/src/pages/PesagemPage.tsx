import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { usePerfilPaciente } from "../hooks/usePerfilPaciente";
import { salvarPerfilNoBackend } from "../api";
import { formatarData, lerFamiliaDoPerfil, lerPesagens, PERFIS_DEMO, salvarPesagens, hojeLocal, type RegistroPesagem } from "../types";

function dataPreAgendada(profileId: string) {
  const chave = `saudeconecta:pesagem-agendada:${profileId}`;
  const salva = localStorage.getItem(chave);
  if (salva) return salva;
  const data = new Date();
  data.setDate(data.getDate() + 14);
  while (data.getDay() === 0 || data.getDay() === 6) data.setDate(data.getDate() + 1);
  const valor = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
  localStorage.setItem(chave, valor);
  return valor;
}

export default function PesagemPage() {
  const contexto = usePerfilPaciente();
  return <PesagemPerfil key={contexto.paciente.id} {...contexto} />;
}

function PesagemPerfil({ paciente, perfilAtual, podeEscolher, selecionarPaciente }: ReturnType<typeof usePerfilPaciente>) {
  const navigate = useNavigate();
  const familia = lerFamiliaDoPerfil(paciente.id);
  const pessoas = [{ id: "responsavel", nome: familia?.responsavel || paciente.nome }, ...(familia?.dependentes ?? []).map((dependente) => ({ id: dependente.id, nome: dependente.nome }))];
  const [registros, setRegistros] = useState(() => lerPesagens(paciente.id));
  const [dataAgendada, setDataAgendada] = useState(() => dataPreAgendada(paciente.id));
  const [pessoaId, setPessoaId] = useState(pessoas[0].id);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [observacao, setObservacao] = useState("");
  const [aviso, setAviso] = useState("");

  function mudarPaciente(id: string) {
    selecionarPaciente(id);
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pessoa = pessoas.find((item) => item.id === pessoaId);
    if (!pessoa || !peso || !altura) return;
    const nova: RegistroPesagem = {
      id: crypto.randomUUID(), pessoaId, pessoa: pessoa.nome, dataAgendada,
      dataRealizada: hojeLocal(), pesoKg: Number(peso), alturaCm: Number(altura), observacao: observacao.trim(),
    };
    const atualizados = [nova, ...registros];
    setRegistros(atualizados);
    salvarPesagens(paciente.id, atualizados);
    localStorage.setItem(`saudeconecta:pesagem-agendada:${paciente.id}`, dataAgendada);
    void salvarPerfilNoBackend(paciente.id);
    setPeso(""); setAltura(""); setObservacao("");
    setAviso("Pesagem registrada no perfil de " + paciente.nome + ".");
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" gutterBottom>Pesagem e acompanhamento</Typography>
      {podeEscolher && <TextField select label="Perfil do paciente" value={paciente.id} onChange={(event) => mudarPaciente(event.target.value)} sx={{ mb: 2, minWidth: 280 }}>
        {PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente").map((perfil) => <MenuItem key={perfil.id} value={perfil.id}>{perfil.nome}</MenuItem>)}
      </TextField>}
      <Alert severity="info" sx={{ mb: 3 }}>Data pré-agendada demonstrativa: <strong>{formatarData(dataAgendada)}</strong>. A data é uma sugestão local e deve ser confirmada com a unidade; não representa prazo oficial de benefício.</Alert>
      <Card variant="outlined" sx={{ mb: 3 }}><CardContent component="form" onSubmit={salvar}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Registrar pesagem</Typography>
        <Stack spacing={2}>
          <TextField select label="Pessoa" value={pessoaId} onChange={(event) => setPessoaId(event.target.value)}>{pessoas.map((pessoa) => <MenuItem key={pessoa.id} value={pessoa.id}>{pessoa.nome}</MenuItem>)}</TextField>
          <TextField type="date" label="Data pré-agendada" value={dataAgendada} onChange={(event) => setDataAgendada(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} required />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField type="number" label="Peso (kg)" value={peso} onChange={(event) => setPeso(event.target.value)} slotProps={{ htmlInput: { min: 0.2, max: 400, step: 0.1 } }} required />
            <TextField type="number" label="Altura (cm)" value={altura} onChange={(event) => setAltura(event.target.value)} slotProps={{ htmlInput: { min: 30, max: 250, step: 0.1 } }} required />
          </Box>
          <TextField label="Observação (opcional)" value={observacao} onChange={(event) => setObservacao(event.target.value)} multiline minRows={2} />
          {aviso && <Alert severity="success">{aviso}</Alert>}
          <Box><Button type="submit" variant="contained">Salvar pesagem</Button></Box>
        </Stack>
      </CardContent></Card>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Histórico deste perfil</Typography>
      {!registros.length ? <Alert severity="info">Nenhuma pesagem registrada para {paciente.nome}.</Alert> : <Stack spacing={1.5}>{registros.map((registro) => <Card key={registro.id} variant="outlined"><CardContent>
        <Typography variant="h6">{registro.pessoa}</Typography>
        <Typography>{formatarData(registro.dataRealizada)} · {registro.pesoKg} kg · {registro.alturaCm} cm</Typography>
        <Typography variant="body2" color="text.secondary">Data pré-agendada: {formatarData(registro.dataAgendada)}</Typography>
        {registro.observacao && <Typography sx={{ mt: 1 }}>{registro.observacao}</Typography>}
      </CardContent></Card>)}</Stack>}
      <Typography component="p" variant="caption" color="text.secondary" sx={{ mt: 3 }}>A página registra medidas demonstrativas e não avalia crescimento ou situação de benefício.</Typography>
      {perfilAtual?.tipo === "paciente" && <Button onClick={() => navigate("/dashboard")} sx={{ mt: 1 }}>Voltar ao início</Button>}
    </Container>
  );
}
