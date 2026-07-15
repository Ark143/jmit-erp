// Global type declarations for the JMIT ERP browser app

import type { AppState } from "./types";

declare global {
  interface Window {
    showToast(message: string, type?: "info" | "success" | "warning" | "danger"): void;
  }
}

export {};
