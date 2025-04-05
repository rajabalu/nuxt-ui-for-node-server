export interface Column {
  key: string;
  title?: string;
  i18n?: string;
  align?: 'start' | 'end' | 'center';
  sortable?: boolean;
  width?: string | number;
  filterable?: boolean;
  hidden?: boolean;
  editable?: boolean;
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'currency';
  format?: (value: any, item: any) => string;
  options?: Array<{ title: string; value: any }>;
  primary?: boolean;
}

export interface ApiConfig {
  list: string;
  view?: string;
  create?: string;
  edit?: string;
  delete?: string;
  update?: string;
  search?: string;
  bulkDelete?: string;
  export?: string;
}

export interface CrudConfig {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInlineEdit?: boolean;
  canExport?: boolean;
  canSelect?: boolean;
  viewPath?: string;
  addPath?: string;
  editPath?: string;
  defaultParams?: Record<string, any>;
  primaryKey?: string;
}

export interface Filter {
  key: string;
  label?: string;
  i18n?: string;
  type: 'text' | 'number' | 'select' | 'date' | 'daterange' | 'boolean';
  options?: Array<{ title: string; value: any }>;
  default?: any;
}

export interface SortConfig {
  key: string;
  order: 'asc' | 'desc';
}

export interface Pagination {
  page: number;
  total: number;
  limit: number;
  hasNextPage?: boolean;
} 