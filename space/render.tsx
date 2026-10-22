/**
 * @file space/render.tsx
 * @description JSX for SpacePlayground's render() — boot loader overlay
 * (hidden after first usable frame), the collapsible control panel with
 * slider/checkbox/action groups plus position/target readouts, and the
 * ambient music player.
 */

import { A11Y_CLASSES } from '@core/tokens/classes/a11y.js'
import { FORM_ATTRS } from '@core/tokens/attrs/form.js'
import { MEDIA_ATTRS } from '@core/tokens/attrs/media.js'
import { ATTR_VALUES } from '@core/tokens/attrs/values.js'
import { SP_CLASSES } from '@core/tokens/classes/playground.js'
import { CMS_KEYS } from '@core/tokens/data/cms-keys.js'
import { LOADER_UI_KEYS, NAV_UI_KEYS } from '@core/tokens/data/ui-keys.js'
import { SP_ACTIONS } from '@core/tokens/playground/actions.js'
import { SP_MUSIC } from '@core/tokens/playground/music.js'
import { h, Fragment } from '@core/jsx.js'
import store from '@core/store.js'
import { appText } from '@core/locale/ui-text.js'
import { SLIDER_GROUPS, SP_DEFAULTS } from './controls.js'
import type { SpacePlayground } from '../SpacePlayground.js'

/** Builds a stable relationship id for a group header and its content. */
const groupContentId = (index: number): string => `${SP_CLASSES.SP_GROUP_CONTENT}-${index}`

/**
 * Renders space playground.
 * @param host — the host component
 */
export function renderSpacePlayground(host: SpacePlayground) {
  const t: Record<string, unknown> = {
    ...SP_DEFAULTS,
    title: appText(CMS_KEYS.EARTH_PLAYGROUND),
    ...(host.translations ?? {}),
  }

  const expLabel = t.experienceSettings
  const positionGroupIndex = SLIDER_GROUPS.length
  const targetGroupIndex = positionGroupIndex + 1

  const earthReady = host._earthReady

  // prefers-reduced-motion is the sanctioned proxy for screen-reader use —
  // the music player renders paused so AT sessions start silent.
  const reducedMotion = Boolean(store.getters.getReducedMotion?.())

  return (
    <Fragment>
      {/* Static CSS starfield when the engine can't boot (no WebGL, init
          failure, forced fallback) — never a dead black canvas. */}
      {host._earthFailed && (
        <div className={SP_CLASSES.SP_FALLBACK} aria-hidden={ATTR_VALUES.TRUE} />
      )}

      {/* Sci-Fi System Boot Loader — only shown during initial load */}
      {!earthReady && (
        <div className={SP_CLASSES.SP_LOADER}>
          <div className={SP_CLASSES.SP_LOADER_GLOW} />
          <div className={SP_CLASSES.SP_LOADER_GRID} />
          <div className={SP_CLASSES.SP_LOADER_CONTENT}>
            <div className={SP_CLASSES.SP_LOADER_SPINNER_OUTER} />
            <div className={SP_CLASSES.SP_LOADER_SPINNER_INNER} />
            <div className={SP_CLASSES.SP_LOADER_COUNTER}>
              <span className={SP_CLASSES.SP_LOADER_PERCENT}>
                <span className={SP_CLASSES.SP_LOADER_VAL}>0</span>
                <span className={SP_CLASSES.SP_LOADER_SYM}>%</span>
              </span>
            </div>
            <div className={SP_CLASSES.SP_LOADER_TITLE}>{t.systemBoot}</div>
            <div className={SP_CLASSES.SP_LOADER_MSG}>
              {appText(LOADER_UI_KEYS.LOADER_INIT_WEBGPU)}
            </div>
            <div className={SP_CLASSES.SP_LOADER_BAR}>
              <div className={SP_CLASSES.SP_LOADER_BAR_FILL} />
            </div>
          </div>
        </div>
      )}

      {/* Controls wrapper aligned with top nav %MAXAREA */}
      <div className={SP_CLASSES.SP_CONTROLS_WRAP}>
        {/* Floating reopen button — styled like click to expand button */}
        <button
          className={SP_CLASSES.SP_REOPEN}
          data-action={SP_ACTIONS.PANEL_OPEN}
          type={FORM_ATTRS.BUTTON}
          style="display:none"
        >
          {expLabel}
        </button>

        <section className={SP_CLASSES.SP_PANEL} aria-label={t.title}>
          <header className={SP_CLASSES.SP_PANEL_HEADER}>
            <h2 className={SP_CLASSES.SP_PANEL_TITLE}>{t.title}</h2>
            <button
              className={SP_CLASSES.SP_PANEL_TOGGLE}
              data-action={SP_ACTIONS.PANEL_TOGGLE}
              type={FORM_ATTRS.BUTTON}
              aria-label={appText(NAV_UI_KEYS.CLOSE)}
            >
              ✕
            </button>
          </header>

          <div className={SP_CLASSES.SP_PANEL_BODY}>
            {SLIDER_GROUPS.map((group, index) => (
              <div
                className={`${SP_CLASSES.SP_GROUP}${group.collapsed ? ` ${SP_CLASSES.SP_GROUP_COLLAPSED}` : ATTR_VALUES.EMPTY}`}
              >
                {/* Disclosure heading — the group label is a real h3 so AT
                    heading-jump lists every settings group; the button inside
                    keeps expand/collapse keyboard semantics. */}
                <h3 className={SP_CLASSES.SP_GROUP_HEADING}>
                  <button
                    className={SP_CLASSES.SP_GROUP_HEADER}
                    type={FORM_ATTRS.BUTTON}
                    aria-expanded={group.collapsed ? ATTR_VALUES.FALSE : ATTR_VALUES.TRUE}
                    aria-controls={groupContentId(index)}
                  >
                    <span className={SP_CLASSES.SP_GROUP_CHEVRON} aria-hidden={ATTR_VALUES.TRUE}>
                      ▶
                    </span>
                    <span className={SP_CLASSES.SP_GROUP_LABEL}>
                      {t[group.label] || group.label}
                    </span>
                  </button>
                </h3>

                <div
                  className={SP_CLASSES.SP_GROUP_CONTENT}
                  id={groupContentId(index)}
                  inert={group.collapsed}
                >
                  {group.controls.map((ctrl) => host._renderControl(ctrl, t))}

                  {group.actions?.map((act) => host._renderAction(act, t))}
                </div>
              </div>
            ))}

            {/* Position / Target readouts */}
            <div className={SP_CLASSES.SP_GROUP}>
              <h3 className={SP_CLASSES.SP_GROUP_HEADING}>
                <button
                  className={SP_CLASSES.SP_GROUP_HEADER}
                  type={FORM_ATTRS.BUTTON}
                  aria-expanded={ATTR_VALUES.TRUE}
                  aria-controls={groupContentId(positionGroupIndex)}
                >
                  <span className={SP_CLASSES.SP_GROUP_CHEVRON} aria-hidden={ATTR_VALUES.TRUE}>
                    ▶
                  </span>
                  <span className={SP_CLASSES.SP_GROUP_LABEL}>{t.position}</span>
                </button>
              </h3>
              <div className={SP_CLASSES.SP_GROUP_CONTENT} id={groupContentId(positionGroupIndex)}>
                <div className={`${SP_CLASSES.SP_READOUT} ${SP_CLASSES.SP_POS}`}>
                  X: 0 Y: 0 Z: 0
                </div>
              </div>
            </div>

            <div className={SP_CLASSES.SP_GROUP}>
              <h3 className={SP_CLASSES.SP_GROUP_HEADING}>
                <button
                  className={SP_CLASSES.SP_GROUP_HEADER}
                  type={FORM_ATTRS.BUTTON}
                  aria-expanded={ATTR_VALUES.TRUE}
                  aria-controls={groupContentId(targetGroupIndex)}
                >
                  <span className={SP_CLASSES.SP_GROUP_CHEVRON} aria-hidden={ATTR_VALUES.TRUE}>
                    ▶
                  </span>
                  <span className={SP_CLASSES.SP_GROUP_LABEL}>{t.target}</span>
                </button>
              </h3>
              <div className={SP_CLASSES.SP_GROUP_CONTENT} id={groupContentId(targetGroupIndex)}>
                <div className={`${SP_CLASSES.SP_READOUT} ${SP_CLASSES.SP_TGT}`}>
                  X: 0 Y: 0 Z: 0
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Native audio player aligned with nav — autoplay is suppressed
          under prefers-reduced-motion (the sanctioned screen-reader proxy):
          the player renders paused so AT users start silent; anyone can
          still press play. */}
      <div className={SP_CLASSES.SP_MUSIC}>
        <span className={A11Y_CLASSES.SR_ONLY} id={`${SP_CLASSES.SP_MUSIC}-desc`}>
          {t.musicDesc}
        </span>
        <audio
          className={SP_CLASSES.SP_AUDIO}
          controls
          controlsList={MEDIA_ATTRS.NO_DOWNLOAD}
          disablePictureInPicture
          autoplay={!reducedMotion ? true : undefined}
          loop
          preload={ATTR_VALUES.AUTO}
          aria-label={t.music}
          aria-describedby={`${SP_CLASSES.SP_MUSIC}-desc`}
        >
          <source src={SP_MUSIC.OGG} type={MEDIA_ATTRS.AUDIO_OGG} />
          <source src={SP_MUSIC.MP3} type={MEDIA_ATTRS.AUDIO_MPEG} />
        </audio>
      </div>
    </Fragment>
  )
}
