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
        let querySnapshots = await Promise.all([
            this.firestore.collection('users').where('omg.bx_price', "<=", basePrice.omg / (1 + deviation)).get(),
            this.firestore.collection('users').where('omg.bx_price', ">=", basePrice.omg / (1 - deviation)).get(),
            this.firestore.collection('users').where('evx.bx_price', "<=", basePrice.evx / (1 + deviation)).get(),
            this.firestore.collection('users').where('evx.bx_price', ">=", basePrice.evx / (1 - deviation)).get(),

            this.firestore.collection('users').where('btc.bx_price', "<=", basePrice.btc / (1 + deviation)).get(),
            this.firestore.collection('users').where('btc.bx_price', ">=", basePrice.btc / (1 - deviation)).get(),
            this.firestore.collection('users').where('eth.bx_price', "<=", basePrice.eth / (1 + deviation)).get(),
            this.firestore.collection('users').where('eth.bx_price', ">=", basePrice.eth / (1 - deviation)).get()
        ])

        let omgBxPriceUpQuerySnapshot = querySnapshots[0]
        let omgBxPriceDownQuerySnapshot = querySnapshots[1]
        let evxBxPriceUpQuerySnapshot = querySnapshots[2]
        let evxBxPriceDownQuerySnapshot = querySnapshots[3]
        let btcBxPriceUpQuerySnapshot = querySnapshots[4]
        let btcBxPriceDownQuerySnapshot = querySnapshots[5]
        let ethBxPriceUpQuerySnapshot = querySnapshots[6]
        let ethBxPriceDownQuerySnapshot = querySnapshots[7]


        /* Get document snapshot for each user */
        let documentSnapshots = await Promise.all([
            omgBxPriceUpQuerySnapshot.docs, 
            omgBxPriceDownQuerySnapshot.docs, 
            evxBxPriceUpQuerySnapshot.docs, 
            evxBxPriceDownQuerySnapshot.docs,
            btcBxPriceUpQuerySnapshot.docs, 
            btcBxPriceDownQuerySnapshot.docs, 
            ethBxPriceUpQuerySnapshot.docs, 
            ethBxPriceDownQuerySnapshot.docs
        ])
        
        let omgBxPriceUpDocumentsSnapshot = documentSnapshots[0]
        let omgBxPriceDownDocumentsSnapshot = documentSnapshots[1]
        let evxBxPriceUpDocumentsSnapshot = documentSnapshots[2]
        let evxBxPriceDownDocumentsSnapshot = documentSnapshots[3]
        let btcBxPriceUpDocumentsSnapshot = documentSnapshots[4]
        let btcBxPriceDownDocumentsSnapshot = documentSnapshots[5]
        let ethBxPriceUpDocumentsSnapshot = documentSnapshots[6]
        let ethBxPriceDownDocumentsSnapshot = documentSnapshots[7]

        /* Get deviceTokens of the users that needed notify */
        let filteredPredicate = (document) => document.data().refreshedToken
        let mappedPredicate = (document) => { return { ...document.data(), id: document.id } }

        let [
            omgBxPriceUpDatas, 
            omgBxPriceDownDatas, 
            evxBxPriceUpDatas, 
            evxBxPriceDownDatas,
            btcBxPriceUpDatas, 
            btcBxPriceDownDatas, 
            ethBxPriceUpDatas, 
            ethBxPriceDownDatas] = await Promise.all([
            omgBxPriceUpDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            omgBxPriceDownDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            evxBxPriceUpDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            evxBxPriceDownDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            btcBxPriceUpDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            btcBxPriceDownDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            ethBxPriceUpDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate),
            ethBxPriceDownDocumentsSnapshot.filter(filteredPredicate).map(mappedPredicate)
        ])

        return {
            omg: {
                priceUp: omgBxPriceUpDatas,
                priceDown: omgBxPriceDownDatas
            },
            evx: {
                priceUp: evxBxPriceUpDatas,
                priceDown: evxBxPriceDownDatas
            },
            btc: {
                priceUp: btcBxPriceUpDatas,
                priceDown: btcBxPriceDownDatas
            },
            eth: {
                priceUp: ethBxPriceUpDatas,
                priceDown: ethBxPriceDownDatas
            }
        }
    }

    async updateDocument(users, currentPrice) {
        let firestoreBatch = this.firestore.batch()

        for (let user of users) {
            let doc = this.firestore.collection('users').doc(user.id)
            if (user.isSentSuccessfully) {
                firestoreBatch.set(doc, currentPrice, { merge: true })
            }else{
                firestoreBatch.delete(doc)
            }
        }

        let response = await firestoreBatch.commit()
        console.log(`Successfully deleted ${users.filter(v => !v.isSentSuccessfully).length} batch.`)
        return console.log(`Successfully updated ${users.filter(v => v.isSentSuccessfully).length} batch.`)
    }

    async deleteDocument(documentIds){
        let firestoreBatch = this.firestore.batch()

        for(let id of documentIds){
            let doc = this.firestore.collection('users').doc(id)
            firestoreBatch.delete(doc)
        }

        let response = await firestoreBatch.commit()
        return console.log(`Successfully deleted ${documentIds.length} batches.`)
    }
}

module.exports = new FirestoreService()