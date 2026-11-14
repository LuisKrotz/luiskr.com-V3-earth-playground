/**
 * @file space-print-wrapup-tails.test.js
 * @description Wrap-up coverage tails for space/print.tsx — the arms
 *   the first tails file leaves open: a nullish `host.translations`
 *   (`?? {}` fallback), the document.title `.find` callback's
 *   `part.toLowerCase() !== BASE_TITLE` comparison on a truthy
 *   segment, `t.position ?? EMPTY` / `t.target ?? EMPTY` on a
 *   label-less map, and the `qr ? link : null` cond's null arm on an
 *   over-capacity URL.
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'

import { bindSpacePrint } from '@earth/space/print.js'
import { PRINT_EVENTS } from '@core/tokens/events/dom.js'
import { PRINT_CLASSES } from '@core/tokens/classes/print.js'
import { HTML_TAGS, HTML_PHRASING_TAGS } from '@core/tokens/elements/html.js'
import { CHAR_STRINGS } from '@core/tokens/strings/chars.js'
import { BASE_TITLE } from '@core/tokens/routes.js'
import { TEST_TEXT } from '@tests/fixtures/test-constants.js'

/** Injected dossier plates seated at body level by the prepare answer. */
const plates = () => [...document.body.querySelectorAll(`.${PRINT_CLASSES.PLATE_DOSSIER}`)]

/** Dispatches the print-prepare event the view listens for. */
const fire = () => window.dispatchEvent(new Event(PRINT_EVENTS.PREPARE))

describe('space/print wrap-up arms', () => {
  let unbind
  let origTitle
  let origPath

  beforeEach(() => {
    document.body.innerHTML = ''

    origTitle = document.title
    origPath = window.location.pathname + window.location.search
  })

  afterEach(() => {
    unbind?.()
    unbind = undefined

    document.title = origTitle

    window.history.replaceState(null, '', origPath)

    plates().forEach((p) => p.remove())
  })

  test('no translations + over-capacity URL — `?? {}`, title find, label-less facts, qr-null arm', () => {
    const pos = document.createElement(HTML_TAGS.DIV)
    const tgt = document.createElement(HTML_TAGS.DIV)

    pos.textContent = '12.3, 45.6'
    tgt.textContent = TEST_TEXT.HEADING

    // A real title segment forces the find callback's `part.toLowerCase()
    // !== BASE_TITLE` comparison on a truthy part (the uncovered `&&` arm).
    document.title = `${TEST_TEXT.HEADING} ${CHAR_STRINGS.PIPE_SEP} ${BASE_TITLE}`

    // Past the v40-M byte ceiling the encoder bails — qr lands null and
    // the plate seats without its anchor link.
    window.history.replaceState(null, '', `${CHAR_STRINGS.SLASH}${'a'.repeat(2500)}`)

    unbind = bindSpacePrint({
      isConnected: true,
      translations: undefined,
      _posEls: { pos, tgt },
    })

    fire()

    const plate = plates()[0]

    expect(plate).toBeTruthy()
    expect(plate.querySelector(HTML_TAGS.H2).textContent).toBe(TEST_TEXT.HEADING)
    expect(plate.querySelectorAll(HTML_PHRASING_TAGS.DT).length).toBe(2)
    expect(plate.querySelector(`.${PRINT_CLASSES.QR_LINK}`)).toBeNull()
  })
})
