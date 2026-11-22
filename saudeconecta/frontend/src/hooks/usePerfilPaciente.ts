import { useSearchParams } from "react-router-dom";
import { lerPerfil, PERFIS_DEMO } from "../types";

export function usePerfilPaciente() {
  const perfilAtual = lerPerfil();
  const [searchParams, setSearchParams] = useSearchParams();
  const pacientes = PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente");
  const solicitado = searchParams.get("perfil");
  const paciente = perfilAtual?.tipo === "paciente"
    ? perfilAtual
    : pacientes.find((perfil) => perfil.id === solicitado) ?? pacientes[0];
  return {
    perfilAtual,
    paciente,
    podeEscolher: perfilAtual?.tipo !== "paciente",
    selecionarPaciente: (id: string) => setSearchParams({ perfil: id }),
  };
}
