/**
 * @file schema-route-arms-tails.test.js
 * @description Coverage tails for space/schema.ts emitSpaceJsonLd —
 * the null-route early return, the bcp/keywords/screenshot/gallery
 * conditional arms, and label fallbacks.
 */
import { describe, test, expect, jest, afterEach } from '@jest/globals'
import { emitSpaceJsonLd } from '@earth/space/schema.js'
import { syncEarthShare, resetShareGallery } from '@core/utils/share-gallery.js'
import { SEARCH_THEMES_KEY } from '@core/tokens/data/search-themes.js'
import { VIEW_TAGS } from '@core/tokens/elements/views.js'
import { TEST_TEXT } from '@tests/fixtures/test-constants.js'
import router from '@core/router/router.js'
import store from '@core/store.js'

/** Route-record factory matching the router's shape; per-test overrides merge in. */
const SP_ROUTE = (over = {}) => ({
  view: VIEW_TAGS.VIEW_SPACE_PLAYGROUND,
  path: '/earth-playground',
  meta: { title: TEST_TEXT.HEADING },
  ...over,
})

/** Reads the last injected JSON-LD script tag — null when absent. */
const graphPayload = () => {
  const scripts = [...document.head.querySelectorAll('script[type="application/ld+json"]')]

  return scripts.length ? JSON.parse(scripts.at(-1).textContent) : null
}

describe('space schema remaining arms', () => {
  let origRoute

  afterEach(() => {
    router.currentRoute = origRoute
    jest.restoreAllMocks()
  })

  test('null route returns before any graph work', () => {
    origRoute = router.currentRoute
    router.currentRoute = null

    emitSpaceJsonLd({ translations: {} })

    expect(graphPayload()).toBeNull()
  })

  test('keywords + gallery arms: themes array, shareGallery label, empty lang', async () => {
    origRoute = router.currentRoute
    router.currentRoute = SP_ROUTE({ meta: {} })

    const langSpy = jest.spyOn(store.getters, 'getLang').mockReturnValue('')

    emitSpaceJsonLd({
      translations: {
        searchThemes: ['a', 'b'],
        shareGallery: 'Galeria',
        description: TEST_TEXT.SECOND,
      },
    })

    expect(JSON.stringify(graphPayload())).toContain('a, b')

    // Non-array searchThemes → the Array.isArray falsy arm.
    emitSpaceJsonLd({ translations: { searchThemes: 'x' } })

    // Populate the share cache so currentShareImage() and shareUrls.length take their truthy arms.
    const origFetch = globalThis.fetch

    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ images: ['https://luiskr.com/share1.png'] }),
      })
    )
    await syncEarthShare(router.currentRoute, 'https://luiskr.com/earth-playground', () => [])
    globalThis.fetch = origFetch

    emitSpaceJsonLd({ translations: { shareGallery: 'Galeria' } })
    emitSpaceJsonLd({ translations: {} })
    resetShareGallery()

    // Group/control/action keys present → labels[key] truthy arm.
    emitSpaceJsonLd({
      translations: {
        engine: 'E',
        terrain: 'T',
        postFx: 'P',
        camera: 'C',
        earth: 'EA',
        color: 'CO',
        displayDebug: 'D',
        waterMetalness: 'WM',
        bumpScale: 'B',
        selfShadow: 'SS',
        selfShadowOff: 'SO',
        bloom: 'BL',
        bloomStr: 'BS',
        bloomRadius: 'BR',
        bloomThreshold: 'BT',
        vignette: 'V',
        vigDarkness: 'VD',
        vigOffset: 'VO',
        chromaticAb: 'CA',
        caStrength: 'CS',
        filmGrain: 'FG',
        fov: 'F',
        autoRotate: 'AR',
        rotateSpeed: 'RS',
        resetView: 'RV',
        spinSpeed: 'SP',
        sunAutoRotate: 'SA',
        contrast: 'CT',
        saturation: 'ST',
        blackLevel: 'BK',
        resScale: 'RE',
        copyConstants: 'CC',
        screenshot: 'SC',
      },
    })

    langSpy.mockRestore()
    void SEARCH_THEMES_KEY
  })
})
