import { useEffect, useState } from 'react'
import {
  evaluateScene,
  type SceneInput,
  type SceneResult,
} from './geometry'
import { DEFAULT_PARAMS, parseParams, serializeParams } from './state/params.ts'
import { Controls } from './ui/Controls.tsx'
import { glareStatusText } from './ui/status.ts'
import { SectionView } from './viz/SectionView.tsx'

type OkResult = Extract<SceneResult, { ok: true }>

type AppState = {
  params: SceneInput
  result: SceneResult
  shown: OkResult
}

const defaultResult = evaluateScene(DEFAULT_PARAMS)
if (!defaultResult.ok) throw new Error('Default scene must be valid')
const fallback: OkResult = defaultResult

function bootState(): AppState {
  const params = parseParams(window.location.search)
  const result = evaluateScene(params)
  if (result.ok) return { params, result, shown: result }
  return { params, result, shown: fallback }
}

export default function App() {
  const [{ params, result, shown }, setState] = useState(bootState)

  const updateParams = (next: SceneInput): void => {
    const nextResult = evaluateScene(next)
    setState((prev) => {
      if (nextResult.ok) {
        return { params: next, result: nextResult, shown: nextResult }
      }
      return { params: next, result: nextResult, shown: prev.shown }
    })
  }

  useEffect(() => {
    const next = `?${serializeParams(params).toString()}`
    if (window.location.search !== next) {
      window.history.replaceState(null, '', next)
    }
  }, [params])

  useEffect(() => {
    const onPopState = (): void => {
      updateParams(parseParams(window.location.search))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <main className="page">
      <header className="header">
        <h1>Полки и подсветка орхидей</h1>
        <p className="lead">
          Разрез двух полок: лента на верхней светит на нижнюю. Красный луч —
          прямой путь к глазу, зелёный — перекрыт блендой или полкой.
        </p>
      </header>
      <div className="layout">
        <section className="stage">
          <SectionView scene={shown.scene} evaluation={shown.evaluation} />
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
