import { IncomingMessage } from 'http'

export interface Context {
  request: IncomingMessage
  authorization?: string
}
