import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { usePerfilPaciente } from "../hooks/usePerfilPaciente";
import { salvarPerfilNoBackend } from "../api";
import { formatarData, hojeLocal, lerFamiliaDoPerfil, lerPerfil, lerVisitas, PERFIS_DEMO, salvarVisitas, type Visita } from "../types";

export default function VisitasPage() {
  const contexto = usePerfilPaciente();
  return <VisitasPerfil key={contexto.paciente.id} {...contexto} />;
}

function VisitasPerfil({ paciente, podeEscolher, selecionarPaciente }: ReturnType<typeof usePerfilPaciente>) {
  const perfil = lerPerfil();
  const familia = lerFamiliaDoPerfil(paciente.id);
  const [visitas, setVisitas] = useState(() => lerVisitas(paciente.id));
  const [observacao, setObservacao] = useState("");
  const [data, setData] = useState(hojeLocal());
  const [aviso, setAviso] = useState("");

  function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!perfil || !observacao.trim()) return;
    const nova: Visita = {
      id: crypto.randomUUID(),
      perfilPacienteId: paciente.id,
      familia: familia?.responsavel ?? `Família de ${paciente.nome} (demonstração)`,
      endereco: familia?.endereco ?? "Endereço não cadastrado",
      observacao: observacao.trim(),
      data,
      agente: perfil.nome,
    };
    const lista = [nova, ...lerVisitas(paciente.id)];
    setVisitas(lista);
    salvarVisitas(lista, paciente.id);
    void salvarPerfilNoBackend(paciente.id);
    setObservacao("");
    setAviso("Visita registrada no perfil de " + paciente.nome + ".");
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" gutterBottom>Visitas domiciliares</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Registre o acompanhamento da área de saúde.</Typography>
      {podeEscolher && <TextField select label="Família/paciente" value={paciente.id} onChange={(event) => selecionarPaciente(event.target.value)} sx={{ mb: 2, minWidth: 280 }}>
        {PERFIS_DEMO.filter((pessoa) => pessoa.tipo === "paciente").map((pessoa) => <MenuItem key={pessoa.id} value={pessoa.id}>{pessoa.nome}</MenuItem>)}
      </TextField>}
      <Card variant="outlined" sx={{ mb: 3 }}><CardContent component="form" onSubmit={registrar}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Registrar visita</Typography>
        <Stack spacing={2}>
          <TextField label="Família" value={familia?.responsavel ?? `Família de ${paciente.nome} (demonstração)`} disabled />
          <TextField label="Endereço" value={familia?.endereco ?? "Não cadastrado"} disabled />
          <TextField required type="date" label="Data da visita" value={data} onChange={(event) => setData(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hojeLocal() } }} />
          <TextField required multiline minRows={3} label="Observações da visita" value={observacao} onChange={(event) => setObservacao(event.target.value)} />
          {aviso && <Alert severity="success">{aviso}</Alert>}
          <Box><Button type="submit" variant="contained">Salvar visita</Button></Box>
        </Stack>
      </CardContent></Card>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Histórico · {paciente.nome}</Typography>
      {!visitas.length ? <Alert severity="info">Nenhuma visita registrada ainda.</Alert> : <Stack spacing={1.5}>{visitas.map((visita) => <Card variant="outlined" key={visita.id}><CardContent>
        <Typography variant="h6">{visita.familia}</Typography>
        <Typography variant="body2" color="text.secondary">{formatarData(visita.data)} · Agente: {visita.agente}</Typography>
        <Typography sx={{ mt: 1 }}>{visita.observacao}</Typography>
      </CardContent></Card>)}</Stack>}
      <Typography component="p" variant="caption" color="text.secondary" sx={{ mt: 3, display: "block" }}>Anotações são demonstrativas e ficam apenas neste navegador.</Typography>
    </Container>
  );
}
