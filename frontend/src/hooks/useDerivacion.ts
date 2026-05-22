/**
 * Custom Hook que encapsula el flujo asincrono para el panel administrativo.
 */

import { useCallback, useState } from "react";
import {
  derivarSolicitud,
  listarSolicitudesEntrantes,
  actualizarEstadoSolicitud,
} from "@/api/derivacionApi";
import { ApiError } from "@/types/api";
import type {
  DerivacionInput,
  EstadoUpdateInput,
  Solicitud,
} from "@/types/derivacion";

export interface UseDerivacionState {
  readonly solicitudes: readonly Solicitud[];
  readonly cargandoListado: boolean;
  readonly enviandoDerivacion: boolean;
  readonly errorListado: ApiError | null;
  readonly errorDerivacion: ApiError | null;
  readonly ultimaDerivada: Solicitud | null;
}

export interface UseDerivacionResult extends UseDerivacionState {
  readonly recargar: (adminToken: string) => Promise<void>;
  readonly derivar: (
    idSolicitud: string,
    payload: DerivacionInput,
    adminToken: string,
  ) => Promise<Solicitud | null>;
  readonly actualizarEstado: (
    idSolicitud: string,
    payload: EstadoUpdateInput,
    adminToken: string,
  ) => Promise<Solicitud | null>;
  readonly limpiarUltima: () => void;
}

const ESTADO_INICIAL: UseDerivacionState = {
  solicitudes: [],
  cargandoListado: false,
  enviandoDerivacion: false,
  errorListado: null,
  errorDerivacion: null,
  ultimaDerivada: null,
};

function aApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(0, "Error inesperado en el cliente.");
}

export function useDerivacion(): UseDerivacionResult {
  const [estado, setEstado] = useState<UseDerivacionState>(ESTADO_INICIAL);

  const recargar = useCallback(async (adminToken: string): Promise<void> => {
    if (!adminToken) return;
    setEstado((prev) => ({ ...prev, cargandoListado: true, errorListado: null }));
    try {
      const solicitudes = await listarSolicitudesEntrantes(adminToken);
      setEstado((prev) => ({
        ...prev,
        solicitudes,
        cargandoListado: false,
      }));
    } catch (err) {
      setEstado((prev) => ({
        ...prev,
        cargandoListado: false,
        errorListado: aApiError(err),
      }));
    }
  }, []);

  const derivar = useCallback(
    async (
      idSolicitud: string,
      payload: DerivacionInput,
      adminToken: string,
    ): Promise<Solicitud | null> => {
      setEstado((prev) => ({
        ...prev,
        enviandoDerivacion: true,
        errorDerivacion: null,
        ultimaDerivada: null,
      }));
      try {
        const derivada = await derivarSolicitud(idSolicitud, payload, adminToken);
        setEstado((prev) => ({
          ...prev,
          enviandoDerivacion: false,
          ultimaDerivada: derivada,
          solicitudes: prev.solicitudes.map((s) => (s.id === derivada.id ? derivada : s)),
        }));
        return derivada;
      } catch (err) {
        setEstado((prev) => ({
          ...prev,
          enviandoDerivacion: false,
          errorDerivacion: aApiError(err),
        }));
        return null;
      }
    },
    [],
  );

  const actualizarEstado = useCallback(
    async (
      idSolicitud: string,
      payload: EstadoUpdateInput,
      adminToken: string,
    ): Promise<Solicitud | null> => {
      setEstado((prev) => ({
        ...prev,
        enviandoDerivacion: true,
        errorDerivacion: null,
      }));
      try {
        const actualizada = await actualizarEstadoSolicitud(idSolicitud, payload, adminToken);
        setEstado((prev) => ({
          ...prev,
          enviandoDerivacion: false,
          solicitudes: prev.solicitudes.map((s) => (s.id === actualizada.id ? actualizada : s)),
        }));
        return actualizada;
      } catch (err) {
        setEstado((prev) => ({
          ...prev,
          enviandoDerivacion: false,
          errorDerivacion: aApiError(err),
        }));
        return null;
      }
    },
    [],
  );

  const limpiarUltima = useCallback((): void => {
    setEstado((prev) => ({ ...prev, ultimaDerivada: null }));
  }, []);

  return { ...estado, recargar, derivar, actualizarEstado, limpiarUltima };
}
