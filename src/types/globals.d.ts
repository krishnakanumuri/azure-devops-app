// btoa/atob are available as globals in both React Native (Hermes) and browsers
declare function btoa(data: string): string;
declare function atob(data: string): string;

// Minimal process.env declaration for env vars injected by webpack DefinePlugin.
// Avoids pulling in all of @types/node for a React Native project.
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL?: string;
  };
};
