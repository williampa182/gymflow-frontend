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
  // Fase 2: el usuario puede pedir nacer CLIENTE o ENTRENADOR. El backend
  // degrada cualquier otro valor (incluido ADMIN) a CLIENTE — nunca se
  // auto-escala. Ausente = CLIENTE.
  rol?: "CLIENTE" | "ENTRENADOR";
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

// ─── Fase 4: rutinas y acompañamiento ─────────────────────────────
// Coinciden con los DTOs del backend (RutinaResponseDTO, EjercicioResponseDTO,
// ClienteElegibleDTO, MiEntrenadorDTO).

export interface EjercicioRequestDTO {
  // id presente = actualizar ejercicio existente en el PUT
  id?: number | null;
  nombre: string;
  series: number;
  repeticiones: number;
}

export interface RutinaRequestDTO {
  nombre: string;
  descripcion?: string;
  ejercicios: EjercicioRequestDTO[];
}

export interface EjercicioResponseDTO {
  id: number;
  nombre: string;
  series: number;
  repeticiones: number;
  orden: number;
}

export interface RutinaResponseDTO {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  creadoEn: string;
  ejercicios: EjercicioResponseDTO[];
  // clientes que tienen asignada esta rutina (solo en la vista ENTRENADOR;
  // para el CLIENTE siempre llega vacía — no filtra qué otros clientes la tienen)
  asignados: ClienteAsignadoDTO[];
}

export interface ClienteAsignadoDTO {
  id: number;
  nombre: string;
}

export interface ClienteElegibleDTO {
  id: number;
  nombre: string;
  yaAcompaño: boolean;
  // id de la asignación activa del entrenador autenticado (null si no lo acompaña)
  asignacionId: number | null;
}

export interface MiEntrenadorDTO {
  id: number;
  nombre: string;
  asignadoEn: string;
}

export interface HistorialAcompanamientoDTO {
  id: number;
  entrenadorNombre: string;
  activa: boolean;
  asignadoEn: string;
}

// ─── Fase 5: asistencias, carnet y kiosco ─────────────────────────
// Coinciden con los DTOs del backend (AsistenciaResponseDTO,
// AsistenciaSemanaDTO, AsistenciaAcompanadoDTO, CarnetResponseDTO,
// KioscoConfigResponseDTO, KioscoKeyResponseDTO, dashboard #13).

export type MetodoAsistencia = "SELF" | "ADMIN" | "KIOSK_CARNET";

export interface AsistenciaResponseDTO {
  id: number;
  usuarioId: number;
  nombre: string;
  fecha: string; // "YYYY-MM-DD"
  entradaEn: string;
  salidaEn: string | null;
  metodo: MetodoAsistencia;
}

export interface AsistenciaSemanaDTO {
  fechaDesde: string;
  fechaHasta: string;
  total: number;
  asistencias: AsistenciaResponseDTO[];
}

export interface AsistenciaAcompanadoDTO {
  clienteId: number;
  clienteNombre: string;
  asistencias: AsistenciaResponseDTO[];
}

export interface CarnetResponseDTO {
  codigoCarnet: string;
  // Solo presente en la vista ADMIN (reimpresión); el CLIENTE solo recibe el código.
  nombre?: string;
}

export interface KioscoConfigResponseDTO {
  configurada: boolean;
}

export interface KioscoKeyResponseDTO {
  key: string;
}

export interface AsistenciaDiaStat {
  fecha: string;
  cantidad: number;
}

export interface AsistenciasSemanaStatsDTO {
  asistenciasHoy: number;
  asistenciasSemana: AsistenciaDiaStat[];
}

export interface AdminMarcarAsistenciaRequestDTO {
  usuarioId: number;
}
