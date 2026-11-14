/**
 * @file earth/bootstrap.ts
 * @description Async scene assembly for the Earth engine, extracted from
 * earth-background.ts. Loads three.js lazily (the playground chunk only
 * ships when the route mounts), probes for a WebGPU adapter, builds
 * renderer/scene/camera/controls, loads textures with progress callbacks,
 * assembles the TSL post pipeline, warms shaders, then starts the loop.
 * Stages live in renderer-setup.ts, scene-setup.ts and post-setup.ts.
 *
 * Every `await` is followed by a disposed check — destroy() during a
 * slow texture load must not continue mutating a torn-down scene.
 */
import { DATA_ATTRS } from '@core/tokens/attrs/data.js'
import { ATTR_VALUES } from '@core/tokens/attrs/values.js'
import { DEFAULT_SP_GUI } from '@core/tokens/playground.js'
import { PRINT_EVENTS, WINDOW_EVENTS } from '@core/tokens/events/dom.js'
import { NET_STRINGS } from '@core/tokens/strings/net.js'
import { initEarthRenderer } from './renderer-setup.js'
import {
  setupEarthGroup,
  setupMoon,
  setupSceneCamera,
  setupStarfield,
  setupSun,
} from './scene-setup.js'
import { buildEarthPostPipeline, seedPostState } from './post-setup.js'
import { handleEarthResize, tickEarth } from '../runtime/frame.js'
import type { EarthState } from '../runtime/state.js'
import { devWarn } from '@core/devlog.js'

/**
 * Pre-compiles the scene's shader programs so the first visible frame doesn't
 * hitch on JIT. compileAsync failures (driver hiccups, lost device) are
 * non-fatal — the renderer recompiles lazily on first draw.
 */
export async function warmUpShaders(
  renderer: NonNullable<EarthState['renderer']>,
  s: EarthState
): Promise<void> {
  const { scene, camera } = s

  try {
    if (scene && camera) await renderer.compileAsync(scene, camera)
  } catch (err) {
    devWarn('[EarthBG] Shader compile warmup notice:', err)
  }
}

/**
 * bootstraps earth.
 * @param s — the source value
 * @returns Promise<void>
 */
export const bootstrapEarth = async (s: EarthState): Promise<void> => {
  const THREE = await import('three')
  const { WebGPURenderer, MeshPhysicalNodeMaterial, MeshBasicNodeMaterial } =
    await import('three/webgpu')
  const TSL = await import('three/tsl')
  const { bloom } = await import('three/examples/jsm/tsl/display/BloomNode.js')
  const { chromaticAberration } =
    await import('three/examples/jsm/tsl/display/ChromaticAberrationNode.js')
  const { film } = await import('three/examples/jsm/tsl/display/FilmNode.js')
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
  const { RenderPipeline } = await import('three/webgpu')

  if (s.disposed) return

  /* Renderer */
  if (!(await initEarthRenderer(s, WebGPURenderer)) || !s.renderer) return

  const renderer = s.renderer

  // ACES filmic keeps the sun disc + city lights from clipping to flat
  // white; exposure 1 leaves headroom for bloom to do the brightening.
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = false

  /* Scene / Camera / Controls */
  setupSceneCamera(s, THREE, OrbitControls)

  s.onProgress?.('Initializing WebGPU renderer…', 5)

  /* Sun */
  setupSun(s, THREE, TSL)

  /* Starfield */
  if (!(await setupStarfield(s, THREE))) return

  /* Moon */
  if (!(await setupMoon(s, THREE))) return

  /* Earth */
  if (
    !(await setupEarthGroup(s, {
      THREE,
      TSL,
      mats: { MeshPhysicalNodeMaterial, MeshBasicNodeMaterial },
    }))
  )
    return

  /* Post: color grade, CA, vignette, film grain */
  seedPostState(s, TSL)

  /* Render pipeline */
  s.onProgress?.('Building post-processing pipeline…', 70)

  buildEarthPostPipeline(s, { TSL, RenderPipeline, bloom, chromaticAberration, film })

  s.render.resolutionScale = DEFAULT_SP_GUI.DEBUG.RESOLUTION_SCALE

  /* Resize + start */
  handleEarthResize(s)

  s.onResize = () => handleEarthResize(s)

  window.addEventListener(WINDOW_EVENTS.RESIZE, s.onResize, { passive: true })

  // The canvas stamps `data-print-capture`, which makes the print
  // adapter's toDataURL read driver-owned: it dispatches `printcapture`
  // and waits for detail.dataUrl instead of touching the buffer. Answer
  // by repainting one frame through the same pipeline the tick uses —
  // post FX included — then serializing. A WebGPU canvas presents at
  // frame end, so the read lands on the frame this paint (or the last
  // presented one) left standing; a dead renderer simply skips the
  // repaint and the still reads whatever the buffer last held.
  s.onPrintCapture = (e: Event) => {
    if (s.disposed || !s.canvas) return

    try {
      if (s.renderer && s.scene && s.camera) {
        if (s.pipeline) {
          try {
            s.pipeline.render()
          } catch {
            s.renderer.render(s.scene, s.camera)
          }
        } else {
          s.renderer.render(s.scene, s.camera)
        }
      }

      ;(e as CustomEvent<{ dataUrl?: string }>).detail.dataUrl = s.canvas.toDataURL(
        NET_STRINGS.IMAGE_PNG
      )
    } catch (err) {
      devWarn('[EarthBG] print capture failed:', err)
    }
  }

  s.canvas?.addEventListener(PRINT_EVENTS.CAPTURE, s.onPrintCapture)

  s.onProgress?.('Compiling shaders…', 90)

  await warmUpShaders(renderer, s)

  if (s.disposed) return

  // The capture markers arm only now — the warmup just proved the buffer
  // paints real frames. A canvas printed mid-boot carries no marker, so
  // the adapter's aria-hidden guard simply skips it: a boot that can't
  // paint never strands a blank plate on paper.
  s.canvas?.setAttribute(DATA_ATTRS.PRINT_CAPTURE, ATTR_VALUES.EMPTY)
  s.canvas?.setAttribute(DATA_ATTRS.PRINT_LANDSCAPE, ATTR_VALUES.EMPTY)

  if (!s.reduced) tickEarth(s)

  s.onProgress?.('Ready', 100)

  // onReady is fired by EarthBackground.init() — single fire point so the
  // early-return bailouts above can't leave the loader overlay stuck.
}
