const fetch = require('isomorphic-unfetch')
const admin = require('firebase-admin')
const serviceAccount = require('./cryptracker-cb2be48ee926.json')

const ENDPOINT_BX = 'https://bx.in.th/api/'
const ENDPOINT_COIN_MARKET_CAP = 'https://api.coinmarketcap.com/v1/ticker/'
const BX_KEY_OMG = '26'
const BX_KEY_EVX = '28'
const CMC_KEY_OMG = 'omisego'
const CMC_KEY_EVX = 'everex'

const COLOR_RED = '#f44336'
const COLOR_GREEN = '#4caf50'


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
        firestore.collection('users')/* .where('omg.bx_price', "<=", basePrice.omg / (1 + deviation)) */.get(),
        firestore.collection('users').where('omg.bx_price', ">=", basePrice.omg / (1 - deviation)).get()
    ])

    /* Get document snapshot for each user */
    let [bxPriceUpDocumentsSnapshot, bxPriceDownDocumentsSnapshot] = await Promise.all([bxPriceUpQuerySnapshot.docs, bxPriceDownQuerySnapshot.docs])

    /* Get deviceTokens of the users that needed notify */
    let filteredPredicate = (document) => document.data().refreshedToken
    let mappedPredicate = (document) => { return { ...document.data(), id: document.id } }

    let [bxPriceUpDatas, bxPriceDownDatas] = await Promise.all([
        bxPriceUpDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
        bxPriceDownDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate)
    ])

    return {
        priceUp: bxPriceUpDatas,
        priceDown: bxPriceDownDatas
    }
}

const notifyUsers = async (waitingNotifyUsers, price) => {
    let waitingNotifyUserTokens = {
        priceUp: waitingNotifyUsers.priceUp.map(v => v.refreshedToken),
        priceDown: waitingNotifyUsers.priceDown.map(v => v.refreshedToken)
    }

    /* If there're no users should be notified then do nothing. */
    if (waitingNotifyUserTokens.priceUp.length + waitingNotifyUserTokens.priceDown.length == 0) return

    /* Build payload based on price is going up or down */
    let payload = {
        data: {
            currentPrice: `${price.omg}`,
            type: "",
            title: "Cryptracker"
        }
    }

    if (waitingNotifyUserTokens.priceUp.length) {
        payload.data.type = "up"
        payload.data.body = `Hooray! OMG is going up more than 5%!. The current price is now ${price.omg}`
        payload.data.color = COLOR_GREEN
        let response = await admin.messaging().sendToDevice(waitingNotifyUserTokens.priceUp, payload)
        logFCMResponse(response)
        updateDocument(!response.failureCount, [...waitingNotifyUsers.priceUp, ...waitingNotifyUsers.priceDown], price)
    }

    if (waitingNotifyUserTokens.priceDown.length) {
        payload.data.type = "down"
        payload.data.body = `Boo.. OMG is going down 5% check it out. The current price is now ${price.omg}`
        payload.data.color = COLOR_RED
        let response = await admin.messaging().sendToDevice(waitingNotifyUserTokens.priceDown, payload)
        logFCMResponse(response)
        updateDocument(!response.failureCount, [...waitingNotifyUsers.priceUp, ...waitingNotifyUsers.priceDown], price)
    }
    return
}

const updateDocument = async (pushNotificationSuccess, users, currentPrice) => {
    if (!pushNotificationSuccess) return
    console.log(users)
    let firestoreBatch = firestore.batch()

    for (let user of users) {
        let doc = firestore.collection('users').doc(user.id)
        firestoreBatch.update(doc, { omg: { bx_price: currentPrice.omg } })
    }

    let response = await firestoreBatch.commit()
    return console.log(`Successfully executed ${users.length} batch.`)
}

const logFCMResponse = (response) => {
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
    notifyUsers(waitingNotifyUsers, bxPrice)
}

process()
// setInterval(process, 3000)