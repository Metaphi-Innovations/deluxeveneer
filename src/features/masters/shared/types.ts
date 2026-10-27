export type MasterFieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "file"
  | "toggle"
  | "checkbox";

export interface MasterUploadedFileValue {
  file?: File;
  mimeType?: string;
  name: string;
  previewUrl?: string;
}

export type MasterFieldValue =
  | string
  | boolean
  | Date
  | null
  | MasterUploadedFileValue;

export interface MasterColumn {
  key: string;
  label: string;
  /** Master data columns are filterable by default; set false only for UI-only columns. */
  filterable?: boolean;
  /**
   * Listing cell link. `gmail` opens Gmail compose with the cell value as To.
   * `none` disables automatic tel: linking (e.g. phone columns).
   */
  cellLink?: "gmail" | "none";
}

export interface MasterFilterDefinition {
  key: string;
  label: string;
  options: string[];
}

export interface MasterFieldDefinition {
  key: string;
  label: string;
  type: MasterFieldType;
  autoFillFrom?: {
    rows: MasterRecord[];
    sourceSlug?: string;
    sourceKey: string;
    sourceMatchKey: string;
    sourceValueKey: string;
  };
  helperText?: string;
  options?: string[];
  placeholder?: string;
  readOnly?: boolean;
  onOpenDropdown?: () => void;
  renderDropdownAction?: (helpers: { close: () => void }) => React.ReactNode;
  required?: boolean;
  rows?: number;
  span?: "single" | "full";
  columnSpan?: number;
  maxWidth?: number | string | Record<string, number | string>;
}

export interface MasterRecord {
  id: string;
  [key: string]: string | boolean | Date | null | undefined;
}

export interface MasterDefinition {
  slug: string;
  title: string;
  gridColumns: 1 | 2 | 3 | 4 | 5;
  columns: MasterColumn[];
  filters: MasterFilterDefinition[];
  fields: MasterFieldDefinition[];
  rows: MasterRecord[];
}
