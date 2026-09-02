import { forwardRef } from "react";
import { Link as RouterLink, type LinkProps } from "react-router-dom";
import { c1Path } from "../c1/lib/routes";

type NextLinkProps = Omit<LinkProps, "to"> & { href?: string; to?: string };

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function Link({ href, to, ...props }, ref) {
  const target = c1Path(href ?? to ?? "#");
  return <RouterLink ref={ref} to={target} {...props} />;
});

export default Link;
