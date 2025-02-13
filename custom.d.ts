// custom.d.ts
declare global {
  namespace Electron {
    interface App {
      isQuiting?: boolean; // Add the 'isQuiting' property to the App type
    }
  }
}

export {};
