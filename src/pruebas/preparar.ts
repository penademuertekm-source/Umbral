// Se ejecuta antes de cada archivo de prueba (vite.config.ts → test.setupFiles).
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
