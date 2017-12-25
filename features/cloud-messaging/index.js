const FirestoreService = require('../firestore')
const admin = require('firebase-admin')
const COLOR_RED = '#f44336'
const COLOR_GREEN = '#4caf50'

class CloudMessagingService {
    constructor() {
        /* Build payload based on price is going up or down */
        this.payload = {
            data: {
                type: '',
                title: "Cryptracker",
                body: '',
                color: ''
            }
        }
        this.messaging = admin.messaging()
    }

    async notifyUsers(waitingNotifyUsers, price) {
        let currencyList = Object.keys(waitingNotifyUsers)
        let tokens = currencyList
            .reduce((acc, key) => {
                acc[key] = {}
                acc[key]['priceUp'] = waitingNotifyUsers[key].priceUp.map(v => v.refreshedToken)
                acc[key]['priceDown'] = waitingNotifyUsers[key].priceDown.map(v => v.refreshedToken)
                return acc
            }, {})


        console.log(tokens)

        let totalNotifiedPeople = currencyList.reduce((acc, v) => acc + tokens[v].priceUp.length + tokens[v].priceDown.length, 0)
        console.log('Total notified users:', totalNotifiedPeople)

        /* If there're no users should be notified then do nothing. */
        if (totalNotifiedPeople == 0) return

        for (let currency of currencyList) {
            this.payload.data.currency = currency
            this.payload.data.price = `${price[currency]}`
            let firestorePayload = {}
            firestorePayload[currency] = { bx_price: price[currency] }

            /* If there's users should be know that the price is going up, then send notification */
            if (tokens[currency].priceUp.length) {
                this.payload.data.type = 'up'
                this.payload.data.body = `Hooray! ${currency.toUpperCase()} is going up more than 5%!. <current_price>, but the current price is now ${price[currency]}`
                this.payload.data.color = COLOR_GREEN
                let response = await this.messaging.sendToDevice(tokens[currency].priceUp, this.payload)
                this.logFCMResponse(response)
                waitingNotifyUsers[currency].priceUp = waitingNotifyUsers[currency].priceUp.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
                await FirestoreService.updateDocument(waitingNotifyUsers[currency].priceUp, firestorePayload)
            }

            /* If there's users should be know that the price is going down, then send notification */
            if (tokens[currency].priceDown.length) {
                this.payload.data.type = 'down'
                this.payload.data.body = `Boo.. ${currency.toUpperCase()} is going down more than 5%!. <current_price>, but the current price is now ${price[currency]}`
                this.payload.data.color = COLOR_RED
                let response = await this.messaging.sendToDevice(tokens[currency].priceDown, this.payload)
                this.logFCMResponse(response)
                waitingNotifyUsers[currency].priceDown = waitingNotifyUsers[currency].priceDown.map((user, index) => { return { ...user, isSentSuccessfully: !response.results[index].error } })
                await FirestoreService.updateDocument(waitingNotifyUsers[currency].priceDown, firestorePayload)
            }
        }
    }

    async logFCMResponse(response) {
        if (response.failureCount) {
            console.log("Total failed count :", response.failureCount)
            for (let result of response.results) {
                if (result.error)
                    console.log("Error code:", result.error.errorInfo.code);
            }
        }

        if (response.successCount) {
            console.log("Total successfully sent message:", response.successCount);
        }
    }
}

module.exports = new CloudMessagingService()