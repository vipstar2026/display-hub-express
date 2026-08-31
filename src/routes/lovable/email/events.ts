import { createEmailWebhookHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'

type Reason = 'bounce' | 'complaint' | 'unsubscribe'

function statusFor(reason: Reason): 'bounced' | 'complained' | 'suppressed' {
  if (reason === 'bounce') return 'bounced'
  if (reason === 'complaint') return 'complained'
  return 'suppressed'
}

function messageFor(reason: Reason): string {
  if (reason === 'bounce') return 'Permanent bounce — email address is invalid or rejected'
  if (reason === 'complaint') return 'Spam complaint — recipient marked email as spam'
  return 'Recipient unsubscribed'
}

/**
 * Mirrors the delivery outcome into the app's own records. Notification only —
 * Lovable enforces suppression at send time.
 */
async function record(
  eventId: string,
  recipient: string,
  reason: Reason,
  messageId?: string | null,
) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const admin = supabaseAdmin as any
  const email = recipient.toLowerCase()

  const { error: suppressError } = await admin
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      event_id: eventId,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('suppression_write_failed')
  }

  const { error: logError } = await admin.from('email_send_log').insert({
    message_id: messageId ?? null,
    template_name: 'system',
    recipient_email: email,
    status: statusFor(reason),
    error_message: messageFor(reason),
    metadata: null,
  })
  if (logError) {
    console.warn('Failed to insert email_send_log', {
      event_id: eventId,
      code: logError.code,
      message: logError.message,
    })
  }
}


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
