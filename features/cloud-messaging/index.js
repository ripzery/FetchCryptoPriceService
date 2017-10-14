const FirestoreService = require('../firestore')
const admin = require('firebase-admin')
const COLOR_RED = '#f44336'
const COLOR_GREEN = '#4caf50'

class CloudMessagingService {
    constructor() {
        /* Build payload based on price is going up or down */
        this.payload = {
            data: {
                currentPrice: '',
                type: '',
                title: "Cryptracker",
                body: '',
                color: ''
            }
        }
        this.messaging = admin.messaging()
    }

    async notifyUsers(waitingNotifyUsers, price) {
        let waitingNotifyUserTokens = {
            priceUp: waitingNotifyUsers.priceUp.map(v => v.refreshedToken),
            priceDown: waitingNotifyUsers.priceDown.map(v => v.refreshedToken)
        }

        /* Update current price */
        this.payload.data.currentPrice = `${price.omg}`

        /* If there're no users should be notified then do nothing. */
        if (waitingNotifyUserTokens.priceUp.length + waitingNotifyUserTokens.priceDown.length == 0) return

        if (waitingNotifyUserTokens.priceUp.length) {
            this.payload.data.type = "up"
            this.payload.data.body = `Hooray! OMG is going up more than 5%!. The current price is now ${price.omg}`
            this.payload.data.color = COLOR_GREEN
            let response = await this.messaging.sendToDevice(waitingNotifyUserTokens.priceUp, this.payload)
            this.logFCMResponse(response)
            FirestoreService.updateDocument(!response.failureCount, [...waitingNotifyUsers.priceUp, ...waitingNotifyUsers.priceDown], price)
        }

        if (waitingNotifyUserTokens.priceDown.length) {
            this.payload.data.type = "down"
            this.payload.data.body = `Boo.. OMG is going down 5% check it out. The current price is now ${price.omg}`
            this.payload.data.color = COLOR_RED
            let response = await this.messaging.sendToDevice(waitingNotifyUserTokens.priceDown, this.payload)
            this.logFCMResponse(response)
            FirestoreService.updateDocument(!response.failureCount, [...waitingNotifyUsers.priceUp, ...waitingNotifyUsers.priceDown], price)
        }
    }

    async logFCMResponse(response) {
        if (response.failureCount) {
            let { code, message } = response.results[0].error.errorInfo
            console.log("Error sending message \ncode:", code + "\nmessage:", message);
        } else
            console.log("Successfully sent message:", response);
    }
}

module.exports = new CloudMessagingService()