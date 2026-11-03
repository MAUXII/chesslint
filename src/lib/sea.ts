export function isOpenWater(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object" || !("closest" in target)) return false
  const element = target as { closest: (selector: string) => unknown }
  return element.closest("[data-sea-block], [role='dialog']") == null
}
