const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const RedisSession = require('telegraf-session-redis')

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

bot.help((ctx) => ctx.reply(`I can do the following things:

Shopping list:
There is one separate shopping list per chat/user.
/add item1, ..., itemN : Add items to the shopping list
/list : Show the current shopping list
/done : Show a menu to mark items from the shopping list as bought
`
))

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

    if (shoppingList.length) {
	ctx.reply(`Currently in list: ${shoppingList.join(', ')}`)
    } else {
	ctx.reply('The shopping list is currently empty.')
    }
})

bot.command('done', ctx => {
    // get from session or initialize as empty list
    let shoppingList = ctx.session.shoppingList || []

    if (!shoppingList.length) {
	ctx.reply('The shopping list is currently empty.')
	return
    }

    let buttons = shoppingList.map(item => Markup.callbackButton(item, 'shoppinglistdone_' + item))
    const keyboard = Markup.inlineKeyboard(buttons, {columns: 1}).extra()

    ctx.reply('Currently in shopping list: ', keyboard)
})

bot.action(/shoppinglistdone_(.*)/, ctx => {
    let boughtItem = ctx.match[1]
    // get from session or initialize as empty list
    let shoppingList = ctx.session.shoppingList || []

    // remove first occurence of the bought item
    let idx = shoppingList.indexOf(boughtItem)

    if (idx >= 0) {
	session.shoppingList = shoppingList.splice(idx, 1)
	ctx.reply(`Thanks for buying ${boughtItem}, ${ctx.from.first_name}.`)
    } else {
	ctx.reply(`${boughtItem} is not on the shopping list anymore you fraud!`)
    }
})


bot.startPolling()
