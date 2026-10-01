// Posición del sol con SunCalc (la misma librería que usará la app) para validarla contra pvlib.
// Uso: node scripts/posicion_sol.mjs <lat> <lon> <año>
// Salida: JSON con el día 15 de cada mes, cada hora de 6:00 a 18:00 (hora de Bogotá, UTC−5).
// SunCalc 2.x da el azimut en grados (0° = norte, sentido horario) y la elevación aparente
// (con refracción), en grados.
import { getPosition } from 'suncalc'

const [lat, lon, anio] = process.argv.slice(2).map(Number)
const resultados = []
for (let mes = 0; mes < 12; mes++) {
  for (let hora = 6; hora <= 18; hora++) {
    const fecha = new Date(Date.UTC(anio, mes, 15, hora + 5, 0, 0))
    const { azimuth, altitude } = getPosition(fecha, lat, lon)
    resultados.push({ utc: fecha.toISOString(), azimut: azimuth, elevacion: altitude })
  }
}
console.log(JSON.stringify(resultados))
