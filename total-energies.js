const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const uuidv4 = require('uuid/v4')
const moment = require('moment-timezone')

const updatingTiming = true // flag to update timing or upload document. false first then true
const dir = 'pdf' // directory name in commands/data/{directory name}
const approveOnlySingleBooking = true // flag to approve only single booking
const billToUuid = '254dcef3-b67d-4230-82c1-3683a5d7387a' // Total Energies bill to uuid
const gatewayUrl = 'https://gateway-api.shipx.cc/graphql'
const apiUrl = 'https://api.shipx.cc'
const bcUuid = '952ca6c4-744a-42fc-b552-b1663dda6b3d'
const jwt =
  'JWT eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkhuVEdBdVpFYl9KUWJkTl80UmxVUSJ9.eyJodHRwczovL3NoaXB4LmNjL3VzZXIiOnsidXNlcl9pZCI6ImF1dGgwfDY2NzEwYWI5MTgyNGQ5YjZiYzY4Y2JiYyIsImFwcF9tZXRhZGF0YSI6eyJiYXNlQ29tcGFueVV1aWRzIjpbIjhmOTBiMDFmLTM2MmQtNGIyNy04MDBmLWFiN2Y0MTBiODFjOCIsIjdmOTc5MTc5LWY3YWQtNGFmZC05ZDUxLWRhNDNiNTJjZDE3NyIsIjk1MmNhNmM0LTc0NGEtNDJmYy1iNTUyLWIxNjYzZGRhNmIzZCIsIjBiYzkyYmU1LWVlZTgtNGNlMi04YjcyLWM3ODg5NTYyNjYxYiJdLCJwb3J0YWxDb21wYW55VXVpZHMiOltbXSxbXSxbXSxbXV0sInVzZXIiOnsidXVpZCI6Ijg1ZTU0NTlkLTJmNWYtNDE0NS1hNTA4LWFmYzJmMGQyZmMwYyJ9fX0sIm5pY2tuYW1lIjoiaGFyaXRoLmlxYmFsIiwibmFtZSI6Imhhcml0aC5pcWJhbEBzd2lmdGxvZ2lzdGljcy5jb20ubXkiLCJwaWN0dXJlIjoiaHR0cHM6Ly9zLmdyYXZhdGFyLmNvbS9hdmF0YXIvNzljZGViMjY3NWQxOGU4ZTJlYjY3NDc0NTZhN2ZiNzg_cz00ODAmcj1wZyZkPWh0dHBzJTNBJTJGJTJGY2RuLmF1dGgwLmNvbSUyRmF2YXRhcnMlMkZoYS5wbmciLCJ1cGRhdGVkX2F0IjoiMjAyNC0wNy0xOFQwMzozNzo1MS43MTJaIiwiZW1haWwiOiJoYXJpdGguaXFiYWxAc3dpZnRsb2dpc3RpY3MuY29tLm15IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vc2hpcHgtcHJvZC5qcC5hdXRoMC5jb20vIiwiYXVkIjoiUVdDSkFZc3E2M0ViMDFZbmViR05rSFRNWDhGZDFtdUgiLCJpYXQiOjE3MjEyOTIzMDEsImV4cCI6MTcyMTMwNjcwMSwic3ViIjoiYXV0aDB8NjY3MTBhYjkxODI0ZDliNmJjNjhjYmJjIiwic2lkIjoiUkxGb1dGLVBmazVzUG41WG1WbUc3WVFZYmZncXhDcE8iLCJub25jZSI6IllrYzJjbVF5Y1ZWM1RERTRZbEo1V2xkWlppNWFOVXRMYTFBMVRYQjJObEpEY1U5K0xpMVNjRkJYYkE9PSJ9.n_lV2Thql0OG1gO_Bhr_ZPL-M1UMVM6sijJXoCorTY_oQnKvDn5-venaYMVn-wCZ1udSzqtCk_doXvOeSUoD5yEsmjp26fnB8R9fvY17ZcSiS7_9gx6RIege6HL2EYtCdxjY_RQCUVpwNqJmzI8Ii1R0ALVOmIwzwoBglLg53MSMXyn9xwpOH4NKXpV4QuR1KrF0_3xg4lY54fCzqrI7_1V1aYpT5AXFT-r7gl6T7Y7Fw0hrenFz1xegozJLQbfH6Pf8xzV0uOiH9v5x_VkMBnDVwUr0pQ98ShHc5c3CAXLCHngXP-GQ13e9nkKW3ucBPz4_pRFTN71RSWuPGuPGzQ'

const headers = {
  'Content-Type': 'application/json',
  Authorization: jwt,
  'Base-Company-Uuid': bcUuid
}

const queryGateway = async (query, variables) => {
  return (
    await fetch(gatewayUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      })
    })
  ).json()
}

const uploadDocumentApi = async (so, uuid, type) => {
  try {
    const filePath = path.resolve(__dirname, `./data/${dir}/${so}.pdf`)

    if (!fs.existsSync(filePath)) {
      return { errorDocument: true }
    }

    const fileName = path.basename(filePath)
    const fileStream = fs.createReadStream(filePath)

    const body = new FormData()

    body.append('uuid', uuid)
    body.append('type', type)
    body.append('files', fileStream, fileName)

    const res = await fetch(`${apiUrl}/booking/upload-document`, {
      method: 'POST',
      headers: {
        ...body.getHeaders(),
        ...headers
      },
      body
    })

    const data = await res.json()
    return { document: data[0], errorDocument: false }
  } catch (err) {
    console.error(err)
    return { errorDocument: true }
  }
}

const getJobTripFromBooking = async (uuid) => {
  const query = `query getTripsFromBooking1($uuid: UUID) {
    booking(uuid: $uuid) {
      jobs {
        uuid
        trips {
          uuid
        }
      }
    }
  }`

  const variables = { uuid }

  const res = await queryGateway(query, variables)
  return {
    jobUuid: res.data.booking.jobs[0].uuid,
    tripUuid: res.data.booking.jobs[0].trips[0].uuid
  }
}

const updateDocumentTrip = async (uuid, type, tripUuid, jobUuid) => {
  const query = `mutation updateBookingDocument($uuid: UUID!, $type: String!, $tripUuid: UUID, $jobUuid: UUID) {
    updateBookingDocument(
      uuid: $uuid
      type: $type
      tripUuid: $tripUuid
      jobUuid: $jobUuid
    ) {
      document {
        name
        type
      }
    }
  }`

  const variables = {
    uuid,
    type,
    tripUuid,
    jobUuid
  }

  const res = await queryGateway(query, variables)
  return res
}

const verifyDocument = async (uuid) => {
  const query = `mutation verifyBookingDocument($uuid: UUID!) {
    verifyBookingDocument(uuid: $uuid) {
      uuid
    }
  }`

  const variables = { uuid }

  const res = await queryGateway(query, variables)
  return res
}

const getBookings = async (so) => {
  const query = `query bookingsMainEs($input: BookingsSearchInput) {
      bookingsSearchJson(input: $input) {
        rows
        pageInfo {
          count
          limit
          offset
        }
      }
    }`

  const variables = {
    input: {
      q: so,
      sort: '',
      limit: 20,
      offset: 0,
      filter: {}
    }
  }

  const res = await queryGateway(query, variables)
  const bookings = res.data.bookingsSearchJson.rows

  if (bookings.length === 0) {
    return { bookingError: true, errorMessage: 'Booking not found' }
  } else {
    const filteredBookings = []

    for (const booking of bookings) {
      if (booking.billToUuid === billToUuid) {
        filteredBookings.push(booking)
      }
    }

    if (filteredBookings.length === 0) {
      return {
        bookingError: true,
        errorMessage: 'Booking not associated to Total Energies'
      }
    } else if (approveOnlySingleBooking && filteredBookings.length > 1) {
      return {
        bookingError: true,
        errorMessage: 'Multiple bookings found'
      }
    } else {
      return { bookings: filteredBookings, bookingError: false }
    }
  }
}

const getBookingSosByDirectory = async () => {
  const directory = `./commands/data/${dir}`

  const bookingSos = fs.readdirSync(directory).map((file) => file.replace('.pdf', ''))

  return bookingSos
}

const getJobsFromBookingUuid = async (uuid) => {
  const query = `query Jobs($uuid: UUID) {
        booking(uuid: $uuid) {
        jobs {
          uuid
        }
      }
    }`

  const res = await queryGateway(query, { uuid })

  const jobs = res.data.booking.jobs
  return jobs
}

const getLegsByJobId = async (jobUuids) => {
  const query = `query TransportJobs($input: TransportJobQuery!) {
      transportJobs(input: $input) {
        rows {
          uuid
          tripUuid
          transportSource
          transportUuid
          to
        }
      }
    }`

  const variables = {
    input: {
      jobUuids
    }
  }

  const res = await queryGateway(query, variables)

  const legs = res.data.transportJobs.rows
  return legs
}

const updateLegTiming = async (legUuid, tripUuid) => {
  try {
    const query = `mutation UpdateLegTiming($input: UpdateLegTimingInput!) {
      updateLegTiming(input: $input) {
        success
        message
      }
    }`

    const createVariables = (timeField, time) => ({
      input: {
        _id: uuidv4(),
        tripUuid,
        legUuid,
        isUpdateNextTrip: false,
        [timeField]: time
      }
    })

    const times = [
      {
        field: 'start',
        value: moment('2024-06-01T09:00:00').tz('Asia/Kuala_Lumpur').format()
      },
      {
        field: 'startOut',
        value: moment('2024-06-01T09:30:00').tz('Asia/Kuala_Lumpur').format()
      },
      {
        field: 'end',
        value: moment('2024-06-30T13:00:00').tz('Asia/Kuala_Lumpur').format()
      },
      {
        field: 'endOut',
        value: moment('2024-06-30T13:30:00').tz('Asia/Kuala_Lumpur').format()
      }
    ]

    for (const { field, value } of times) {
      const variables = createVariables(field, value)
      const res = await queryGateway(query, variables)

      if (res.errors) {
        console.log('errr!')
        throw new Error(res.errors[0].message)
      }

      console.log(res, 'updated', field)
    }

    return { errorUpdateTiming: false }
  } catch (error) {
    return { errorUpdateTiming: true, messageTiming: error.message }
  }
}

const updateDriverAndVehicle = async (legUuid, zoneCode, tripUuid) => {
  const query = `mutation updateLegMain1($input: UpdateLegInput!) {
      updateLeg(input: $input) {
        success
        message
      }
    }`

  let transportUuid

  if (zoneCode.startsWith('E')) {
    transportUuid = '87867bd3-3117-4399-9d5c-0bc8a328fd9e' // EAST COAST
  } else {
    switch (zoneCode) {
      case 'KV':
      case 'C':
        transportUuid = '1181de00-a9f9-4351-aded-e49172358dc2' // KPN CENTRAL
        break

      case 'N':
        transportUuid = '419f5043-ae62-46f9-ae49-81cc66e0bb69' // KPN NORTH
        break

      case 'S':
        transportUuid = '451610f7-d98f-4067-99bd-638bbc2c0b4d' // LM SOUTH
        break

      default:
        return { message: 'Zone code not found', errorUpdating: true }
    }
  }

  const variables = {
    input: {
      transportUuid,
      driverName: '-',
      vehicleCode: '-',
      vehicleName: '-',
      tripUuid,
      legUuid,
      _id: uuidv4()
    }
  }

  const res = await queryGateway(query, variables)
  return { message: res.data.success, errorUpdating: false }
}

const bulkUploadDocumentTotalEnergies = async () => {
  const bookingSos = await getBookingSosByDirectory()

  const errorList = []
  const successList = []

  for (const so of bookingSos) {
    const { bookings, bookingError, errorMessage } = await getBookings(so)

    if (bookingError) {
      errorList.push({ so, error: errorMessage })
      continue
    }

    for (const booking of bookings) {
      if (updatingTiming) {
        const jobs = await getJobsFromBookingUuid(booking.uuid)

        for (const job of jobs) {
          const legs = await getLegsByJobId(job.uuid)
          for (const leg of legs) {
            const zoneCode = leg.to.zone.replace(/\d/g, '')

            const { errorUpdating, message } = await updateDriverAndVehicle(
              leg.uuid,
              zoneCode,
              leg.tripUuid
            )

            if (errorUpdating) {
              errorList.push({
                legUuid: leg.uuid,
                bookingUuid: booking.uuid,
                message
              })

              continue
            }

            await new Promise((resolve) => setTimeout(resolve, 500))
            const { errorUpdateTiming, messageTiming } = await updateLegTiming(
              leg.uuid,
              leg.tripUuid
            )

            if (errorUpdateTiming) {
              errorList.push({
                so,
                message: messageTiming
              })
            }

            console.log(`Updated leg ${leg.uuid}`)
            successList.push({
              legUuid: leg.uuid,
              bookingUuid: booking.uuid
            })
          }
        }
      } else {
        const { tripUuid, jobUuid } = await getJobTripFromBooking(booking.uuid)
        const { document, errorDocument } = await uploadDocumentApi(
          so,
          booking.uuid,
          'transHlgPodDoc'
        )

        if (errorDocument) {
          console.log(`document ${so} failed to upload`)
          errorList.push({ so, error: 'document failed to upload' })
          continue
        }
        await updateDocumentTrip(document.uuid, document.type, tripUuid, jobUuid)
        await verifyDocument(document.uuid)

        successList.push({ bookingUuid: booking.uuid, so })
        console.log(`SO ${so} completed`)
      }
    }
  }

  fs.writeFileSync(
    `./commands/data/${updatingTiming ? 'timing' : 'document'}-success.json`,
    JSON.stringify(successList, null, 2)
  )

  fs.writeFileSync(
    `./commands/data/${updatingTiming ? 'timing' : 'document'}-error.json`,
    JSON.stringify(errorList, null, 2)
  )
}

bulkUploadDocumentTotalEnergies()
