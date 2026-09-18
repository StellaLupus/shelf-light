import type { SceneInput } from '../geometry'
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
            value="corner"
            checked={params.led.mount === 'corner'}
            onChange={() =>
              onChange({ ...params, led: { ...params.led, mount: 'corner' } })
            }
          />
          Угловой
        </label>
      </fieldset>

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
        min={8}
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
      <NumberField
        id="led-angle"
        label="Угол излучения (угловой)"
        value={params.led.emitAngle}
        min={15}
        max={75}
        step={1}
        unit="°"
        onChange={(emitAngle) =>
          onChange({ ...params, led: { ...params.led, emitAngle } })
        }
      />
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
        min={-400}
        max={1600}
        step={1}
        unit="мм"
        onChange={(eyeHeight) =>
          onChange({ ...params, viewer: { ...params.viewer, eyeHeight } })
        }
      />
    </form>
  )
}
