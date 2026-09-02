export const C1_BASE = "/component/child-monitoring";

const C1_ROOTS = ["/dashboard", "/children", "/alerts", "/visits", "/analytics", "/reports", "/research", "/admin"];

export function c1Path(path: string): string {
  if (!path.startsWith("/")) return `${C1_BASE}/${path}`;
  if (path.startsWith(C1_BASE)) return path;
  if (C1_ROOTS.some((root) => path === root || path.startsWith(`${root}/`) || path.startsWith(`${root}?`))) {
    return `${C1_BASE}${path}`;
  }
  return path;
}

export function stripC1Base(pathname: string): string {
  if (pathname.startsWith(C1_BASE)) {
    const rest = pathname.slice(C1_BASE.length);
    return rest || "/dashboard";
  }
  return pathname;
}
