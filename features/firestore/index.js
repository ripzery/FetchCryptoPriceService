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
        let [bxPriceUpQuerySnapshot, bxPriceDownQuerySnapshot] = await Promise.all([
            this.firestore.collection('users')/* .where('omg.bx_price', "<=", basePrice.omg / (1 + deviation)) */.get(),
            this.firestore.collection('users').where('omg.bx_price', ">=", basePrice.omg / (1 - deviation)).get()
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

    async updateDocument(pushNotificationSuccess, users, currentPrice) {
        if (!pushNotificationSuccess) return
        console.log(users)
        let firestoreBatch = this.firestore.batch()

        for (let user of users) {
            let doc = this.firestore.collection('users').doc(user.id)
            firestoreBatch.update(doc, { omg: { bx_price: currentPrice.omg } })
        }

        let response = await firestoreBatch.commit()
        return console.log(`Successfully executed ${users.length} batch.`)
    }
}

module.exports = new FirestoreService()