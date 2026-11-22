import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Container, Divider, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { salvarPerfilNoBackend } from "../api";
import { lerFamiliaDoPerfil, PERFIS_DEMO, salvarFamiliaDoPerfil, type Dependente, type Familia, lerPerfil, type Perfil } from "../types";

const familiaVazia = (): Familia => ({ id: crypto.randomUUID(), responsavel: "", cpf: "", cartaoSus: "", telefone: "", endereco: "", moradores: 1, dependentes: [] });
const pacientes = PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente");

function ehMenorDeIdade(nascimento: string) {
  if (!nascimento) return false;
  const hoje = new Date();
  const data = new Date(`${nascimento}T12:00:00`);
  let idade = hoje.getFullYear() - data.getFullYear();
  if (hoje.getMonth() < data.getMonth() || (hoje.getMonth() === data.getMonth() && hoje.getDate() < data.getDate())) idade -= 1;
  return idade < 18;
}

export default function CadastroFamilia() {
  const [searchParams, setSearchParams] = useSearchParams();
  const perfilAtual = lerPerfil();
  const idSolicitado = searchParams.get("perfil");
  const perfilAlvo = perfilAtual?.tipo === "paciente"
    ? perfilAtual
    : pacientes.find((perfil) => perfil.id === idSolicitado) ?? pacientes[0];
  return <CadastroFamiliaForm key={perfilAlvo.id} perfilAtual={perfilAtual} perfilAlvo={perfilAlvo} selecionarPaciente={(id) => setSearchParams({ perfil: id })} />;
}

function CadastroFamiliaForm({ perfilAtual, perfilAlvo, selecionarPaciente }: { perfilAtual: Perfil | null; perfilAlvo: Perfil; selecionarPaciente: (id: string) => void }) {
  const navigate = useNavigate();
  const [erro, setErro] = useState("");
  const [familia, setFamilia] = useState<Familia>(() => lerFamiliaDoPerfil(perfilAlvo.id) ?? familiaVazia());
  const [novoDependente, setNovoDependente] = useState({ nome: "", nascimento: "", beneficioBolsaFamilia: "Não informado" as Dependente["beneficioBolsaFamilia"] });

  function atualizar(campo: keyof Familia, valor: string | number) {
    setFamilia((atual) => ({ ...atual, [campo]: valor }));
  }

  function adicionarDependente() {
    if (!novoDependente.nome.trim() || !novoDependente.nascimento) {
      setErro("Informe o nome e a data de nascimento do filho ou dependente.");
      return;
    }
    const menor = ehMenorDeIdade(novoDependente.nascimento);
    const dependente: Dependente = {
      ...novoDependente,
      id: crypto.randomUUID(),
      nome: novoDependente.nome.trim(),
      beneficioBolsaFamilia: menor ? novoDependente.beneficioBolsaFamilia : "Não informado",
    };
    setFamilia((atual) => ({ ...atual, dependentes: [...atual.dependentes, dependente] }));
    setNovoDependente({ nome: "", nascimento: "", beneficioBolsaFamilia: "Não informado" });
    setErro("");
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cpf = familia.cpf.replace(/\D/g, "");
    if (cpf.length !== 11) {
      setErro("Informe um CPF com 11 números.");
      return;
    }
    const registro: Familia = { ...familia, cpf, moradores: Math.max(Number(familia.moradores), 1) };
    salvarFamiliaDoPerfil(perfilAlvo.id, registro);
    void salvarPerfilNoBackend(perfilAlvo.id);
    if (perfilAtual?.tipo === "paciente") navigate("/qr-code");
    else navigate(`/familias?perfil=${perfilAlvo.id}`);
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Paper component="form" onSubmit={salvar} elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>Cadastro familiar</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Perfil: {perfilAlvo.nome}. Dados demonstrativos, salvos separadamente por paciente neste navegador.</Typography>
        {perfilAtual?.tipo !== "paciente" && <TextField select label="Paciente" value={perfilAlvo.id} onChange={(event) => selecionarPaciente(event.target.value)} sx={{ mb: 2 }}>
          {pacientes.map((paciente) => <MenuItem key={paciente.id} value={paciente.id}>{paciente.nome}</MenuItem>)}
        </TextField>}
        <Divider sx={{ mb: 3 }} />
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField label="Nome da pessoa responsável" value={familia.responsavel} onChange={(e) => atualizar("responsavel", e.target.value)} required fullWidth />
          <TextField label="CPF" value={familia.cpf} onChange={(e) => atualizar("cpf", e.target.value)} slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 14 } }} required fullWidth />
          <TextField label="Cartão SUS" value={familia.cartaoSus} onChange={(e) => atualizar("cartaoSus", e.target.value)} fullWidth />
          <TextField label="Telefone" value={familia.telefone} onChange={(e) => atualizar("telefone", e.target.value)} slotProps={{ htmlInput: { inputMode: "tel" } }} fullWidth />
          <TextField label="Endereço" value={familia.endereco} onChange={(e) => atualizar("endereco", e.target.value)} fullWidth />
          <TextField label="Moradores da residência" type="number" value={familia.moradores} onChange={(e) => atualizar("moradores", Number(e.target.value))} slotProps={{ htmlInput: { min: 1, step: 1 } }} required fullWidth />
        </Box>

        <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1 }}>Filhos e dependentes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>A idade é calculada pela data de nascimento. Para menores de 18 anos, registre a informação sobre o benefício sem indicar elegibilidade.</Typography>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {familia.dependentes.map((dependente) => <Paper key={dependente.id} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Box><Typography sx={{ fontWeight: 600 }}>{dependente.nome}</Typography><Typography variant="body2" color="text.secondary">Nascimento: {dependente.nascimento} · {ehMenorDeIdade(dependente.nascimento) ? "Menor de 18 anos" : "18 anos ou mais"} · Bolsa Família: {dependente.beneficioBolsaFamilia}</Typography></Box>
              <Button type="button" color="error" onClick={() => setFamilia((atual) => ({ ...atual, dependentes: atual.dependentes.filter((item) => item.id !== dependente.id) }))}>Remover</Button>
            </Box>
          </Paper>)}
          {!familia.dependentes.length && <Typography variant="body2" color="text.secondary">Nenhum dependente adicionado.</Typography>}
        </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr auto" }, gap: 1.5, alignItems: "start" }}>
          <TextField label="Nome do filho/dependente" value={novoDependente.nome} onChange={(event) => setNovoDependente((atual) => ({ ...atual, nome: event.target.value }))} />
          <TextField type="date" label="Data de nascimento" value={novoDependente.nascimento} onChange={(event) => setNovoDependente((atual) => ({ ...atual, nascimento: event.target.value }))} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().slice(0, 10) } }} />
          <TextField select label="Recebe Bolsa Família?" value={novoDependente.beneficioBolsaFamilia} disabled={!ehMenorDeIdade(novoDependente.nascimento)} onChange={(event) => setNovoDependente((atual) => ({ ...atual, beneficioBolsaFamilia: event.target.value as Dependente["beneficioBolsaFamilia"] }))}>
            {["Sim", "Não", "Não informado"].map((opcao) => <MenuItem key={opcao} value={opcao}>{opcao}</MenuItem>)}
          </TextField>
          <Button type="button" variant="outlined" onClick={adicionarDependente} sx={{ minHeight: 56 }}>Adicionar</Button>
        </Box>
        <Alert severity="info" sx={{ mt: 3 }}>Este cadastro não determina direito ao benefício. Confirme os requisitos e os prazos com a equipe da unidade responsável.</Alert>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 3 }}>
          <Button type="submit" variant="contained" size="large">Salvar cadastro</Button>
          <Button type="button" variant="outlined" onClick={() => navigate(perfilAtual?.tipo === "paciente" ? "/dashboard" : "/familias")}>Voltar</Button>
        </Box>
      </Paper>
    </Container>
  );
}
