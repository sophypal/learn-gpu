/// <reference types="vite/client" />

declare module '*.wesl?static' {
    const content: string;
    export default content;
}
