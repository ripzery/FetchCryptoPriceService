const fetch = require('isomorphic-unfetch')
const FirestoreService = require('./features/firestore')
const CloudMessagingService = require('./features/cloud-messaging')
const MarketService = require('./features/market')
const PRICE_DEVIATION = 5 / 100; // Notify when price change (up/down) over x %

/* Combine all services together */
const process = async () => {
    let [bxPrice, cmcPrice] = await Promise.all([MarketService.fetchBx(), MarketService.fetchCoinmarketCap()])
    let waitingNotifyUsers = await FirestoreService.fetchNeededNotifyUsers(bxPrice, PRICE_DEVIATION)
    let result = await CloudMessagingService.notifyUsers(waitingNotifyUsers, bxPrice)
    return result
}

process()
// setInterval(process, 60 * 1000 * 5)