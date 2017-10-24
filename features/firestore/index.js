const admin = require('firebase-admin')
const serviceAccount = require('../../cryptracker-cb2be48ee926.json')

class FirestoreService {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://cryptracker.firebaseio.com"
        });
        this.firestore = admin.firestore()
    }

    /* Fetch all users whice their last seen price changes more than 5% from the current price.
    *  Return deviceId list
    */
    async fetchNeededNotifyUsers(basePrice, deviation) {
        /* Query bx price that have deviation more than or equal 5% */
        let [omgBxPriceUpQuerySnapshot, omgBxPriceDownQuerySnapshot, evxBxPriceUpQuerySnapshot, evxBxPriceDownQuerySnapshot] = await Promise.all([
            this.firestore.collection('users').where('omg.bx_price', "<=", basePrice.omg / (1 + deviation)).get(),
            this.firestore.collection('users').where('omg.bx_price', ">=", basePrice.omg / (1 - deviation)).get(),
            this.firestore.collection('users').where('evx.bx_price', "<=", basePrice.evx / (1 + deviation)).get(),
            this.firestore.collection('users').where('evx.bx_price', ">=", basePrice.evx / (1 - deviation)).get()
        ])

        /* Get document snapshot for each user */
        let [omgBxPriceUpDocumentsSnapshot, omgBxPriceDownDocumentsSnapshot, evxBxPriceUpDocumentsSnapshot, evxBxPriceDownDocumentsSnapshot] = await Promise.all([omgBxPriceUpQuerySnapshot.docs, omgBxPriceDownQuerySnapshot.docs, evxBxPriceUpQuerySnapshot.docs, evxBxPriceDownQuerySnapshot.docs])

        /* Get deviceTokens of the users that needed notify */
        let filteredPredicate = (document) => document.data().refreshedToken
        let mappedPredicate = (document) => { return { ...document.data(), id: document.id } }

        let [omgBxPriceUpDatas, omgBxPriceDownDatas, evxBxPriceUpDatas, evxBxPriceDownDatas] = await Promise.all([
            omgBxPriceUpDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            omgBxPriceDownDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            evxBxPriceUpDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            evxBxPriceDownDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate)
        ])

        return {
            omg: {
                priceUp: omgBxPriceUpDatas,
                priceDown: omgBxPriceDownDatas
            },
            evx: {
                priceUp: evxBxPriceUpDatas,
                priceDown: evxBxPriceDownDatas
            }
        }
    }

    async updateDocument(pushNotificationSuccess, users, currentPrice) {
        if (!pushNotificationSuccess) return
        let firestoreBatch = this.firestore.batch()

        for (let user of users) {
            if (user.isSentSuccessfully) {
                let doc = this.firestore.collection('users').doc(user.id)
                firestoreBatch.set(doc, { omg: { bx_price: currentPrice.omg }, evx: { bx_price: currentPrice.evx } }, { merge: true })
            }
        }

        let response = await firestoreBatch.commit()
        return console.log(`Successfully executed ${users.filter(v => v.isSentSuccessfully).length} batch.`)
    }
}

module.exports = new FirestoreService()