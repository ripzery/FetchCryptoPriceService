const fetch = require('isomorphic-unfetch')
const admin = require('firebase-admin')
const serviceAccount = require('./cryptracker-cb2be48ee926.json')

const ENDPOINT_BX = 'https://bx.in.th/api/'
const ENDPOINT_COIN_MARKET_CAP = 'https://api.coinmarketcap.com/v1/ticker/'
const BX_KEY_OMG = '26'
const BX_KEY_EVX = '28'
const CMC_KEY_OMG = 'omisego'
const CMC_KEY_EVX = 'everex'


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cryptracker.firebaseio.com"
});

const firestore = admin.firestore()

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

/* Fetch all users whice their last seen price changes more than 5% from the current price.
*  Return deviceId list
*/
const fetchNeededNotifyUsers = async (basePrice, deviation) => {
    /* Query bx price that have deviation more than or equal 5% */
    let [bxPriceUpQuerySnapshot, bxPriceDownQuerySnapshot] = await Promise.all([
        firestore.collection('users').where('omg.bx_price', "<=", basePrice.omg / (1 + deviation)).get(),
        firestore.collection('users').where('omg.bx_price', ">=", basePrice.omg / (1 - deviation)).get()
    ])

    /* Get document snapshot for each user */
    let [bxPriceUpDocumentsSnapshot, bxPriceDownDocumentsSnapshot] = await Promise.all([bxPriceUpQuerySnapshot.docs, bxPriceDownQuerySnapshot.docs])

    /* Get deviceTokens of the users that needed notify */
    let predicate = (document) => document.data().refreshedToken
    let [bxPriceUpDatas, bxPriceDownDatas] = await Promise.all([
        bxPriceUpDocumentsSnapshot.filter(predicate).map(predicate),
        bxPriceDownDocumentsSnapshot.filter(predicate).map(predicate)
    ])

    return {
        priceUp: bxPriceUpDatas,
        priceDown: bxPriceDownDatas
    }
}

const notifyUsers = async (waitingNotifyUsers, price) => {
    /* If there're no users should be notified then do nothing. */
    if (waitingNotifyUsers.priceUp.length + waitingNotifyUsers.priceDown.length == 0) return

    /* Build payload based on price is going up or down */
    let payload = {
        data: {
            currentPrice: `${price.omg}`
        },
        notification: {
            title: waitingNotifyUsers.priceUp.length ? "Hooray! Price is going up 5% check it out!" : "Boo.. Price is going down 5% check it out.",
            body: `The current price is now ${price.omg}`
        }
    }

    let notification = waitingNotifyUsers.priceUp.length ? waitingNotifyUsers.priceUp : waitingNotifyUsers.priceDown

    /* Send notification */
    let response = await admin.messaging().sendToDevice(notification, payload)

    if (response.failureCount) {
        let { code, message } = response.results[0].error.errorInfo
        console.log("Error sending message \ncode:", code + "\nmessage:", message);
    } else
        console.log("Successfully sent message:", response);

}

/* Combine all together */
const process = async () => {
    let [bxPrice, cmcPrice] = await Promise.all([fetchBx(), fetchCoinmarketCap()])
    let waitingNotifyUsers = await fetchNeededNotifyUsers(bxPrice, PRICE_DEVIATION)
    console.log(waitingNotifyUsers)

    notifyUsers(waitingNotifyUsers, bxPrice)
}


setInterval(process, 3000)