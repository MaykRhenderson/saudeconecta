import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import AgendamentoPage from "../pages/AgendamentoPage";
import CadastroFamilia from "../pages/CadastroFamilia";
import Dashboard from "../pages/Dashboard";
import FamiliasPage from "../pages/FamiliasPage";
import Login from "../pages/Login";
import PesagemPage from "../pages/PesagemPage";
import QRCodeFamilia from "../pages/QRCodeFamilia";
import SmartwatchPage from "../pages/SmartwatchPage";
import VacinacaoPage from "../pages/VacinacaoPage";
import VisitasPage from "../pages/VisitasPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<PortalLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agendar" element={<AgendamentoPage modo="formulario" />} />
          <Route path="/consultas" element={<AgendamentoPage modo="lista" />} />
          <Route path="/cadastro-familia" element={<CadastroFamilia />} />
          <Route path="/familias" element={<FamiliasPage />} />
          <Route path="/pesagem" element={<PesagemPage />} />
          <Route path="/vacinacao" element={<VacinacaoPage />} />
          <Route path="/saude-conectada" element={<SmartwatchPage />} />
          <Route path="/visitas" element={<VisitasPage />} />
          <Route path="/qr-code" element={<QRCodeFamilia />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
