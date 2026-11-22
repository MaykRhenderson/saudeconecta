import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { salvarPerfilNoBackend, sincronizarTodosPacientes } from "../api";
import { lerFamilia, lerFamilias, lerPerfil, PERFIS_DEMO, removerFamiliaDoPerfil, type Perfil } from "../types";

export default function FamiliasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const perfil = lerPerfil();
  const [familias, setFamilias] = useState(lerFamilias);
  const perfilSolicitado = searchParams.get("perfil");
  const pacienteAtual = perfil?.tipo === "paciente" ? perfil : PERFIS_DEMO.find((pessoa) => pessoa.id === perfilSolicitado && pessoa.tipo === "paciente");
  const lista = useMemo(() => perfil?.tipo === "paciente" ? (lerFamilia() ? [{ perfil, familia: lerFamilia()! }] : []) : perfilSolicitado ? familias.filter((item) => item.perfil.id === perfilSolicitado) : familias, [familias, perfil, perfilSolicitado]);
  const pacientesSemCadastro = PERFIS_DEMO.filter((pessoa) => pessoa.tipo === "paciente" && !familias.some((item) => item.perfil.id === pessoa.id));

  useEffect(() => {
    if (perfil?.tipo === "paciente") return;
    let ativo = true;
    void sincronizarTodosPacientes().then((conectado) => {
      if (ativo && conectado) setFamilias(lerFamilias());
    });
    return () => { ativo = false; };
  }, [perfil?.tipo]);

  function abrir(rota: string, paciente: Perfil) {
    navigate(perfil?.tipo === "paciente" ? rota : `${rota}?perfil=${paciente.id}`);
  }

  function remover(profileId: string) {
    if (!window.confirm("Remover os dados demonstrativos desta família neste navegador?")) return;
    removerFamiliaDoPerfil(profileId);
    setFamilias(lerFamilias());
    void salvarPerfilNoBackend(profileId);
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" gutterBottom>{perfil?.tipo === "paciente" ? "Minha família" : "Famílias e pacientes"}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Cadastros e dependentes separados por perfil demonstrativo.</Typography>
      {!lista.length && <Alert severity="info" sx={{ mb: 2 }} action={perfil?.tipo === "paciente" ? <Button color="inherit" onClick={() => navigate("/cadastro-familia")}>Cadastrar família</Button> : undefined}>{pacienteAtual ? `Nenhum cadastro para ${pacienteAtual.nome}.` : "Nenhuma família cadastrada ainda."}</Alert>}
      <Stack spacing={2}>
        {lista.map(({ perfil: paciente, familia }) => <Card variant="outlined" key={paciente.id}><CardContent>
          <Typography variant="h5" component="h2" gutterBottom>{familia.responsavel}</Typography>
          {perfil?.tipo !== "paciente" && <Typography color="text.secondary" sx={{ mb: 1 }}>Perfil de paciente: {paciente.nome}</Typography>}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
            <Typography><strong>CPF:</strong> {familia.cpf}</Typography>
            <Typography><strong>Cartão SUS:</strong> {familia.cartaoSus || "Não informado"}</Typography>
            <Typography><strong>Telefone:</strong> {familia.telefone || "Não informado"}</Typography>
            <Typography><strong>Moradores:</strong> {familia.moradores}</Typography>
            <Typography sx={{ gridColumn: { sm: "1 / -1" } }}><strong>Endereço:</strong> {familia.endereco || "Não informado"}</Typography>
            <Typography sx={{ gridColumn: { sm: "1 / -1" } }}><strong>Filhos/dependentes:</strong> {familia.dependentes?.length ?? 0}</Typography>
          </Box>
          {!!familia.dependentes?.length && <Stack spacing={0.5} sx={{ mt: 1 }}>
            {familia.dependentes.map((dependente) => <Typography key={dependente.id} variant="body2" color="text.secondary">{dependente.nome} · Nascimento: {dependente.nascimento} · Bolsa Família: {dependente.beneficioBolsaFamilia}</Typography>)}
          </Stack>}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
            <Button variant="contained" onClick={() => abrir("/cadastro-familia", paciente)}>Editar família</Button>
            <Button onClick={() => abrir("/pesagem", paciente)}>Pesagem</Button>
            <Button onClick={() => abrir("/vacinacao", paciente)}>Vacinação</Button>
            <Button onClick={() => abrir("/saude-conectada", paciente)}>Dados de saúde</Button>
            {perfil?.tipo === "agente" && <Button onClick={() => navigate(`/visitas?perfil=${paciente.id}`)}>Registrar visita</Button>}
            <Button onClick={() => abrir("/qr-code", paciente)}>QR Code</Button>
            {(perfil?.tipo === "cadastro" || perfil?.tipo === "coordenacao") && <Button color="error" onClick={() => remover(paciente.id)}>Remover cadastro</Button>}
          </Box>
        </CardContent></Card>)}
        {perfil?.tipo !== "paciente" && pacientesSemCadastro.filter((paciente) => !perfilSolicitado || perfilSolicitado === paciente.id).map((paciente) => <Card key={paciente.id} variant="outlined"><CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box><Typography variant="h6">{paciente.nome}</Typography><Typography color="text.secondary">Sem cadastro familiar</Typography></Box>
          <Button variant="outlined" onClick={() => navigate(`/cadastro-familia?perfil=${paciente.id}`)}>Criar cadastro</Button>
        </CardContent></Card>)}
      </Stack>
      <Typography component="p" variant="caption" color="text.secondary" sx={{ mt: 3, display: "block" }}>Protótipo local. Não armazene informações reais de saúde ou documentos.</Typography>
    </Container>
  );
}
