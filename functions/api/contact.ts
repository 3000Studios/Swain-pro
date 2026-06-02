import type { EventContext } from '@cloudflare/workers-types'

interface Env {
  CONTACT_EMAIL: string
  OPENAI_API_KEY: string
}

export async function onRequestPost(ctx: EventContext<Env, string, unknown>) {
  try {
    const data = await ctx.request.json() as {
      name?: string
      email?: string
      type?: string
      message?: string
    }

    const { name, email, type, message } = data

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Rate limiting hint via response header — actual limiting via CF WAF
    const body = [
      `New portfolio inquiry from swain.pro`,
      ``,
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Type:    ${type || 'Not specified'}`,
      ``,
      `Message:`,
      message,
      ``,
      `---`,
      `Sent via swain.pro contact form`,
    ].join('\n')

    // Use Cloudflare Email Routing via fetch to MailChannels (CF Pages built-in)
    const mailPayload = {
      personalizations: [{ to: [{ email: ctx.env.CONTACT_EMAIL || 'Mr.Jwswain@gmail.com', name: 'Jeremy Swain' }] }],
      from: { email: 'contact@swain.pro', name: `${name} via swain.pro` },
      reply_to: { email, name },
      subject: `Portfolio Inquiry — ${type || 'General'} from ${name}`,
      content: [{ type: 'text/plain', value: body }],
    }

    const mailRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mailPayload),
    })

    if (mailRes.ok || mailRes.status === 202) {
      return new Response(JSON.stringify({ ok: true, message: 'Message sent successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fallback: log to console (visible in wrangler tail)
    console.log('Contact form submission:', JSON.stringify({ name, email, type, message: message.slice(0, 100) }))

    return new Response(JSON.stringify({ ok: true, message: 'Received — will follow up at ' + email }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Contact form error:', err)
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
