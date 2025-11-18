// Extend React input attributes for folder selection
declare global {
  namespace React {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
      webkitdirectory?: string;
      directory?: string;
    }
  }
}

export {};

