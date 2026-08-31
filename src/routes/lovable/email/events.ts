import { createEmailWebhookHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }
        const handler = createEmailWebhookHandler({
          apiKey,
          on: {
            'email.bounced': (event) =>
              record(event.event_id, event.data.recipient, 'bounce', event.data.message_id),
            'email.complaint': (event) =>
              record(event.event_id, event.data.recipient, 'complaint', event.data.message_id),
            'email.unsubscribed': (event) =>
              record(event.event_id, event.data.recipient, 'unsubscribe', event.data.message_id),
          },
        })
        return handler(request)
      },
    },
  },
})
