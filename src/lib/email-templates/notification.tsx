import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface NotificationProps {
  /** Main heading shown at the top of the message. */
  title?: string
  /** Plain-text body; newlines are preserved. */
  message?: string
  /** Optional signature block. */
  signature?: string
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Tahoma, Arial, sans-serif' }
const container = { padding: '28px 26px', maxWidth: '600px' }
const brand = { color: '#b8933f', fontSize: '13px', letterSpacing: '2px', margin: '0 0 6px' }
const heading = { fontSize: '20px', color: '#141414', margin: '0 0 14px' }
const text = { fontSize: '14px', lineHeight: '1.8', color: '#333333', whiteSpace: 'pre-wrap' as const }
const foot = { fontSize: '12px', color: '#8a8a8a', lineHeight: '1.7' }

const Email = ({ title, message, signature }: NotificationProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>{title || 'VIPSTAR'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>VIPSTAR</Text>
        <Heading style={heading}>{title || 'إشعار من VIPSTAR'}</Heading>
        <Section>
          <Text style={text}>{message || ''}</Text>
        </Section>
        <Hr />
        <Text style={foot}>
          {signature || 'VIP STAR SATELLITE AND ELECTRONICS WLL — vipstar.cc'}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => data['title'] || 'VIPSTAR',
  displayName: 'Notification / إشعار',
  previewData: {
    title: 'تأكيد الطلب #1024',
    message: 'شكراً لطلبك من VIPSTAR.\nسيتم تجهيز طلبك وإرسال التفاصيل قريباً.',
    signature: 'VIP STAR SATELLITE AND ELECTRONICS WLL — vipstar.cc',
  },
} satisfies TemplateEntry

export default Email
