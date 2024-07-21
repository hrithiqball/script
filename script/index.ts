import * as fs from 'fs'
import * as path from 'path'
import ora from 'ora'
import readline from 'readline'

type ConfigType = {
  billToUuid: string
  baseCompanyUuid: string
  graphqlUrl: string
  apiUrl: string
}

const getHeaders = (bcUuid: string, jwt: string) => ({
  'Content-Type': 'application/json',
  Authorization: jwt,
  'Base-Company-Uuid': bcUuid
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function readConfig(filePath: string): ConfigType | undefined {
  try {
    const fullPath = path.resolve(filePath)
    const data = fs.readFileSync(fullPath, 'utf-8')

    return JSON.parse(data) satisfies ConfigType
  } catch (error) {
    console.error('Error:', error)
    return undefined
  }
}

async function pingGraphqlGateway(url: string, headers: Record<string, string>) {
  try {
    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `query Health {
          health
        }
      `
      })
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

async function pingApiUrl(url: string, headers: Record<string, string>) {
  try {
    await fetch(`${url}/health`, {
      method: 'GET',
      headers
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

async function getJwt() {
  return new Promise<string>((resolve) => {
    rl.question('Enter JWT token: ', (jwt) => {
      resolve(jwt)
    })
  })
}

async function getDir() {
  return new Promise<string>((resolve) => {
    rl.question('Enter directory path: ', (dir) => {
      resolve(dir)
    })
  })
}

async function getAction(): Promise<'DOC' | 'TIME'> {
  return new Promise<'DOC' | 'TIME'>((resolve) => {
    rl.question('Enter action (DOC/TIME): ', (action) => {
      if (action === 'DOC' || action === 'TIME') {
        resolve(action)
      } else {
        console.error('❌ Invalid action')
        rl.close()
      }
    })
  })
}

async function getBookingSoByDir(dir: string) {
  try {
    return fs.readdirSync(dir).map((file) => file.replace('.pdf', ''))
  } catch (error) {
    console.error('Error:', error)
  }
}

function checkDirectoryExists(dir: string) {
  return fs.existsSync(dir)
}

async function queryGraphql(
  query: string,
  variables: Record<string, any>,
  graphqlUrl: string,
  headers: Record<string, string>
) {
  return (
    await fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      })
    })
  ).json()
}

async function getBookings(
  so: string,
  graphqlUrl: string,
  headers: Record<string, string>,
  billToUuid: string
) {
  try {
    const query = `query bookingsMainEs($input: BookingsSearchInput) {
      bookingsSearchJson(input: $input) {
        rows
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

    const res = await queryGraphql(query, variables, graphqlUrl, headers)
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
      } else if (filteredBookings.length > 1) {
        return {
          bookingError: true,
          errorMessage: 'Multiple bookings found'
        }
      } else {
        return { bookings: filteredBookings, bookingError: false }
      }
    }
  } catch (error) {
    return {
      bookingError: true,
      errorMessage: 'Error: ' + error
    }
  }
}

async function main() {
  const config = readConfig('.config')
  if (!config) process.exit(1)

  const jwt = await getJwt()
  const dir = await getDir()
  const action = await getAction()

  const headers = getHeaders(config.baseCompanyUuid, jwt)
  await pingGraphqlGateway(config.graphqlUrl, headers)
  await pingApiUrl(config.apiUrl, headers)

  const dirChecker = ora('Checking directory...').start()
  const directoryExists = checkDirectoryExists(dir)

  if (!directoryExists) {
    console.error('❌ Directory does not exist')
    dirChecker.stop()
    rl.close()
    return
  }

  console.log('✅ Directory exists')
  dirChecker.stop()

  const fileChecker = ora('Checking files...').start()
  const fileExists = fs.readdirSync(dir).length > 0

  if (!fileExists) {
    console.error('❌ No files found')
    fileChecker.stop()
    rl.close()
    return
  }

  console.log('✅ Files found')
  fileChecker.stop()

  const bookingSos = await getBookingSoByDir(dir)

  if (!bookingSos) {
    console.log('❌ No bookings found')
    dirChecker.stop()
    rl.close()
    return
  }

  const errorList = []
  const successList = []

  for (const so of bookingSos) {
    const { bookings, bookingError, errorMessage } = await getBookings(
      so,
      config.graphqlUrl,
      headers,
      config.billToUuid
    )

    console.log('Bookings:', bookings)

    if (bookingError) {
      errorList.push({ so, errorMessage })
      continue
    }

    if (!bookings) {
      errorList.push({ so, errorMessage: 'No bookings found' })
      continue
    }

    for (const booking of bookings) {
      if (action === 'TIME') {
        console.log('Time action', booking)
      }

      if (action === 'DOC') {
        console.log('Doc action', booking)
      }
    }
  }

  rl.close()
}

main()
