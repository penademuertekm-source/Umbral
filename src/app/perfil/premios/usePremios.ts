import { useEffect, useState } from 'react'

// Premios de ejemplo (S3): public/datos/simulados/premios.json, con "simulado": true (CLAUDE.md, regla 1).
// El archivo trae solo números, niveles y códigos; los textos están en i18n (premios.ejemplo.<id>).

export interface SampleRewards {
  simulado: true
  meta_comunidad: { id: 'arbol'; meta_horas: number; total_ejemplo_min: number }
  beneficios: { id: 'jugo' | 'recorrido'; nivel_minimo: number; codigo: string }[]
}

let cache: Promise<SampleRewards | null> | null = null

function load(): Promise<SampleRewards | null> {
  cache ??= fetch(`${import.meta.env.BASE_URL}datos/simulados/premios.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data: SampleRewards | null) => (data?.simulado === true ? data : null))
    .catch(() => null)
  return cache
}

/** undefined mientras carga; null si no se pudo leer el archivo. */
export function usePremios(): SampleRewards | null | undefined {
  const [data, setData] = useState<SampleRewards | null | undefined>(undefined)
  useEffect(() => {
    let vigente = true
    load().then((d) => vigente && setData(d))
    return () => {
      vigente = false
    }
  }, [])
  return data
}

/** Total de la meta de la comunidad: un total de ejemplo fijo más lo que aportó esta persona (minutos). */
export function communityMinutes(data: SampleRewards, ownMinutes: number): number {
  return data.meta_comunidad.total_ejemplo_min + Math.round(ownMinutes)
}
