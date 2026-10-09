/**
 * @file space-playground-module-reeval.test.js
 * @description Module re-eval arm — kept in its own file because
 * jest.resetModules() discards istanbul counters recorded earlier in a
 * shared module registry (see testing-conventions: reset-free tails).
 */
import { expect, jest, test } from '@jest/globals'
import { VIEW_TAGS } from '@core/tokens/elements/views.js'

await import('@earth/SpacePlayground.js')

test('module re-eval skips custom-element redefinition', async () => {
  expect(customElements.get(VIEW_TAGS.VIEW_SPACE_PLAYGROUND)).toBeTruthy()

  jest.resetModules()

  await import('@earth/SpacePlayground.js')
})
