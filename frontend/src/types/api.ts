/**
 * Tipos y clases para el cliente HTTP general.
 */

export interface ApiErrorBody {
  readonly detail: string;
  readonly tipo?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly tipo: string | undefined;

  constructor(status: number, message: string, tipo?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.tipo = tipo;
  }
}
