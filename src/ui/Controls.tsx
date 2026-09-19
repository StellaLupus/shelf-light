import { RECESSED25, type SceneInput } from '../geometry'
import { EYE_PRESETS, applyEyePreset } from '../state/params.ts'
import { NumberField } from './NumberField.tsx'

type ControlsProps = {
  params: SceneInput
  onChange: (params: SceneInput) => void
}

export function Controls({ params, onChange }: ControlsProps) {
  return (
    <form className="controls" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend>Монтаж ленты</legend>
        <label className="choice">
          <input
            type="radio"
            name="mount"
            value="downward"
            checked={params.led.mount === 'downward'}
            onChange={() =>
              onChange({ ...params, led: { ...params.led, mount: 'downward' } })
            }
          />
          Вниз
        </label>
        <label className="choice">
          <input
            type="radio"
            name="mount"
            value="radius"
            checked={params.led.mount === 'radius'}
            onChange={() =>
              onChange({ ...params, led: { ...params.led, mount: 'radius' } })
            }
          />
          Радиусный
        </label>
        <label className="choice">
          <input
            type="radio"
            name="mount"
            value="ell"
            checked={params.led.mount === 'ell'}
            onChange={() =>
              onChange({ ...params, led: { ...params.led, mount: 'ell' } })
            }
          />
          Г-образный
        </label>
        <label className="choice">
          <input
            type="radio"
            name="mount"
            value="triangle"
            checked={params.led.mount === 'triangle'}
            onChange={() =>
              onChange({ ...params, led: { ...params.led, mount: 'triangle' } })
            }
          />
          Треугольный
        </label>
        <label className="choice">
          <input
            type="radio"
            name="mount"
            value="recessed25"
            checked={params.led.mount === 'recessed25'}
            onChange={() =>
              onChange({ ...params, led: { ...params.led, mount: 'recessed25' } })
            }
          />
          Врезной 25°
        </label>
      </fieldset>
      {params.led.mount === 'recessed25' ? (
        <fieldset data-testid="led-facing">
          <legend>Разворот окна</legend>
          <label className="choice">
            <input
              type="radio"
              name="facing"
              value="wall"
              checked={params.led.facing === 'wall'}
              onChange={() =>
                onChange({ ...params, led: { ...params.led, facing: 'wall' } })
              }
            />
            К стене
          </label>
          <label className="choice">
            <input
              type="radio"
              name="facing"
              value="room"
              checked={params.led.facing === 'room'}
              onChange={() =>
                onChange({ ...params, led: { ...params.led, facing: 'room' } })
              }
            />
            В комнату
          </label>
        </fieldset>
      ) : null}

      <NumberField
        id="upper-depth"
        label="Глубина верхней полки"
        value={params.upper.depth}
        min={40}
        max={600}
        step={1}
        unit="мм"
        onChange={(depth) =>
          onChange({ ...params, upper: { ...params.upper, depth } })
        }
      />
      <NumberField
        id="upper-thickness"
        label="Толщина верхней полки"
        value={params.upper.thickness}
        min={params.led.mount === 'recessed25' ? RECESSED25.grooveDepth : 8}
        max={50}
        step={1}
        unit="мм"
        onChange={(thickness) =>
          onChange({ ...params, upper: { ...params.upper, thickness } })
        }
      />
      <NumberField
        id="lower-depth"
        label="Глубина нижней полки"
        value={params.lower.depth}
        min={0}
        max={700}
        step={1}
        unit="мм"
        onChange={(depth) =>
          onChange({ ...params, lower: { ...params.lower, depth } })
        }
      />
      <NumberField
        id="lower-thickness"
        label="Толщина нижней полки"
        value={params.lower.thickness}
        min={8}
        max={50}
        step={1}
        unit="мм"
        onChange={(thickness) =>
          onChange({ ...params, lower: { ...params.lower, thickness } })
        }
      />
      <NumberField
        id="lower-from-floor"
        label="Высота нижней полки от пола"
        value={params.lower.heightFromFloor}
        min={50}
        max={2500}
        step={1}
        unit="мм"
        onChange={(heightFromFloor) =>
          onChange({
            ...params,
            lower: { ...params.lower, heightFromFloor },
          })
        }
      />
      <NumberField
        id="gap"
        label="Зазор между полками"
        value={params.gap}
        min={0}
        max={800}
        step={1}
        unit="мм"
        onChange={(gap) => onChange({ ...params, gap })}
      />
      <NumberField
        id="blend-height"
        label="Высота бленды"
        value={params.blend.height}
        min={0}
        max={250}
        step={1}
        unit="мм"
        onChange={(height) =>
          onChange({ ...params, blend: { ...params.blend, height } })
        }
      />
      <NumberField
        id="blend-thickness"
        label="Толщина бленды"
        value={params.blend.thickness}
        min={0}
        max={40}
        step={1}
        unit="мм"
        onChange={(thickness) =>
          onChange({ ...params, blend: { ...params.blend, thickness } })
        }
      />
      {params.led.mount !== 'recessed25' ? (
        <NumberField
          id="led-width"
          label="Ширина ленты"
          value={params.led.width}
          min={0}
          max={40}
          step={1}
          unit="мм"
          onChange={(width) =>
            onChange({ ...params, led: { ...params.led, width } })
          }
        />
      ) : null}
      {params.led.mount === 'downward' || params.led.mount === 'recessed25' ? (
        <NumberField
          id="led-offset"
          label="Смещение ленты от стены"
          value={params.led.offsetFromWall}
          min={0}
          max={500}
          step={1}
          unit="мм"
          onChange={(offsetFromWall) =>
            onChange({ ...params, led: { ...params.led, offsetFromWall } })
          }
        />
      ) : null}
      {params.led.mount !== 'recessed25' ? (
        <NumberField
          id="led-drop"
          label="Свес профиля"
          value={params.led.profileDrop}
          min={0}
          max={30}
          step={1}
          unit="мм"
          onChange={(profileDrop) =>
            onChange({ ...params, led: { ...params.led, profileDrop } })
          }
        />
      ) : null}
      <NumberField
        id="viewer-distance"
        label="Расстояние до глаз"
        value={params.viewer.distance}
        min={50}
        max={2000}
        step={1}
        unit="мм"
        onChange={(distance) =>
          onChange({ ...params, viewer: { ...params.viewer, distance } })
        }
      />
      <NumberField
        id="viewer-height"
        label="Высота глаз"
        value={params.viewer.eyeHeight}
        min={-800}
        max={1600}
        step={1}
        unit="мм"
        onChange={(eyeHeight) =>
          onChange({ ...params, viewer: { ...params.viewer, eyeHeight } })
        }
      />
      <p className="hint">
        От пола: {params.lower.heightFromFloor + params.viewer.eyeHeight} мм
      </p>
      <div className="presets" data-testid="eye-presets">
        <button
          type="button"
          onClick={() => onChange(applyEyePreset(params, EYE_PRESETS.standing))}
        >
          Стоя
        </button>
        <button
          type="button"
          onClick={() => onChange(applyEyePreset(params, EYE_PRESETS.sitting))}
        >
          Сидя
        </button>
        <button
          type="button"
          onClick={() => onChange(applyEyePreset(params, EYE_PRESETS.lying))}
        >
          Лёжа
        </button>
      </div>
    </form>
  )
}
