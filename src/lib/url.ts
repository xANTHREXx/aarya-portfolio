/** Prefix a site-root path ("/work/x/", "/#about", "/img/a.jpg") with the deploy base, e.g. "/aarya-portfolio". */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const withBase = (path: string) => (path.startsWith("/") ? base + path : path);
