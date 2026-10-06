/**
 * A roast has two names, as in Artisan: its own name (the controller's roast or
 * profile name, such as "A_170926") and the coffee that went in ("Ethiopia
 * Yirgacheffe"). The roast name leads and the coffee follows; a roast without a
 * name of its own leads with the coffee instead, so it is never shown twice.
 */
export function roastNames(
  roast: { title: string | null; beanName: string | null },
  noBeanName: string,
): { heading: string; coffee: string | null } {
  if (roast.title) return { heading: roast.title, coffee: roast.beanName || noBeanName };
  return { heading: roast.beanName || noBeanName, coffee: null };
}
