export interface UploadFile extends File {
  uploadTarget: string;
  elapsed: number;
  elapsedStr: string;
  remaining: number;
  remainingStr: string;
  progress: number;
  speed: number;
  totalStr: string;
  loaded: number;
  loadedStr: string;
  status: string;
  error: string;
  abort?: boolean;
  complete?: boolean;
  uploading?: boolean;
}

export interface UploadI18n {
  dropFiles: {
    one: string;
    many: string;
  };
  addFiles: {
    one: string;
    many: string;
  };
  cancel: string;
  error: {
    tooManyFiles: string;
    fileIsTooBig: string;
    incorrectFileType: string;
  };
  uploading: {
    status: {
      connecting: string;
      stalled: string;
      processing: string;
      held: string;
    };
    remainingTime: {
      prefix: string;
      unknown: string;
    };
    error: {
      serverUnavailable: string;
      unexpectedServerError: string;
      forbidden: string;
    };
  };
  units: {
    size: string[];
    sizeBase?: number;
  };
  formatSize?: (bytes: number) => string;
  formatTime?: (seconds: number, units: number[]) => string;
}

export type UploadMethod = "POST" | "PUT";
