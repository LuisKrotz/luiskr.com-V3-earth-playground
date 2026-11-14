/**
 * @file space/print.tsx
 * @description Print composition for the Earth playground — on
 *   `printprepare` the scene's identity spread seats as a
 *   `.print-plate--dossier` sheet at `<body>` level: the route title,
 *   its localized description as standfirst, the live position/target
 *   readouts as a facts table, and a QR back to the route. The plate
 *   registers with `trackPrintNode` so exit removes it; the job is
 *   synchronous (no fetches — translations and readouts are already
 *   live state).
 */
import { ATTR_VALUES } from '@core/tokens/attrs/values.js'
import { CHAR_STRINGS } from '@core/tokens/strings/chars.js'
import { PRINT_CLASSES } from '@core/tokens/classes/print.js'
import { PRINT_EVENTS } from '@core/tokens/events/dom.js'
import { SF_CLASSES } from '@core/tokens/classes/starfield.js'
import { BASE_TITLE } from '@core/tokens/routes.js'
import { h } from '@core/jsx.js'
import { qrSvg } from '@core/utils/print/qr.js'
import { trackPrintNode } from '@core/utils/print/print.js'
import type { SpacePlayground } from '../SpacePlayground.js'

/**
 * Reads one live readout's current text — the HUD nodes update on a
 * rAF loop, so textContent is the freshest value the print can carry.
 * @param el The cached readout node (or null before first sync).
 * @returns Trimmed readout text, or '' when unreadable.
 */
const readoutText = (el: Element | null | undefined): string =>
  el?.textContent?.trim() ?? ATTR_VALUES.EMPTY

/**
 * Composes the scene's identity sheet — magazine masthead pattern:
 * name, description standfirst, a compact facts block with the live
 * camera state at prepare time, and the route QR anchored to the
 * sheet's bottom-right like every plate's scan code.
 * @param host The live SpacePlayground.
 * @param t Merged locale label map.
 * @returns The plate element (hidden until print media applies).
 */
const infoPlate = (host: SpacePlayground, t: Record<string, unknown>): HTMLElement => {
  const url = `${window.location.origin}${window.location.pathname}`

  const title =
    String(t.title ?? ATTR_VALUES.EMPTY) ||
    document.title
      .split(CHAR_STRINGS.PIPE_SEP)
      .map((part) => part.trim())
      .find((part) => part && part.toLowerCase() !== BASE_TITLE.toLowerCase()) ||
    ATTR_VALUES.EMPTY

  const facts: Array<[string, string]> = []

  const pos = readoutText(host._posEls?.pos)
  const tgt = readoutText(host._posEls?.tgt)

  if (pos) facts.push([String(t.position ?? ATTR_VALUES.EMPTY), pos])
  if (tgt) facts.push([String(t.target ?? ATTR_VALUES.EMPTY), tgt])

  const qr = qrSvg(url)

  return (
    <section className={`${PRINT_CLASSES.PLATE} ${PRINT_CLASSES.PLATE_DOSSIER}`} hidden>
      <header>
        <h2>{title}</h2>
      </header>

      {t.description ? (
        <p className={SF_CLASSES.SF_PANEL_TAGLINE}>{String(t.description)}</p>
      ) : null}

      {facts.length ? (
        <dl className={SF_CLASSES.SF_FACTS}>
          {facts.map(([label, value]) => (
            <div key={label} className={SF_CLASSES.SF_FACT}>
              <dt className={SF_CLASSES.SF_FACT_KEY}>{label}</dt>
              <dd className={SF_CLASSES.SF_FACT_VAL}>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {qr ? (
        <a className={PRINT_CLASSES.QR_LINK} href={url}>
          {qr}
        </a>
      ) : null}
    </section>
  ) as HTMLElement
}

/**
 * Binds the playground's print composition — a `printprepare` listener
 * that seats the info plate. Returns the unbinder for the view's
 * teardown.
 * @param host The live SpacePlayground component.
 * @returns Cleanup that removes the listener.
 */
export function bindSpacePrint(host: SpacePlayground): () => void {
  const onPrepare = (): void => {
    if (!host.isConnected) return

    const plate = infoPlate(host, host.translations ?? {})

    document.body.appendChild(plate)

    trackPrintNode(plate)
  }

  window.addEventListener(PRINT_EVENTS.PREPARE, onPrepare)

  return () => window.removeEventListener(PRINT_EVENTS.PREPARE, onPrepare)
}
