import { Box, Button, Card, CardContent, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { lerConsultas, lerFamilia, lerPerfil, lerVisitas, ROTULOS_PERFIL } from "../types";

type Atalho = { titulo: string; texto: string; botao: string; rota: string; numero?: number };

export default function Dashboard() {
  const navigate = useNavigate();
  const perfil = lerPerfil();
  const consultas = lerConsultas();
  const familia = lerFamilia();
  const visitas = lerVisitas();
  const doPerfil = consultas.filter((consulta) => perfil?.tipo === "paciente" ? consulta.paciente === perfil.nome : perfil?.tipo === "medico" ? consulta.medico === perfil.nome : true);
  let atalhos: Atalho[] = [];

  switch (perfil?.tipo) {
    case "paciente":
      atalhos = [
        { titulo: "Agendar consulta", texto: "Escolha especialidade, data e horário disponíveis.", botao: "Novo agendamento", rota: "/agendar" },
        { titulo: "Minhas consultas", texto: "Consulte os horários e acompanhe confirmações.", botao: "Ver consultas", rota: "/consultas", numero: doPerfil.filter((consulta) => consulta.status !== "Cancelada").length },
        { titulo: "Minha família", texto: familia ? `${familia.moradores} morador(es) no cadastro.` : "Cadastre os dados básicos da família.", botao: familia ? "Ver cadastro" : "Cadastrar família", rota: familia ? "/familias" : "/cadastro-familia" },
        { titulo: "Pesagem", texto: "Consulte a data demonstrativa e registre peso e altura da família.", botao: "Abrir pesagem", rota: "/pesagem" },
        { titulo: "Cartão de vacinação", texto: "Acompanhe os registros da pessoa titular e dos dependentes.", botao: "Abrir cartão", rota: "/vacinacao" },
        { titulo: "Dados do smartwatch", texto: "Registre ou simule pressão, saturação de oxigênio e passos.", botao: "Ver dados", rota: "/saude-conectada" },
        { titulo: "QR Code familiar", texto: "Acesse o código de identificação da família.", botao: "Abrir QR Code", rota: "/qr-code" },
      ];
      break;
    case "medico":
      atalhos = [
        { titulo: "Minha agenda", texto: "Veja pacientes aguardando e atualize o atendimento.", botao: "Abrir agenda", rota: "/consultas", numero: doPerfil.filter((consulta) => consulta.status === "Chegou").length },
        { titulo: "Atendimentos", texto: "Consultas atribuídas ao seu perfil demonstrativo.", botao: "Ver atendimentos", rota: "/consultas", numero: doPerfil.length },
      ];
      break;
    case "agente":
      atalhos = [
        { titulo: "Visitas domiciliares", texto: "Registre visitas e observações da área.", botao: "Registrar visita", rota: "/visitas", numero: visitas.length },
        { titulo: "Famílias da área", texto: "Consulte o cadastro familiar disponível neste dispositivo.", botao: "Ver famílias", rota: "/familias" },
      ];
      break;
    case "recepcao":
      atalhos = [
        { titulo: "Recepção", texto: "Registre a chegada das pessoas com consulta marcada.", botao: "Abrir atendimentos", rota: "/consultas", numero: consultas.filter((consulta) => consulta.status === "Agendada").length },
        { titulo: "Cadastro familiar", texto: "Consulte as famílias cadastradas localmente.", botao: "Consultar cadastros", rota: "/familias" },
      ];
      break;
    case "coordenacao":
      atalhos = [
        { titulo: "Indicadores da unidade", texto: "Acompanhe o volume da agenda e dos atendimentos.", botao: "Ver indicadores", rota: "/consultas", numero: consultas.length },
        { titulo: "Famílias cadastradas", texto: "Consulte os registros disponíveis neste protótipo.", botao: "Ver famílias", rota: "/familias" },
      ];
      break;
    case "agenda":
      atalhos = [
        { titulo: "Agendamento", texto: "Marque uma consulta para a pessoa usuária.", botao: "Criar agendamento", rota: "/agendar" },
        { titulo: "Agenda da unidade", texto: "Confira, cancele ou acompanhe os agendamentos.", botao: "Abrir agenda", rota: "/consultas", numero: consultas.length },
      ];
      break;
    case "cadastro":
      atalhos = [
        { titulo: "Cadastros familiares", texto: "Confira ou atualize o cadastro salvo no dispositivo.", botao: "Gerenciar cadastros", rota: "/familias" },
        { titulo: "Novo cadastro", texto: "Registre ou atualize os dados da família.", botao: "Cadastrar família", rota: "/cadastro-familia" },
      ];
      break;
  }

  return (
    <Container sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" sx={{ color: "#1565c0", fontWeight: 700, mb: 1 }}>
        Olá, {perfil?.nome}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>{ROTULOS_PERFIL[perfil!.tipo]} · {perfil?.unidade}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 2.5 }}>
        {atalhos.map((atalho) => <Card key={atalho.titulo} elevation={2}><CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <Typography variant="h6" component="h2">{atalho.titulo}</Typography>
          {atalho.numero !== undefined && <Typography variant="h3" sx={{ color: "primary.main", my: 1 }}>{atalho.numero}</Typography>}
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2, flexGrow: 1 }}>{atalho.texto}</Typography>
          <Button variant="contained" onClick={() => navigate(atalho.rota)}>{atalho.botao}</Button>
        </CardContent></Card>)}
      </Box>
      <Typography component="p" variant="caption" color="text.secondary" sx={{ mt: 4, display: "block" }}>
        Protótipo: não conectado aos sistemas reais da unidade. Os registros ficam apenas neste navegador.
      </Typography>
    </Container>
  );
}
