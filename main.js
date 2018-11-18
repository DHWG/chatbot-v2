const Telegraf = require('telegraf')
const RedisSession = require('telegraf-session-redis')
const commandArgsMiddleware = require('./commandmiddleware')

// splits all arguments to the command by ,
function argSplitMiddleware(ctx, next) {
    if (!ctx.message) {
	return next()
    } 

    try {
	let args = ctx.message.text
	    .replace(/^\/[a-z]+ */, '')
	    .split(/ *, */)
	    .filter(s => s.length > 0)
	ctx.arguments = args
    } catch (e) {
	console.error(e)
    }
    return next()
}

const bot = new Telegraf(process.env.BOT_TOKEN)
const session = new RedisSession({
  store: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  },
  getSessionKey: ctx => ctx.chat.id
})

bot.use(session.middleware())
bot.use(argSplitMiddleware)

bot.start((ctx) => ctx.reply('Welcome!'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('Fuck you!'))
bot.hears('hi', (ctx) => {
	  ctx.session.counter = ctx.session.counter || 0
	  ctx.session.counter++
	  ctx.reply(`I heard this ${ctx.session.counter} times already!!`)
})

bot.command('add', ctx => {
    // get from session or initialize as empty list
    let shoppingList = ctx.session.shoppingList || []
    // update with items from the message
    shoppingList = shoppingList.concat(ctx.arguments)
    // write back into session to get persisted in redis
    ctx.session.shoppingList = shoppingList

    ctx.reply(`Currently in list: ${shoppingList.join(', ')}`)
})

bot.command('list', ctx => {
    // get from session or initialize as empty list
    let shoppingList = ctx.session.shoppingList || []

    ctx.reply(`Currently in list: ${shoppingList.join(', ')}`)
})

bot.command('done', ctx => {
    // get from session or initialize as empty list
    let shoppingList = ctx.session.shoppingList || []

})

bot.startPolling()
