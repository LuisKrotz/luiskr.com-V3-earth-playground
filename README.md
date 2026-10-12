# luiskr.com V3 — experiments/earth-playground

The **Earth Playground** — `<view-space-playground>` — a photorealistic Three.js
WebGPU Earth rendered fullscreen behind a live control panel. Reachable at
`/earth-playground` (localized), it's the site's flagship visual experiment:
a real-time planet with physically-motivated atmosphere scattering, day/night
terminator, city lights, a 3-level-LOD moon, eclipse dimming, and a full
post-processing chain — every parameter tweakable live through sliders,
checkboxes, and actions.

## How it works

`SpacePlayground.tsx` mounts a persistent canvas and hands it to
`EarthBackground` (`earth-background.ts`), the engine facade. The engine lazily
imports Three.js (the chunk only ships when the route mounts), probes for a
WebGPU adapter — falling back to WebGL on a cloned canvas — builds the scene,
loads the texture set, assembles the TSL post pipeline, then starts the frame
loop. Controls are a method API (`update*` setters) — no lil-gui — fed by a
declarative panel schema.

## Source map

### The view + engine facade

| File                  | What it does                                                                                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SpacePlayground.tsx` | `<view-space-playground>` — the route: canvas + control panel (sliders, checkboxes, actions, position readout, music). Settings persist to localStorage; loader stays until first usable frame. |
| `earth-background.ts` | `EarthBackground` facade — owns the `EarthState` bag, exposes `init()` + the `update*` API the panel drives.                                                                                    |
| `dev.ts`              | Standalone dev entry — mounts the view directly.                                                                                                                                                |
| `index.ts`            | Barrel.                                                                                                                                                                                         |
| `vite.config.js`      | Library build — emits `earth-playground/dist/earth-playground.js`.                                                                                                                              |

### `earth/setup/` — boot

| File                      | What it does                                                                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup/bootstrap.ts`      | Async scene assembly — lazy three import, WebGPU probe, renderer/scene/camera/controls, texture loading with progress, post pipeline, warmup. Every `await` checks `s.disposed`. |
| `setup/renderer-setup.ts` | Renderer creation — `navigator.gpu` adapter probe (a null adapter means software/headless), WebGPURenderer covering both APIs, poisoned-canvas clone + WebGL retry.              |
| `setup/scene-setup.ts`    | Scene rig — camera + OrbitControls, sun directional + sprite, equirect starfield background, moon LOD.                                                                           |
| `setup/post-setup.ts`     | Post chain — color grade, chromatic aberration, vignette, film grain + RenderPipeline assembly; failure is non-fatal (frame loop falls back).                                    |

### `earth/scene/` — the planet

| File                        | What it does                                                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scene/meshes.ts`           | Mesh builders — the 4-shell Earth group and the 3-LOD moon; orchestrates textures, geometry, groups.                                                              |
| `scene/surface-material.ts` | Surface node graph — cloud-shadow projection, day/night + twilight tint, ocean specular, normal-map terrain shading, moon-eclipse dimming, night-lights emissive. |
| `scene/atmos-shells.ts`     | Atmosphere shells — BackSide additive scattering (Rayleigh + Mie + airglow limb bands from inside) + FrontSide fresnel rim.                                       |
| `scene/post-nodes.ts`       | Custom TSL post nodes — pure node-graph builders.                                                                                                                 |
| `earth/consts.ts`           | Scene-graph scale constants + shared TSL arg types.                                                                                                               |

### `earth/runtime/` — per-frame behavior

| File                    | What it does                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `runtime/state.ts`      | `createEarthState` — the mutable engine-state bag threaded through every stage.                                                          |
| `runtime/frame.ts`      | The self-rescheduling RAF tick — sun orbit, moon orbit, earth/cloud spin, controls damping, pipeline-or-plain render; host-aware resize. |
| `runtime/updates.ts`    | Live-tweak API — every `update*` writes the settings bag + backing uniform; toggles collapse shader terms to 0 (no graph rebuild).       |
| `runtime/screenshot.ts` | PNG capture — 2× pixel-ratio frame → toDataURL/toBlob download.                                                                          |
| `earth/settings.ts`     | Settings snapshot → `DEFAULT_SP_GUI`-shaped tree the panel renders.                                                                      |

### `space/` — the control surface

| File                      | What it does                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `space/boot.ts`           | Engine bootstrap — canvas → engine with ready/progress callbacks mirrored into the loader; persisted settings applied. |
| `space/controls.ts`       | The declarative `SLIDER_GROUPS` schema + `SP_PARAMS` → `update*` adapter map + versioned localStorage.                 |
| `space/i18n.ts`           | Locale handling — fetches the earth-playground node, merges CMS-published `defaults` over shipped config.              |
| `space/wiring.ts`         | Panel event binding — `data-param` dispatch, action buttons, readout loop, CheckboxWebGL mounts.                       |
| `space/checkbox-webgl.ts` | The panel's checkbox widget — Canvas 2D accent ticks + scan-glow pulse.                                                |
| `space/panel-render.tsx`  | Row/group JSX renderers.                                                                                               |
| `space/render.tsx`        | View JSX — loader overlay, collapsible panel, music player.                                                            |

## Commands

```bash
yarn dev      # mounts <view-space-playground> directly
yarn test     # jest suite for earth-playground
yarn build    # emits experiments/earth-playground/dist/earth-playground.js
```

---

Submodule of [luiskr.com-V3](https://github.com/LuisKrotz/luiskr.com-V3). Install
deps from the superproject (`yarn install` at the root), then run `yarn dev` /
`yarn test` / `yarn build` in this folder — see `package.json` scripts.

License: [MPL-2.0](https://github.com/LuisKrotz/luiskr.com-V3/blob/development/LICENSE)
