import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { c1Path, stripC1Base } from "../c1/lib/routes";

export function usePathname() {
  return stripC1Base(useLocation().pathname);
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(c1Path(href)),
    replace: (href: string) => navigate(c1Path(href), { replace: true }),
    back: () => navigate(-1),
  };
}

/** Next.js-compatible: returns URLSearchParams with .get(), .toString(), etc. */
export function useSearchParams(): URLSearchParams {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

export { useParams };

export function redirect(_url: string): never {
  throw new Error("redirect() is only supported through React Router route configuration.");
}
