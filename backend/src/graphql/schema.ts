import { gql } from '@elysiajs/apollo'

export const typeDefs = gql`
  type Query {
    health: String
    getUser(id: ID!): User
    bookingsSearchJson(input: BookingSearchInput): BookingSearchResult
  }

  type User {
    id: ID!
    name: String
    email: String
  }

  input FilterInput {
    date: String
    customerName: String
  }

  input BookingSearchInput {
    q: String
    sort: String
    limit: Int
    offset: Int
    filter: FilterInput
  }

  type Booking {
    id: ID!
    customerName: String
    date: String
    so: String
  }

  type BookingSearchResult {
    rows: [Booking]
  }
`

export const resolvers = {
  Query: {
    health: () => 'Ok',
    getUser: (_: unknown, args: { id: string }) => {
      const users = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com' }
      ]

      return users.find((user) => user.id === args.id)
    },
    bookingsSearchJson: (
      _: unknown,
      {
        input
      }: {
        input: {
          q: string
          sort: string
          limit: number
          offset: number
          filter: { date?: string; customerName?: string }
        }
      }
    ) => {
      const bookings = [
        { id: '1', customerName: 'Alice', date: '2024-07-21', so: 'liz' },
        { id: '2', customerName: 'Bob', date: '2024-07-22', so: 'rei' },
        { id: '3', customerName: 'Charlie', date: '2024-07-23', so: 'an' },
        { id: '3', customerName: 'Charlie', date: '2024-07-23', so: 'an' }
      ]

      const filteredBookings = bookings.filter((booking) => {
        let matches = true
        if (input.q) {
          matches = matches && booking.so.toLowerCase().includes(input.q.toLowerCase())
        }
        if (input.filter.date) {
          matches = matches && booking.date === input.filter.date
        }
        if (input.filter.customerName) {
          matches =
            matches &&
            booking.customerName.toLowerCase().includes(input.filter.customerName.toLowerCase())
        }
        return matches
      })

      const paginatedBookings = filteredBookings.slice(input.offset, input.offset + input.limit)

      if (input.sort) {
      }

      return { rows: paginatedBookings }
    }
  }
}
