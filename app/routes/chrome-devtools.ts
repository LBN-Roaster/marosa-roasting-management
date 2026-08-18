// Resource route: Chrome DevTools ("Automatic Workspace Folders") probes this
// path on every dev origin. There is no workspace config to serve, so answer
// with 204 No Content to keep it out of the "No route matches URL" server logs.
export function loader() {
  return new Response(null, { status: 204 });
}
