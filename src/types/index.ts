// Enums — deben coincidir exactamente con los del backend
export type Rol = "ADMIN" | "ENTRENADOR" | "CLIENTE";
export type TipoPlan = "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
export type EstadoSuscripcion = "ACTIVA" | "VENCIDA" | "CANCELADA";

export interface UsuarioResponseDTO {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
}

export interface PlanRequestDTO {
  nombre: string;
  descripcion?: string;
  precio: number;
  duracionDias: number;
  tipo: TipoPlan;
  limiteClases?: number;
  incluyeClases: boolean;
  incluyeEntrenadorPersonal: boolean;
}

export interface PlanResponseDTO {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionDias: number;
  tipo: TipoPlan;
  limiteClases: number;
  incluyeClases: boolean;
  incluyeEntrenadorPersonal: boolean;
  activo: boolean;
  creadoEn: string;
}

export interface SuscripcionRequestDTO {
  usuarioId: number;
  planId: number;
  fechaInicio: string; // formato "YYYY-MM-DD"
}

export interface SuscripcionResponseDTO {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  planId: number;
  nombrePlan: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoSuscripcion;
  creadoEn: string;
}

// Auth — verificado contra AuthController.java / AuthResponse.java / LoginRequest.java
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

// ─── Dashboard ADMIN ──────────────────────────────────────────────
// Debe coincidir con el DTO del backend (GET /dashboard/admin/estadisticas).

export interface RolStat {
  rol: Rol;
  cantidad: number;
}

export interface IngresoTipoPlanStat {
  tipoPlan: TipoPlan;
  ingresoEstimado: number;
  cantidadSuscripciones: number;
}

export interface EstadoSuscripcionStat {
  estado: EstadoSuscripcion;
  cantidad: number;
}

export interface DashboardAdminStatsDTO {
  usuariosPorRol: RolStat[];
  ingresosPorTipoPlan: IngresoTipoPlanStat[];
  suscripcionesPorEstado: EstadoSuscripcionStat[];
}

// ─── Chatbot de soporte ───────────────────────────────────────────
// Debe coincidir con ChatController.java / ChatRequest.java / ChatResponse.java.
// mensaje: máx 2000 chars (validado también en el backend con @Size).
export interface ChatRequestDTO {
  mensaje: string;
}

export interface ChatResponseDTO {
  respuesta: string;
}
