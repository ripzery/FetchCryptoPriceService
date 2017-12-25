const { execSync } = require('child_process')
const fetch = require('isomorphic-unfetch')
const FirestoreService = require('./features/firestore')
const CloudMessagingService = require('./features/cloud-messaging')
const MarketService = require('./features/market')
const PRICE_DEVIATION = 5 / 100; // Notify when price change (up/down) over x %

/* Combine all services together */
const process = async () => {
    let time = execSync('date')
    console.log(time.toString().replace('\n', ''))
    let [bxPrice, cmcPrice] = await MarketService.fetch()
    let waitingNotifyUsers = await FirestoreService.fetchNeededNotifyUsers(bxPrice, PRICE_DEVIATION)
    let result = await CloudMessagingService.notifyUsers(waitingNotifyUsers, bxPrice)
    return result
}

process()
// setInterval(process, 60 * 1000 * 5)