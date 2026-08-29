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
          es_admin: boolean;
          limite_publicaciones: number;
          limite_hasta: string | null;
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
          es_admin?: boolean;
          limite_publicaciones?: number;
          limite_hasta?: string | null;
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
          creado_en: string;
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
          creado_en?: string;
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
      /** Admins y cuentas pagas: son los únicos que pueden publicar con stock. */
      puede_cargar_stock: { Args: Record<never, never>; Returns: boolean };
      /** Sólo la llama el cron, con la service role key. */
      vencer_publicaciones: { Args: Record<never, never>; Returns: number };
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
