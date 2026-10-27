/**
 * @file space-schema-tails.test.js
 * @description Coverage tails for space/schema.ts — emitSpaceJsonLd
 * route guards, canonical/path URL selection, localized featureList
 * labels with key fallbacks, and the title page-name derivation.
 */
import { describe, test, expect, afterEach } from '@jest/globals'
import { VIEW_TAGS } from '@core/tokens/elements/views.js'
import { SCHEMA_STRINGS } from '@core/tokens/strings/schema.js'
import router from '@core/router/router.js'
import { emitSpaceJsonLd } from '@earth/space/schema.js'
import { generateProjectSchema } from '@core/utils/schema.js'
import { TEST_PROJECTS, TEST_TEXT } from '@tests/fixtures/test-constants.js'

const graphPayload = () => {
  const el = document.getElementById(SCHEMA_STRINGS.JSON_LD_SCRIPT_ID)

  return el ? JSON.parse(el.textContent) : null
}

const SP_ROUTE = (over = {}) => ({
  view: VIEW_TAGS.VIEW_SPACE_PLAYGROUND,
  path: '/earth-playground',
  meta: { title: 'Luis Krötz | Earth Playground' },
  params: {},
  ...over,
})

let origRoute

afterEach(() => {
  router.currentRoute = origRoute
})

describe('space schema runtime emitter', () => {
  test('guards: wrong view returns before writing the graph', () => {
    origRoute = router.currentRoute

    router.currentRoute = { view: 'view-other', meta: {}, params: {} }

    emitSpaceJsonLd({ translations: {} })

    expect(graphPayload()).toBeNull()
  })

  test('writes route base + WebApplication with localized feature labels', () => {
    origRoute = router.currentRoute

    router.currentRoute = SP_ROUTE({ meta: { canonical: '/earth-playground' } })

    emitSpaceJsonLd({ translations: { camera: 'Câmera', fov: 'Campo de visão' } })

    const app = graphPayload()['@graph'].find((e) => e['@type'] === 'WebApplication')

    expect(app['@id']).toBe('https://luiskr.com/earth-playground#app')
    expect(app.featureList).toContain('Câmera')
    expect(app.featureList).toContain('Campo de visão')
  })

  test('falls back to raw label keys and path URLs', () => {
    origRoute = router.currentRoute

    router.currentRoute = SP_ROUTE({ path: '/br/playground-da-terra', meta: {} })

    emitSpaceJsonLd({ translations: null })

    const payload = graphPayload()
    const app = payload['@graph'].find((e) => e['@type'] === 'WebApplication')

    expect(app.url).toBe('https://luiskr.com/br/playground-da-terra')
    expect(app.featureList).toContain('camera')
    expect(app.featureList).toContain('resetView')
  })

  test('empty route path falls back to the site root URL', () => {
    origRoute = router.currentRoute

    router.currentRoute = SP_ROUTE({ path: '', meta: { title: 'Earth Playground' } })

    emitSpaceJsonLd({ translations: {} })

    const app = graphPayload()['@graph'].find((e) => e['@type'] === 'WebApplication')

    expect(app.url).toBe('https://luiskr.com/')
    expect(app.name).toBe('Earth Playground')
  })

  // generateProjectSchema's early-return arms ride this file's schema.ts
  // instance — the core-suite copies land on a different (unserialized)
  // instance, so the null/empty-slug guards are exercised here instead.
  test('project schema returns an empty graph for missing inputs', () => {
    expect(generateProjectSchema(null, TEST_PROJECTS.CICB)).toEqual([])
    expect(generateProjectSchema({ title: TEST_TEXT.HEADING }, '')).toEqual([])
  })
})
