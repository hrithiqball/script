import { Elysia } from 'elysia'
import { setupBookingRoutes } from './booking/bookingRoute'

export function setupRoutes(app: Elysia) {
  app.get('/api/health', () => {
    return { status: 'ok' }
  })

  setupBookingRoutes(app)
}
