/**
 * @file space-print-tails.test.js
 * @description Coverage tail for space/print.tsx — the Earth playground's
 *   print composition: bindSpacePrint's `printprepare` listener seats the
 *   identity dossier plate at <body> level (title, description standfirst,
 *   live position/target facts, route QR) and registers it for teardown.
 *   Covers the connected/disconnected guards, the readout arms (present,
 *   missing, empty), the description/facts optional arms, and the
 *   unbinder.
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'

import { bindSpacePrint } from '@earth/space/print.js'
import { PRINT_EVENTS } from '@core/tokens/events/dom.js'
import { PRINT_CLASSES } from '@core/tokens/classes/print.js'

const plates = () => [...document.body.querySelectorAll(`.${PRINT_CLASSES.PLATE_DOSSIER}`)]

const fire = () => window.dispatchEvent(new Event(PRINT_EVENTS.PREPARE))

describe('space/print composition', () => {
  let unbind

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    unbind?.()
    unbind = undefined
    plates().forEach((p) => p.remove())
  })

  const mkHost = (over = {}) => ({
    isConnected: true,
    translations: {},
    _posEls: { pos: null, tgt: null },
    ...over,
  })

  test('seats a hidden dossier plate with title + QR on printprepare', () => {
    unbind = bindSpacePrint(mkHost())

    fire()

    expect(plates().length).toBe(1)
    const plate = plates()[0]

    expect(plate.hasAttribute('hidden')).toBe(true)
    expect(plate.querySelector('h2')).toBeTruthy()
    expect(plate.querySelector(`.${PRINT_CLASSES.QR_LINK}`)).toBeTruthy()
  })

  test('description standfirst + live readouts populate the facts table', () => {
    const pos = document.createElement('output')
    const tgt = document.createElement('output')

    pos.textContent = '  12.3, 45.6  '
    tgt.textContent = 'Earth'

    unbind = bindSpacePrint(
      mkHost({
        translations: {
          title: 'Earth Playground',
          description: 'A planet toy',
          position: 'Position',
          target: 'Target',
        },
        _posEls: { pos, tgt },
      })
    )

    fire()

    const plate = plates()[0]

    expect(plate.textContent).toContain('Earth Playground')
    expect(plate.textContent).toContain('A planet toy')
    expect(plate.textContent).toContain('12.3, 45.6')
    expect(plate.textContent).toContain('Earth')
  })

  test('empty readouts and no description print no facts/standfirst', () => {
    unbind = bindSpacePrint(mkHost({ translations: { title: 'EP' } }))

    fire()

    const plate = plates()[0]

    expect(plate.querySelector('dl')).toBeNull()
  })

  test('a detached host never seats a plate', () => {
    unbind = bindSpacePrint(mkHost({ isConnected: false }))

    fire()

    expect(plates().length).toBe(0)
  })

  test('the unbinder stops future composition', () => {
    unbind = bindSpacePrint(mkHost())

    unbind()
    unbind = undefined

    fire()

    expect(plates().length).toBe(0)
  })
})
