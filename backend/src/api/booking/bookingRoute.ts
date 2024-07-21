import { Elysia } from 'elysia'
import multer from 'multer'

const upload = multer({ dest: 'uploads/' })

export function setupBookingRoutes(app: Elysia) {
  app.post('api/booking/upload-document', ({ body }) => {
    const formData = body as { id: string }
    console.log(formData.id)
    console.log('Uploading document...')

    return { success: true }
  })
}
