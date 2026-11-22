import { useMemo, useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { salvarPerfilNoBackend } from "../api";
import { formatarData, hojeLocal, lerConsultas, lerFamilias, lerPerfil, PERFIS_DEMO, ROTULOS_PERFIL, salvarConsultas, type Consulta, type StatusConsulta } from "../types";

const especialidades = ["Clínica geral", "Pediatria", "Ginecologia", "Cardiologia", "Dermatologia", "Enfermagem", "Odontologia"];
const horarios = Array.from({ length: 18 }, (_, indice) => {
  const minutos = 8 * 60 + indice * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
});
const pacientes = PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente");
const etiquetasStatus: Record<StatusConsulta, string> = { Agendada: "Agendada", Chegou: "Paciente chegou", Concluída: "Concluída", Faltou: "Não compareceu", Cancelada: "Cancelada" };

export default function AgendamentoPage({ modo }: { modo: "formulario" | "lista" }) {
  const perfil = lerPerfil();
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState(lerConsultas);
  const [aviso, setAviso] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [pacienteId, setPacienteId] = useState(pacientes[0]?.id ?? "");
  const pacienteSelecionado = pacientes.find((pessoa) => pessoa.id === pacienteId);
  const ehAdministrativo = perfil?.tipo === "agenda" || perfil?.tipo === "recepcao" || perfil?.tipo === "coordenacao";
  const disponiveis = useMemo(() => horarios.filter((hora) => !consultas.some((consulta) => consulta.data === data && consulta.horario === hora && consulta.especialidade === especialidade && consulta.status !== "Cancelada")), [consultas, data, especialidade]);
  const minhasConsultas = consultas.filter((consulta) => {
    if (perfil?.tipo === "paciente") return consulta.paciente === perfil.nome;
    if (perfil?.tipo === "medico") return consulta.medico === perfil.nome;
    return true;
  }).sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`));

  function guardar(novas: Consulta[]) {
    setConsultas(novas);
    salvarConsultas(novas);
    for (const paciente of PERFIS_DEMO.filter((pessoa) => pessoa.tipo === "paciente")) {
      void salvarPerfilNoBackend(paciente.id);
    }
  }

  function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!perfil || !especialidade || !data || !horario) return;
    if (consultas.some((consulta) => consulta.data === data && consulta.horario === horario && consulta.especialidade === especialidade && consulta.status !== "Cancelada")) {
      setAviso("Este horário acabou de ser reservado. Escolha outro horário.");
      return;
    }
    const registro: Consulta = {
      id: crypto.randomUUID(),
      paciente: ehAdministrativo ? (pacienteSelecionado?.nome ?? perfil.nome) : perfil.nome,
      especialidade,
      data,
      horario,
      medico: perfil.tipo === "medico" ? perfil.nome : "Dr. Carlos Ferreira",
      status: "Agendada",
      criadaEm: new Date().toISOString(),
    };
    guardar([...consultas, registro]);
    setAviso("Consulta confirmada e adicionada à agenda.");
    setEspecialidade("");
    setData("");
    setHorario("");
    window.setTimeout(() => navigate("/consultas"), 650);
  }

  function mudarStatus(id: string, status: StatusConsulta) {
    guardar(consultas.map((consulta) => consulta.id === id ? { ...consulta, status } : consulta));
  }

  if (modo === "formulario") {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Paper component="form" onSubmit={confirmar} elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>Agendar consulta</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Selecione a especialidade, a data e um horário disponível.</Typography>
          {aviso && <Alert severity={aviso.startsWith("Este") ? "warning" : "success"} sx={{ mb: 2 }}>{aviso}</Alert>}
          <Stack spacing={2}>
            {ehAdministrativo && <TextField select required label="Paciente" value={pacienteId} onChange={(event) => setPacienteId(event.target.value)}>
              {pacientes.map((pessoa) => <MenuItem key={pessoa.id} value={pessoa.id}>{pessoa.nome}</MenuItem>)}
            </TextField>}
            <TextField select required label="Especialidade" value={especialidade} onChange={(event) => { setEspecialidade(event.target.value); setHorario(""); }}>
              {especialidades.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField required type="date" label="Data" value={data} onChange={(event) => { setData(event.target.value); setHorario(""); }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: hojeLocal() } }} />
            <TextField select required label="Horário" value={horario} onChange={(event) => setHorario(event.target.value)} disabled={!data || !especialidade} helperText={!data || !especialidade ? "Escolha a especialidade e a data primeiro." : disponiveis.length ? "Horários de 08:00 a 16:30." : "Não há horários disponíveis nesta data."}>
              {disponiveis.map((hora) => <MenuItem key={hora} value={hora}>{hora}</MenuItem>)}
            </TextField>
            <Alert severity="info">Atendimento na {perfil?.unidade}. Protótipo demonstrativo: a consulta é salva apenas neste navegador.</Alert>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <Button type="submit" variant="contained" size="large" disabled={!disponiveis.length}>Confirmar consulta</Button>
              <Button type="button" variant="outlined" onClick={() => navigate("/dashboard")}>Voltar</Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const titulo = perfil?.tipo === "medico" ? "Agenda médica" : perfil?.tipo === "recepcao" ? "Atendimento e recepção" : perfil?.tipo === "coordenacao" ? "Indicadores da unidade" : "Minhas consultas";
  const ativas = consultas.filter((consulta) => !["Cancelada", "Concluída", "Faltou"].includes(consulta.status));
  return (
    <Container sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" gutterBottom>{titulo}</Typography>
      {perfil?.tipo === "coordenacao" && <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 2, mb: 3 }}>
        {[{ nome: "Consultas cadastradas", valor: consultas.length }, { nome: "Aguardando atendimento", valor: ativas.length }, { nome: "Famílias neste dispositivo", valor: lerFamilias().length }].map((indicador) => <Card key={indicador.nome}><CardContent><Typography color="text.secondary">{indicador.nome}</Typography><Typography variant="h4">{indicador.valor}</Typography></CardContent></Card>)}
      </Box>}
      {(perfil?.tipo === "paciente" || perfil?.tipo === "agenda") && <Button variant="contained" onClick={() => navigate("/agendar")} sx={{ mb: 2 }}>{perfil.tipo === "paciente" ? "Agendar consulta" : "Agendar para paciente"}</Button>}
      {!minhasConsultas.length ? <Alert severity="info">Nenhuma consulta cadastrada. {perfil?.tipo === "paciente" ? "Use “Agendar consulta” para escolher especialidade, data e horário." : "As consultas confirmadas aparecerão aqui."}</Alert> : (
        <Stack spacing={2}>{minhasConsultas.map((consulta) => <Card key={consulta.id} variant="outlined"><CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h6">{consulta.especialidade}</Typography>
            <Typography>{formatarData(consulta.data)} às {consulta.horario} · {consulta.medico}</Typography>
            {perfil?.tipo !== "paciente" && <Typography variant="body2" color="text.secondary">Paciente: {consulta.paciente}</Typography>}
            <Typography variant="body2" color="text.secondary">Status: {etiquetasStatus[consulta.status]}</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {perfil?.tipo === "recepcao" && consulta.status === "Agendada" && <Button onClick={() => mudarStatus(consulta.id, "Chegou")} variant="contained">Confirmar chegada</Button>}
            {perfil?.tipo === "medico" && consulta.status === "Agendada" && <Button onClick={() => mudarStatus(consulta.id, "Chegou")} variant="outlined">Iniciar atendimento</Button>}
            {perfil?.tipo === "medico" && consulta.status === "Chegou" && <Button onClick={() => mudarStatus(consulta.id, "Concluída")} variant="contained">Concluir atendimento</Button>}
            {perfil?.tipo === "medico" && consulta.status === "Chegou" && <Button onClick={() => mudarStatus(consulta.id, "Faltou")} color="warning">Marcar falta</Button>}
            {(perfil?.tipo === "paciente" || perfil?.tipo === "agenda") && consulta.status === "Agendada" && <Button onClick={() => mudarStatus(consulta.id, "Cancelada")} color="error">Cancelar</Button>}
          </Box>
        </CardContent></Card>)}</Stack>
      )}
      <Typography component="p" variant="caption" sx={{ mt: 3, display: "block" }}>
        Perfis disponíveis: {PERFIS_DEMO.filter((pessoa) => pessoa.tipo !== "paciente").map((pessoa) => ROTULOS_PERFIL[pessoa.tipo]).join(" · ")}
      </Typography>
    </Container>
  );
}
