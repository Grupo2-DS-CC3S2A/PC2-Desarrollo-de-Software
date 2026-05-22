/**
 * Tipos del dominio Mesa de Partes (HU04).
 *
 * Espejan los modelos Pydantic del backend (`src/modelos/solicitud.py`) para
 * evitar drift entre capas.
 */

export const EstadoSolicitud = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En Proceso",
  ATENDIDA: "Atendida",
  RECHAZADA: "Rechazada",
} as const;

export type EstadoSolicitud =
  (typeof EstadoSolicitud)[keyof typeof EstadoSolicitud];

export const Prioridad = {
  NORMAL: "Normal",
  URGENTE: "Urgente",
} as const;

export type Prioridad = (typeof Prioridad)[keyof typeof Prioridad];

export const TipoTramite = {
  TRAMITE: "Tramite",
  RECLAMO: "Reclamo",
  CONSULTA: "Consulta",
} as const;

export type TipoTramite = (typeof TipoTramite)[keyof typeof TipoTramite];

export const Dependencia = {
  MESA_DE_PARTES: "MesaDePartes",
  TRAMITE_DOCUMENTARIO: "TramiteDocumentario",
  ASESORIA_LEGAL: "AsesoriaLegal",
  RECURSOS_HUMANOS: "RecursosHumanos",
  LOGISTICA: "Logistica",
  TESORERIA: "Tesoreria",
  SECRETARIA_GENERAL: "SecretariaGeneral",
} as const;

export type Dependencia = (typeof Dependencia)[keyof typeof Dependencia];

export interface DependenciaCatalogoItem {
  readonly codigo: Dependencia;
  readonly etiqueta: string;
  readonly plazo_dias_habiles: number;
}

export const CATALOGO_DEPENDENCIAS: readonly DependenciaCatalogoItem[] = [
  { codigo: Dependencia.MESA_DE_PARTES, etiqueta: "Mesa de Partes", plazo_dias_habiles: 5 },
  { codigo: Dependencia.TRAMITE_DOCUMENTARIO, etiqueta: "Trámite Documentario", plazo_dias_habiles: 10 },
  { codigo: Dependencia.ASESORIA_LEGAL, etiqueta: "Asesoría Legal", plazo_dias_habiles: 15 },
  { codigo: Dependencia.RECURSOS_HUMANOS, etiqueta: "Recursos Humanos", plazo_dias_habiles: 15 },
  { codigo: Dependencia.LOGISTICA, etiqueta: "Logística", plazo_dias_habiles: 12 },
  { codigo: Dependencia.TESORERIA, etiqueta: "Tesorería", plazo_dias_habiles: 8 },
  { codigo: Dependencia.SECRETARIA_GENERAL, etiqueta: "Secretaría General", plazo_dias_habiles: 20 },
];

export interface Solicitud {
  readonly id: string;
  readonly usuario_id: string;
  readonly tipo_tramite: TipoTramite;
  readonly prioridad: Prioridad;
  readonly asunto: string;
  readonly detalle_solicitud: string;
  readonly dependencia_asignada: Dependencia | null;
  readonly fecha_ingreso: string;
  readonly fecha_maxima_respuesta: string;
  readonly estado: EstadoSolicitud;
  readonly observaciones: string;
}

export interface SolicitudInput {
  readonly usuario_id: string;
  readonly tipo_tramite: TipoTramite;
  readonly prioridad: Prioridad;
  readonly asunto: string;
  readonly detalle_solicitud: string;
}

export interface DerivacionInput {
  readonly dependencia_asignada: Dependencia;
  readonly observaciones: string;
}

export interface EstadoUpdateInput {
  readonly estado: EstadoSolicitud;
  readonly observaciones: string;
}
