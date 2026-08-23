// Type shims so `tsc` accepts CSS side-effect and CSS-module imports
// that Metro/Expo handle at bundle time.
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
