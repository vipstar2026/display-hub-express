/**
 * HTTP email sending. SMTP is not available in the edge runtime, so automatic
 * sending goes through an HTTP email API configured by the admin
 * (Resend / Brevo / SendGrid / Postmark / custom endpoint).
 */

export type EmailConfig = {
  provider: string;
  apiKey: string;
  endpoint?: string | null;
  fromEmail: string;
  fromName?: string | null;
  replyTo?: string | null;
};

export type OutgoingEmail = {
  to: string;
  toName?: string | null;
  subject: string;
  text: string;
};

export async function loadEmailConfig(): Promise<EmailConfig | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("email_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const row = data as Record<string, any> | null;
  if (!row || !row.api_enabled || !row.from_email) return null;
  // A secret stored in the project's secret store always wins over the DB copy.
  const apiKey = process.env["EMAIL_API_KEY"] || row.api_key;
  if (!apiKey) return null;
  return {
    provider: (row.api_provider || "resend").toLowerCase(),
    apiKey,
    endpoint: row.api_endpoint,
    fromEmail: row.from_email,
    fromName: row.from_name,
    replyTo: row.reply_to,
  };
}


function htmlBody(text: string) {
  return `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.7">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</div>`;
}

export async function sendEmail(cfg: EmailConfig, mail: OutgoingEmail): Promise<void> {
  const from = cfg.fromName ? `${cfg.fromName} <${cfg.fromEmail}>` : cfg.fromEmail;
  let url: string;
  let headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: unknown;

  switch (cfg.provider) {
    case "brevo":
      url = cfg.endpoint || "https://api.brevo.com/v3/smtp/email";
      headers["api-key"] = cfg.apiKey;
      body = {
        sender: { email: cfg.fromEmail, name: cfg.fromName || undefined },
        to: [{ email: mail.to, name: mail.toName || undefined }],
        replyTo: cfg.replyTo ? { email: cfg.replyTo } : undefined,
        subject: mail.subject,
        textContent: mail.text,
        htmlContent: htmlBody(mail.text),
      };
      break;
    case "sendgrid":
      url = cfg.endpoint || "https://api.sendgrid.com/v3/mail/send";
      headers.Authorization = `Bearer ${cfg.apiKey}`;
      body = {
        personalizations: [{ to: [{ email: mail.to, name: mail.toName || undefined }] }],
        from: { email: cfg.fromEmail, name: cfg.fromName || undefined },
        reply_to: cfg.replyTo ? { email: cfg.replyTo } : undefined,
        subject: mail.subject,
        content: [
          { type: "text/plain", value: mail.text },
          { type: "text/html", value: htmlBody(mail.text) },
        ],
      };
      break;
    case "postmark":
      url = cfg.endpoint || "https://api.postmarkapp.com/email";
      headers["X-Postmark-Server-Token"] = cfg.apiKey;
      body = {
        From: from,
        To: mail.to,
        ReplyTo: cfg.replyTo || undefined,
        Subject: mail.subject,
        TextBody: mail.text,
        HtmlBody: htmlBody(mail.text),
      };
      break;
    case "mailersend":
      url = cfg.endpoint || "https://api.mailersend.com/v1/email";
      headers.Authorization = `Bearer ${cfg.apiKey}`;
      body = {
        from: { email: cfg.fromEmail, name: cfg.fromName || undefined },
        to: [{ email: mail.to, name: mail.toName || undefined }],
        reply_to: cfg.replyTo ? { email: cfg.replyTo } : undefined,
        subject: mail.subject,
        text: mail.text,
        html: htmlBody(mail.text),
      };
      break;
    default: // resend + custom endpoints that follow the Resend shape
      url = cfg.endpoint || "https://api.resend.com/emails";
      headers.Authorization = `Bearer ${cfg.apiKey}`;
      body = {
        from,
        to: [mail.to],
        reply_to: cfg.replyTo || undefined,
        subject: mail.subject,
        text: mail.text,
        html: htmlBody(mail.text),
      };
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status} ${detail.slice(0, 300)}`);
  }
}

/* -------------------------------------------------------------------------
 * Lovable email (default) — sends through Lovable's managed email API using the
 * verified sender domain. Used whenever no external API provider is enabled.
 * ---------------------------------------------------------------------- */

/** Sends through Lovable's managed email delivery (no API key needed). */
export async function sendViaLovable(mail: OutgoingEmail, idempotencyKey?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const to = mail.to.trim();

  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

  const log = async (status: string, errorMessage?: string) => {
    const { error } = await admin.from("email_send_log").insert({
      template_name: "notification",
      recipient_email: to,
      status,
      ...(errorMessage ? { error_message: errorMessage } : {}),
    });
    if (error) console.error("Failed to write email_send_log", error.message);
  };

  let result;
  try {
    result = await sendTemplateEmail("notification", to, {
      templateData: { title: mail.subject, message: mail.text },
      idempotencyKey,
    });
  } catch (e) {
    await log("failed", (e as Error).message);
    throw e;
  }

  if (!result.sent) {
    await log("suppressed");
    throw new Error("email_suppressed");
  }

  await log("sent");
}

/** Sends a single email: external API provider if enabled, otherwise Lovable. */
export async function deliver(mail: OutgoingEmail, idempotencyKey?: string) {
  const cfg = await loadEmailConfig();
  if (cfg) return await sendEmail(cfg, mail);
  return await sendViaLovable(mail, idempotencyKey);
}

/** Sends every queued (pending) email in the outbox. */
export async function dispatchOutbox(limit = 25) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const cfg = await loadEmailConfig();

  const { data: rows, error } = await supabaseAdmin
    .from("email_outbox")
    .select("id, to_email, to_name, subject, body")
    .in("status", ["queued", "pending"])
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  let sent = 0;
  let failed = 0;
  for (const row of rows ?? []) {
    const mail: OutgoingEmail = {
      to: row.to_email,
      toName: row.to_name,
      subject: row.subject,
      text: row.body,
    };
    try {
      if (cfg) await sendEmail(cfg, mail);
      else await sendViaLovable(mail, `outbox-${row.id}`);
      await supabaseAdmin
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", row.id);
      sent++;
    } catch (e) {
      await supabaseAdmin
        .from("email_outbox")
        .update({ status: "failed", error: (e as Error).message })
        .eq("id", row.id);
      failed++;
    }
  }
  return { sent, failed, skipped: false as const };
}
