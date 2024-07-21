import apollo from '@elysiajs/apollo'
import { Elysia } from 'elysia'

import { typeDefs, resolvers } from './graphql/schema'
import { Context } from './types/context'
import { setupRoutes } from './api/route'

const port = process.env.PORT || process.exit(1)

const app = new Elysia().use(
  apollo({
    typeDefs,
    resolvers,
    context: async (ctx: Context) => {
      const authorization = ctx.request.headers['authorization']

      return {
        ...ctx,
        authorization
      }
    }
  })
)

setupRoutes(app)
app.listen(port)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${process.env.PORT}`)
