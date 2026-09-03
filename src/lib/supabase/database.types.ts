/**
 * Tipos generados desde el esquema real de Supabase.
 *
 * Regenerar después de cada migración. Los genéricos que produce la CLI para
 * saltar entre schemas están recortados a propósito: acá se usa sólo `public`
 * y esa maquinaria era cientos de líneas de ruido.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          nombre: string;
          telefono_e164: string | null;
          telefono_visible: string | null;
          sala_id: string | null;
          zonas_entrega: string[];
          barrio: string | null;
          rol: string;
          rol_hasta: string | null;
          suspendido: boolean;
          motivo_suspension: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id: string;
          nombre?: string;
          telefono_e164?: string | null;
          telefono_visible?: string | null;
          sala_id?: string | null;
          zonas_entrega?: string[];
          barrio?: string | null;
          rol?: string;
          rol_hasta?: string | null;
          suspendido?: boolean;
          motivo_suspension?: string | null;
          creado_en?: string;
          actualizado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["perfiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "perfiles_sala_id_fkey";
            columns: ["sala_id"];
            isOneToOne: false;
            referencedRelation: "salas";
            referencedColumns: ["id"];
          },
        ];
      };
      salas: {
        Row: {
          id: string;
          nombre: string;
          direccion: string | null;
          barrio: string | null;
          lat: number | null;
          lng: number | null;
          telefono: string | null;
          sitio_web: string | null;
          instagram: string | null;
          activa: boolean;
          situacion: string;
          propuesta_por: string | null;
          zona: string | null;
          nota: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          direccion?: string | null;
          barrio?: string | null;
          lat?: number | null;
          lng?: number | null;
          telefono?: string | null;
          sitio_web?: string | null;
          instagram?: string | null;
          activa?: boolean;
          situacion?: string;
          propuesta_por?: string | null;
          zona?: string | null;
          nota?: string | null;
          creado_en?: string;
          actualizado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["salas"]["Insert"]>;
        Relationships: [];
      };
      publicaciones: {
        Row: {
          id: string;
          autor_id: string;
          titulo: string;
          descripcion: string;
          categoria: string;
          tipo: string;
          armas_compatibles: string[];
          es_electrica: boolean | null;
          empunadura: string | null;
          talle: string | null;
          nivel_proteccion: string | null;
          mano: string | null;
          marca: string | null;
          anio: number | null;
          estado: string;
          moneda_base: string;
          monto: number;
          zonas: string[];
          barrio: string | null;
          lat_aprox: number | null;
          lng_aprox: number | null;
          sala_entrega_id: string | null;
          situacion: string;
          es_oficial: boolean;
          unidades: number;
          vence_en: string;
          contactos: number;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id?: string;
          autor_id: string;
          titulo: string;
          descripcion?: string;
          categoria: string;
          tipo: string;
          armas_compatibles?: string[];
          es_electrica?: boolean | null;
          empunadura?: string | null;
          talle?: string | null;
          nivel_proteccion?: string | null;
          mano?: string | null;
          marca?: string | null;
          anio?: number | null;
          estado: string;
          moneda_base: string;
          monto: number;
          zonas: string[];
          barrio?: string | null;
          lat_aprox?: number | null;
          lng_aprox?: number | null;
          sala_entrega_id?: string | null;
          situacion?: string;
          es_oficial?: boolean;
          unidades?: number;
          vence_en?: string;
          contactos?: number;
          creado_en?: string;
          actualizado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["publicaciones"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "publicaciones_sala_entrega_id_fkey";
            columns: ["sala_entrega_id"];
            isOneToOne: false;
            referencedRelation: "salas";
            referencedColumns: ["id"];
          },
        ];
      };
      fotos: {
        Row: {
          id: string;
          publicacion_id: string;
          path: string;
          orden: number;
          creado_en: string;
        };
        Insert: {
          id?: string;
          publicacion_id: string;
          path: string;
          orden?: number;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fotos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "fotos_publicacion_id_fkey";
            columns: ["publicacion_id"];
            isOneToOne: false;
            referencedRelation: "publicaciones";
            referencedColumns: ["id"];
          },
        ];
      };
      reportes: {
        Row: {
          id: string;
          publicacion_id: string;
          reportante_id: string | null;
          motivo: string;
          creado_en: string;
        };
        Insert: {
          id?: string;
          publicacion_id: string;
          reportante_id?: string | null;
          motivo: string;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reportes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reportes_publicacion_id_fkey";
            columns: ["publicacion_id"];
            isOneToOne: false;
            referencedRelation: "publicaciones";
            referencedColumns: ["id"];
          },
        ];
      };
      torneos: {
        Row: {
          id: string;
          nombre: string;
          federacion: string | null;
          organizador_tipo: string;
          sala_id: string | null;
          armas: string[];
          contacto_inscripcion: string | null;
          fecha_inicio: string | null;
          fecha_fin: string | null;
          cierre_inscripcion: string | null;
          lugar: string | null;
          zona: string | null;
          notas: string | null;
          situacion: string;
          propuesto_por: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          federacion?: string | null;
          organizador_tipo?: string;
          sala_id?: string | null;
          armas?: string[];
          contacto_inscripcion?: string | null;
          fecha_inicio?: string | null;
          fecha_fin?: string | null;
          cierre_inscripcion?: string | null;
          lugar?: string | null;
          zona?: string | null;
          notas?: string | null;
          situacion?: string;
          propuesto_por?: string | null;
          creado_en?: string;
          actualizado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["torneos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "torneos_sala_id_fkey";
            columns: ["sala_id"];
            isOneToOne: false;
            referencedRelation: "salas";
            referencedColumns: ["id"];
          },
        ];
      };
      busquedas: {
        Row: {
          id: string;
          usuario_id: string;
          texto: string | null;
          categoria: string | null;
          tipo: string | null;
          arma: string | null;
          mano: string | null;
          talle: string | null;
          precio_max: number | null;
          moneda: string;
          activa: boolean;
          avisos: number;
          creado_en: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          texto?: string | null;
          categoria?: string | null;
          tipo?: string | null;
          arma?: string | null;
          mano?: string | null;
          talle?: string | null;
          precio_max?: number | null;
          moneda?: string;
          activa?: boolean;
          avisos?: number;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["busquedas"]["Insert"]>;
        Relationships: [];
      };
      correcciones: {
        Row: {
          id: string;
          tabla: string;
          fila_id: string;
          campos: Record<string, unknown>;
          motivo: string | null;
          propuesta_por: string;
          situacion: string;
          nota_sistema: string | null;
          creado_en: string;
          resuelto_en: string | null;
        };
        Insert: {
          id?: string;
          tabla: string;
          fila_id: string;
          campos: Record<string, unknown>;
          motivo?: string | null;
          propuesta_por: string;
          situacion?: string;
          nota_sistema?: string | null;
          creado_en?: string;
          resuelto_en?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["correcciones"]["Insert"]>;
        Relationships: [];
      };
      correcciones_votos: {
        Row: {
          correccion_id: string;
          usuario_id: string;
          creado_en: string;
        };
        Insert: {
          correccion_id: string;
          usuario_id: string;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["correcciones_votos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "correcciones_votos_correccion_id_fkey";
            columns: ["correccion_id"];
            isOneToOne: false;
            referencedRelation: "correcciones";
            referencedColumns: ["id"];
          },
        ];
      };
      categorias: {
        Row: {
          id: string;
          federacion: string;
          nombre: string;
          edad_desde: number | null;
          edad_hasta: number | null;
          activa: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          federacion: string;
          nombre: string;
          edad_desde?: number | null;
          edad_hasta?: number | null;
          activa?: boolean;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categorias"]["Insert"]>;
        Relationships: [];
      };
      torneos_categorias: {
        Row: { torneo_id: string; categoria_id: string };
        Insert: { torneo_id: string; categoria_id: string };
        Update: Partial<Database["public"]["Tables"]["torneos_categorias"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "torneos_categorias_torneo_id_fkey";
            columns: ["torneo_id"];
            isOneToOne: false;
            referencedRelation: "torneos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "torneos_categorias_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
      avisos_torneos: {
        Row: {
          id: string;
          usuario_id: string;
          armas: string[];
          categorias: string[];
          activo: boolean;
          avisos: number;
          creado_en: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          armas?: string[];
          categorias?: string[];
          activo?: boolean;
          avisos?: number;
          creado_en?: string;
        };
        Update: Partial<Database["public"]["Tables"]["avisos_torneos"]["Insert"]>;
        Relationships: [];
      };
      cotizacion_cache: {
        Row: { id: boolean; venta: number; fuente: string; actualizado: string };
        Insert: { id?: boolean; venta: number; fuente: string; actualizado?: string };
        Update: Partial<Database["public"]["Tables"]["cotizacion_cache"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      /** Devuelve el teléfono de a uno; el resto del tiempo no se expone. */
      contacto_whatsapp: { Args: { pub_id: string }; Returns: string | null };
      es_admin: { Args: Record<never, never>; Returns: boolean };
      /** Rol vigente, ya considerando el vencimiento del plan pro. */
      rol_efectivo: { Args: { usuario: string }; Returns: string };
      limite_efectivo: { Args: { usuario: string }; Returns: number };
      /** Admins y cuentas pagas: son los únicos que pueden publicar con stock. */
      puede_cargar_stock: { Args: Record<never, never>; Returns: boolean };
      /** Cuántos avales hacen falta hoy: 5% de las cuentas activas, entre 3 y 10. */
      votos_para_aplicar: { Args: Record<never, never>; Returns: number };
      /** Escribe una corrección sobre la fila. Sólo service role o el trigger. */
      aplicar_correccion: { Args: { c_id: string }; Returns: boolean };
      /** Sólo la llama el cron, con la service role key. */
      vencer_publicaciones: { Args: Record<never, never>; Returns: number };
      /** Sólo la llama el cron, con la service role key. */
      fotos_huerfanas: { Args: { horas: number }; Returns: { ruta: string }[] };
      /** A quién avisarle por una publicación nueva. Sólo service role. */
      sumar_aviso: { Args: { busqueda: string }; Returns: undefined };
      /** A quién avisarle de un torneo nuevo. Sólo service role. */
      destinatarios_de_torneo: {
        Args: { t_id: string };
        Returns: { aviso_id: string; email: string; armas: string[] }[];
      };
      sumar_aviso_torneo: { Args: { aviso: string }; Returns: undefined };
      destinatarios_de_aviso: {
        Args: { pub_id: string };
        Returns: { busqueda_id: string; email: string; texto: string | null }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/* Atajos para no escribir la cadena entera en cada consulta. */

type Tablas = Database["public"]["Tables"];

export type Fila<T extends keyof Tablas> = Tablas[T]["Row"];
export type NuevaFila<T extends keyof Tablas> = Tablas[T]["Insert"];
export type CambioFila<T extends keyof Tablas> = Tablas[T]["Update"];

export type Publicacion = Fila<"publicaciones">;
export type Perfil = Fila<"perfiles">;
export type SalaFila = Fila<"salas">;
export type Foto = Fila<"fotos">;
