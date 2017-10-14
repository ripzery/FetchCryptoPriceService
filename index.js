const fetch = require('isomorphic-unfetch')
const FirestoreService = require('./features/firestore')
const CloudMessagingService = require('./features/cloud-messaging')

const ENDPOINT_BX = 'https://bx.in.th/api/'
const ENDPOINT_COIN_MARKET_CAP = 'https://api.coinmarketcap.com/v1/ticker/'
const BX_KEY_OMG = '26'
const BX_KEY_EVX = '28'
const CMC_KEY_OMG = 'omisego'
const CMC_KEY_EVX = 'everex'

const PRICE_DEVIATION = 5 / 100; // Notify when price change (up/down) over x %

/* Fetch Bx.in.th price */
const fetchBx = async () => {
    let response = await fetch(ENDPOINT_BX)
    let bx = await response.json()
    return {
        omg: bx[BX_KEY_OMG].last_price,
        evx: bx[BX_KEY_EVX].last_price
    }
}

/* Fetch coinmarketcap.com price */
const fetchCoinmarketCap = async () => {
    let response = await fetch(ENDPOINT_COIN_MARKET_CAP)
    let cmc = await response.json()
    let [omg, evx] = await cmc.filter(v => v.id == CMC_KEY_OMG || v.id == CMC_KEY_EVX).map(v => v.price_usd)
    return {
        omg,
        evx
    }
}

/* Combine all together */
const process = async () => {
    let [bxPrice, cmcPrice] = await Promise.all([fetchBx(), fetchCoinmarketCap()])
    let waitingNotifyUsers = await FirestoreService.fetchNeededNotifyUsers(bxPrice, PRICE_DEVIATION)
    CloudMessagingService.notifyUsers(waitingNotifyUsers, bxPrice)
}

process()
// setInterval(process, 3000)