import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { usePerfilPaciente } from "../hooks/usePerfilPaciente";
import { salvarPerfilNoBackend } from "../api";
import { formatarData, lerFamiliaDoPerfil, lerVacinas, PERFIS_DEMO, salvarVacinas, hojeLocal, type RegistroVacina } from "../types";

export default function VacinacaoPage() {
  const contexto = usePerfilPaciente();
  return <VacinacaoPerfil key={contexto.paciente.id} {...contexto} />;
}

function VacinacaoPerfil({ paciente, perfilAtual, podeEscolher, selecionarPaciente }: ReturnType<typeof usePerfilPaciente>) {
  const navigate = useNavigate();
  const familia = lerFamiliaDoPerfil(paciente.id);
  const pessoas = [{ id: "responsavel", nome: familia?.responsavel || paciente.nome }, ...(familia?.dependentes ?? []).map((dependente) => ({ id: dependente.id, nome: dependente.nome }))];
  const [registros, setRegistros] = useState(() => lerVacinas(paciente.id));
  const [pessoaId, setPessoaId] = useState(pessoas[0].id);
  const [vacina, setVacina] = useState("");
  const [dose, setDose] = useState("");
  const [data, setData] = useState(hojeLocal());
  const [status, setStatus] = useState<RegistroVacina["status"]>("Aplicada");
  const [aviso, setAviso] = useState("");

  function guardar(lista: RegistroVacina[]) {
    setRegistros(lista);
    salvarVacinas(paciente.id, lista);
    void salvarPerfilNoBackend(paciente.id);
  }

  function adicionar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pessoa = pessoas.find((item) => item.id === pessoaId);
    if (!pessoa || !vacina.trim() || !dose.trim() || !data) return;
    const registro: RegistroVacina = { id: crypto.randomUUID(), pessoaId, pessoa: pessoa.nome, vacina: vacina.trim(), dose: dose.trim(), data, status };
    guardar([registro, ...registros]);
    setVacina(""); setDose(""); setStatus("Aplicada");
    setAviso("Registro salvo no cartão de vacinação deste perfil.");
  }

  function marcarAplicada(id: string) {
    guardar(registros.map((registro) => registro.id === id ? { ...registro, status: "Aplicada" } : registro));
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" gutterBottom>Cartão de vacinação</Typography>
      {podeEscolher && <TextField select label="Perfil do paciente" value={paciente.id} onChange={(event) => selecionarPaciente(event.target.value)} sx={{ mb: 2, minWidth: 280 }}>
        {PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente").map((perfil) => <MenuItem key={perfil.id} value={perfil.id}>{perfil.nome}</MenuItem>)}
      </TextField>}
      <Typography color="text.secondary" sx={{ mb: 3 }}>Registre vacinas aplicadas ou agendadas para a pessoa titular e seus dependentes.</Typography>
      <Card variant="outlined" sx={{ mb: 3 }}><CardContent component="form" onSubmit={adicionar}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Adicionar ao cartão</Typography>
        <Stack spacing={2}>
          <TextField select label="Pessoa" value={pessoaId} onChange={(event) => setPessoaId(event.target.value)}>{pessoas.map((pessoa) => <MenuItem key={pessoa.id} value={pessoa.id}>{pessoa.nome}</MenuItem>)}</TextField>
          <TextField label="Vacina" value={vacina} onChange={(event) => setVacina(event.target.value)} required />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField label="Dose" value={dose} onChange={(event) => setDose(event.target.value)} placeholder="Ex.: 1ª dose" required />
            <TextField type="date" label="Data" value={data} onChange={(event) => setData(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} required />
          </Box>
          <TextField select label="Situação" value={status} onChange={(event) => setStatus(event.target.value as RegistroVacina["status"])}>
            <MenuItem value="Aplicada">Aplicada</MenuItem><MenuItem value="Agendada">Agendada</MenuItem>
          </TextField>
          {aviso && <Alert severity="success">{aviso}</Alert>}
          <Box><Button type="submit" variant="contained">Salvar no cartão</Button></Box>
        </Stack>
      </CardContent></Card>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Registros de {paciente.nome} e dependentes</Typography>
      {!registros.length ? <Alert severity="info">Nenhum registro de vacina neste perfil. Adicione os registros conforme a caderneta da família.</Alert> : <Stack spacing={1.5}>{registros.map((registro) => <Card key={registro.id} variant="outlined"><CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box><Typography variant="h6">{registro.vacina}</Typography><Typography>{registro.pessoa} · {registro.dose} · {formatarData(registro.data)}</Typography><Typography variant="body2" color="text.secondary">Situação: {registro.status}</Typography></Box>
        {registro.status === "Agendada" && <Button onClick={() => marcarAplicada(registro.id)} variant="outlined">Marcar como aplicada</Button>}
      </CardContent></Card>)}</Stack>}
      <Typography component="p" variant="caption" color="text.secondary" sx={{ mt: 3 }}>Use a caderneta e confirme o calendário vacinal com a equipe de saúde. Este protótipo não recomenda doses.</Typography>
      {perfilAtual?.tipo === "paciente" && <Button onClick={() => navigate("/dashboard")} sx={{ mt: 1 }}>Voltar ao início</Button>}
    </Container>
  );
}
