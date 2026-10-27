/**
 * @file space/schema.ts
 * @description Runtime JSON-LD parity for the Earth Playground route —
 * the prerendered WebApplication entity is replaced by the router's base
 * graph on hydration, so this re-emits the full graph (route base +
 * WebApplication with the localized control surface as featureList)
 * once the label translations have resolved.
 */
import { NET_STRINGS } from '@core/tokens/strings/net.js'
import { ROUTE_PATHS } from '@core/tokens/routes/paths.js'
import { BASE_TITLE } from '@core/tokens/routes.js'
import { CHAR_STRINGS } from '@core/tokens/strings/chars.js'
import { VIEW_TAGS } from '@core/tokens/elements/views.js'
import { generateEarthPlaygroundSchema, updateJsonLd } from '@core/utils/schema.js'
import router from '@core/router/router.js'
import store from '@core/store.js'
import { SLIDER_GROUPS } from './controls.js'
import type { SpacePlayground } from '../SpacePlayground.js'

/**
 * Route meta title minus the BASE_TITLE affixes — the same page-name
 * derivation buildRouteJsonLd applies, so the emitted WebPage/WebApplication
 * names match the document title.
 * @param title The route's meta title.
 * @returns The bare page name.
 */
const _pageName = (title: unknown): string => {
  const raw = String(title || BASE_TITLE)

  return raw
    .replace(`${BASE_TITLE} ${CHAR_STRINGS.PIPE_SEP} `, CHAR_STRINGS.EMPTY)
    .replace(` ${CHAR_STRINGS.PIPE_SEP} ${BASE_TITLE}`, CHAR_STRINGS.EMPTY)
}

/**
 * Emits the Earth Playground graph — route base + WebApplication whose
 * `featureList` enumerates every control group's localized label, every
 * control's localized label and every group action, mirroring the
 * build-time entity so the post-hydration graph keeps parity with the
 * served document (and the canvas-rendered panel stays crawler-legible).
 * @param c The view — translations supply the localized labels.
 */
export function emitSpaceJsonLd(c: SpacePlayground): void {
  const route = router.currentRoute

  if (!route || route.view !== VIEW_TAGS.VIEW_SPACE_PLAYGROUND) return

  const url = `${NET_STRINGS.SITE_URL}${route.meta?.canonical || route.path || ROUTE_PATHS.ROOT}`

  const labels = c.translations || {}

  const label = (key: string): string => (labels[key] as string) || key

  const features = SLIDER_GROUPS.flatMap((group) => [
    label(group.label),
    ...group.controls.map((ctrl) => label(ctrl.label)),
    ...(group.actions || []).map((action) => label(action.label)),
  ])

  updateJsonLd(
    generateEarthPlaygroundSchema({
      url,
      name: _pageName(route.meta?.title),
      lang: store.getters.getLang(),
      features,
    })
  )
}
