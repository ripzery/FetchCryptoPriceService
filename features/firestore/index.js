const admin = require('firebase-admin')
const serviceAccount = require('../../cryptracker-cb2be48ee926.json')
const currencyList = require('../../config/config.js')

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
        let querySnapshots = await Promise.all(this.buildFireStoreRequest(basePrice, deviation))

        /* Get document snapshot for each user */
        let documentSnapshots = await Promise.all(querySnapshots.map(v => v.docs))

        /* Get deviceTokens of the users that needed notify */
        let filteredPredicate = (document) => document.data().refreshedToken
        let mappedPredicate = (document) => { return { ...document.data(), id: document.id } }

        let datas = await Promise.all(documentSnapshots.map(v => v.filter(filteredPredicate).map(mappedPredicate)))

        let result = {}
        let count = 0;
        for (let currency of currencyList){
            result[currency] = {
                priceUp: datas[count++],
                priceDown: datas[count++] 
            }
        }

        return result
    }

    buildFireStoreRequest(basePrice, deviation) {
        let requests = []
        for (let currency of currencyList) {
            requests.push(this.firestore.collection('users').where(`${currency}.bx_price`, "<=", basePrice[currency] / (1 + deviation)).get())
            requests.push(this.firestore.collection('users').where(`${currency}.bx_price`, ">=", basePrice[currency] / (1 - deviation)).get())
        }
        return requests
    }

    async updateDocument(users, currentPrice) {
        let firestoreBatch = this.firestore.batch()

        for (let user of users) {
            let doc = this.firestore.collection('users').doc(user.id)
            if (user.isSentSuccessfully) {
                firestoreBatch.set(doc, currentPrice, { merge: true })
            } else {
                firestoreBatch.delete(doc)
            }
        }

        let response = await firestoreBatch.commit()
        console.log(`Successfully deleted ${users.filter(v => !v.isSentSuccessfully).length} batch.`)
        return console.log(`Successfully updated ${users.filter(v => v.isSentSuccessfully).length} batch.`)
    }

    async deleteDocument(documentIds) {
        let firestoreBatch = this.firestore.batch()

        for (let id of documentIds) {
            let doc = this.firestore.collection('users').doc(id)
            firestoreBatch.delete(doc)
        }

        let response = await firestoreBatch.commit()
        return console.log(`Successfully deleted ${documentIds.length} batches.`)
    }
}

module.exports = new FirestoreService()