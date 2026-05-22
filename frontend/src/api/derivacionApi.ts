/**
 * Cliente HTTP unificado del modulo Mesa de Partes (HU04).
 *
 * Aisla a las capas superiores del transporte ``fetch`` y unifica el
 * tratamiento de errores via {@link ApiError}.
 */

import { ApiError, type ApiErrorBody } from "@/types/api";
import type {
  DerivacionInput,
  EstadoUpdateInput,
  Solicitud,
  SolicitudInput,
} from "@/types/derivacion";

const DEFAULT_BASE_URL = "http://localhost:8000";

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  DEFAULT_BASE_URL;

async function parseError(response: Response): Promise<ApiError> {
  let detail = `HTTP ${response.status}`;
  let tipo: string | undefined;
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body?.detail) detail = body.detail;
    if (body?.tipo) tipo = body.tipo;
  } catch {
    // Cuerpo no JSON; conservamos detalle por defecto.
  }
  return new ApiError(response.status, detail, tipo);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.", "NetworkError");
  }
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

// --- Endpoints de Ciudadano ---

export function registrarSolicitud(payload: SolicitudInput): Promise<Solicitud> {
  return request<Solicitud>("/api/solicitudes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function obtenerSolicitud(solicitudId: string): Promise<Solicitud> {
  return request<Solicitud>(`/api/solicitudes/${solicitudId}`);
}

export function listarSolicitudesUsuario(usuarioId: string): Promise<readonly Solicitud[]> {
  return request<readonly Solicitud[]>(`/api/solicitudes/usuario/${usuarioId}`);
}

// --- Endpoints de Administrador ---

export function listarSolicitudesEntrantes(adminToken: string): Promise<readonly Solicitud[]> {
  return request<readonly Solicitud[]>("/api/admin/solicitudes", {
    headers: {
      "X-Admin-Token": adminToken,
    },
  });
}

export function derivarSolicitud(
  idSolicitud: string,
  payload: DerivacionInput,
  adminToken: string,
): Promise<Solicitud> {
  return request<Solicitud>(`/api/admin/solicitudes/${idSolicitud}/derivar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
    },
    body: JSON.stringify(payload),
  });
}

export function actualizarEstadoSolicitud(
  idSolicitud: string,
  payload: EstadoUpdateInput,
  adminToken: string,
): Promise<Solicitud> {
  return request<Solicitud>(`/api/admin/solicitudes/${idSolicitud}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
    },
    body: JSON.stringify(payload),
  });
}
