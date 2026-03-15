import { useState, useCallback, useEffect } from 'react'
import type { YieldData, PolicyData, CurveInterpretation } from '../types'
import { interpretCurveShape } from '../services/aiService'
import { loadData } from '../services/dataLoader'

export function useCurveInterpreter() {
  const [interpretation, setInterpretation] = useState<CurveInterpretation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load pre-generated interpretation on mount
  useEffect(() => {
    loadData<CurveInterpretation>('curve_interpretation.json')
      .then(data => {
        if (data?.interpretation) setInterpretation(data)
      })
      .catch(() => { /* no pre-generated data available */ })
  }, [])

  const interpret = useCallback(async (
    yieldData: YieldData,
    policyData?: PolicyData | null,
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await interpretCurveShape(yieldData, policyData)
      setInterpretation(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to interpret curve')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setInterpretation(null)
    setError(null)
  }, [])

  return { interpretation, isLoading, error, interpret, clear }
}
