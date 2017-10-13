const fetch = require('isomorphic-unfetch')
const Firestore = require('@google-cloud/firestore')

const ENDPOINT_BX = 'https://bx.in.th/api/'
const ENDPOINT_COIN_MARKET_CAP = 'https://api.coinmarketcap.com/v1/ticker/'
const BX_KEY_OMG = '26'
const BX_KEY_EVX = '28'
const CMC_KEY_OMG = 'omisego'
const CMC_KEY_EVX = 'everex'

const firestore = new Firestore({
    projectId: 'cryptracker',
    keyFilename: 'cryptracker-cb2be48ee926.json'
})

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

/* Fetch all users whice their last seen price changes more than 5% from the current price 
*  Return deviceId list
*/
const fetchFirestore = async (basePrice) => {
    let querySnapshot = await firestore.collection('users').where('omg.bx_price', ">=", basePrice.omg * 1.05).get()
    let documentsSnapshot = await querySnapshot.docs
    let datas = await documentsSnapshot.map(document => document.data().deviceId);
    console.log(datas)
    return datas
}

const fetchAll = async () => {
    let response = await Promise.all([fetchBx(), fetchCoinmarketCap()])
    let bxPrice = await response[0]
    let firestoreResponse = await fetchFirestore(bxPrice)
    
}

setInterval(fetchAll, 3000)