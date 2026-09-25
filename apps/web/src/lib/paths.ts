const hasExtension = (path: string) => /\.[a-z0-9]+$/i.test(path);

/**
 * Prefixes a root-relative path with the deploy base and normalises the
 * trailing slash so links match `build.format: 'directory'` without redirects.
 */
export function withBase(path: string, base: string): string {
  const [pathname, suffix = ''] = splitSuffix(path);
  const root = base.replace(/\/+$/, '');
  if (root && (pathname === root || pathname.startsWith(`${root}/`))) return path;

  let normalised = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (!hasExtension(normalised) && !normalised.endsWith('/')) normalised += '/';
  return `${root}${normalised}${suffix}`;
}

function splitSuffix(path: string): [string, string?] {
  const index = path.search(/[?#]/);
  return index === -1 ? [path] : [path.slice(0, index), path.slice(index)];
}

/** Site-aware helper for components. */
export const href = (path: string) => withBase(path, import.meta.env.BASE_URL);
