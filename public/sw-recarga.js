// Se carga dentro del service worker (vite.config.ts, workbox.importScripts).
// Cuando se activa una versión nueva de la app, las páginas que seguían abiertas con la versión anterior se
// recargan. Si no, podrían pedir un archivo de código que la versión nueva ya borró de la copia sin conexión
// ("Failed to fetch dynamically imported module"). En la primera visita no hay páginas que recargar.
// La recarga no va dentro de event.waitUntil: su pedido espera a que termine la activación, y se trabarían.
self.addEventListener('activate', () => {
  self.clients
    .matchAll({ type: 'window' })
    .then((clients) => {
      for (const client of clients) if ('navigate' in client) client.navigate(client.url).catch(() => undefined)
    })
    .catch(() => undefined)
})
