import { createClient } from 'npm:@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TelegramMessage {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      username?: string
    }
    text: string
    contact?: {
      phone_number: string
    }
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
    }
    data: string
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

async function handleTelegramUpdate(update: TelegramMessage) {
  try {
    if (update.message?.text) {
      const text = update.message.text
      const chatId = update.message.from.id
      const userName = update.message.from.first_name

      if (text === '/start') {
        await sendTelegramMessage(
          chatId,
          `Салом ${userName}! 👋\n\nБот статистика:\n/stats - Заказ статистика\n/orders - Йўқори заказлар`
        )
      } else if (text === '/stats') {
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
        const { count: totalCustomers } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
        const { count: pending } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        const statsMessage = `📊 Заказ Статистика:\n\n✅ Умумий заказлар: ${totalOrders || 0}\n👥 Умумий мижозлар: ${totalCustomers || 0}\n⏳ Кутиётирган заказлар: ${pending || 0}`
        await sendTelegramMessage(chatId, statsMessage)
      } else if (text === '/orders') {
        const { data: orders } = await supabase
          .from('orders')
          .select('*, customers(name, phone)')
          .order('created_at', { ascending: false })
          .limit(5)

        if (!orders || orders.length === 0) {
          await sendTelegramMessage(chatId, 'Заказлар йўқ')
          return
        }

        let message = '📋 Охирги заказлар:\n\n'
        orders.forEach((order, index) => {
          const customer = (order as any).customers
          message += `${index + 1}. ${customer?.name || 'Unknown'} - ${order.amount} сум (${order.status})\n`
        })
        await sendTelegramMessage(chatId, message)
      } else {
        await sendTelegramMessage(chatId, 'Буни манени тушунмадим. /start ни сўра')
      }
    }
  } catch (error) {
    console.error('Error handling update:', error)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json() as TelegramMessage
    await handleTelegramUpdate(body)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
