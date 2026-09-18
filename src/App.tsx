import { useEffect, useState } from 'react'
import {
  evaluateScene,
  type SceneInput,
  type SceneResult,
} from './geometry'
import {
  applyViewer,
  DEFAULT_PARAMS,
  parseState,
  serializeState,
  type ViewMode,
} from './state/params.ts'
import { Controls } from './ui/Controls.tsx'
import { glareStatusText } from './ui/status.ts'
import { SectionView } from './viz/SectionView.tsx'

type OkResult = Extract<SceneResult, { ok: true }>

type AppState = {
  params: SceneInput
  view: ViewMode
  result: SceneResult
  shown: OkResult
}

const defaultResult = evaluateScene(DEFAULT_PARAMS)
if (!defaultResult.ok) throw new Error('Default scene must be valid')
const fallback: OkResult = defaultResult

function stateFromSearch(
  search: string,
  previousShown: OkResult = fallback,
): AppState {
  const { params: parsed, view } = parseState(search)
  const params = applyViewer(parsed)
  const result = evaluateScene(params)
  if (result.ok) return { params, view, result, shown: result }
  return { params, view, result, shown: previousShown }
}

function bootState(): AppState {
  return stateFromSearch(window.location.search)
}

export default function App() {
  const [{ params, view, result, shown }, setState] = useState(bootState)

  const updateParams = (next: SceneInput): void => {
    const placed = applyViewer(next)
    const nextResult = evaluateScene(placed)
    setState((prev) => {
      if (nextResult.ok) {
        return { ...prev, params: placed, result: nextResult, shown: nextResult }
      }
      return { ...prev, params: next, result: nextResult }
    })
  }

  useEffect(() => {
    const next = `?${serializeState(params, view).toString()}`
    if (window.location.search !== next) {
      window.history.replaceState(null, '', next)
    }
  }, [params, view])

  useEffect(() => {
    const onPopState = (): void => {
      setState((prev) => stateFromSearch(window.location.search, prev.shown))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <main className="page">
      <header className="header">
        <h1>Полки и подсветка орхидей</h1>
        <p className="lead">
          Разрез двух полок: лента на верхней светит на нижнюю. Режим «Лучи» —
          путь к глазу, «Заливка» — зона прямого света.
        </p>
      </header>
      <div className="layout">
        <section className="stage">
          <div className="view-toggle" data-testid="view-toggle">
            <button
              type="button"
              data-view="glare"
              aria-pressed={view === 'glare'}
              onClick={() => setState((prev) => ({ ...prev, view: 'glare' }))}
            >
              Лучи
            </button>
            <button
              type="button"
              data-view="lit"
              aria-pressed={view === 'lit'}
              onClick={() => setState((prev) => ({ ...prev, view: 'lit' }))}
            >
              Заливка
            </button>
          </div>
          <SectionView
            scene={shown.scene}
            evaluation={shown.evaluation}
            view={view}
            onEyeMove={(point) =>
              updateParams({
                ...params,
                viewer: {
                  distance: Math.round(point.x),
                  eyeHeight: Math.round(point.y),
                },
              })
            }
          />
          <p
            className={
              shown.evaluation.hasDirectGlare
                ? 'status status-alert'
                : 'status status-ok'
            }
            data-testid="glare-status"
          >
            {glareStatusText(shown.evaluation.hasDirectGlare)}
          </p>
          {!result.ok ? (
            <ul className="errors" data-testid="validation">
              {result.errors.map((error) => (
                <li key={error.code}>{error.message}</li>
              ))}
            </ul>
          ) : null}
        </section>
        <Controls params={params} onChange={updateParams} />
      </div>
    </main>
  )
}
