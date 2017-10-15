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
        let tokens = {
            omg: {
                priceUp: waitingNotifyUsers.omg.priceUp.map(v => v.refreshedToken),
                priceDown: waitingNotifyUsers.omg.priceDown.map(v => v.refreshedToken),
            },
            evx: {
                priceUp: waitingNotifyUsers.evx.priceUp.map(v => v.refreshedToken),
                priceDown: waitingNotifyUsers.evx.priceDown.map(v => v.refreshedToken)
            }
        }

        /* If there're no users should be notified then do nothing. */
        if (tokens.omg.priceUp.length + tokens.omg.priceDown.length + tokens.evx.priceUp.length + tokens.evx.priceDown.length == 0) return

        /* If there's users should be know that omg price is going up, then send notification */
        if (tokens.omg.priceUp.length) {
            this.payload.data.type = "up"
            this.payload.data.body = `Hooray! OMG is going up more than 5%!. The current price is now ${price.omg}`
            this.payload.data.color = COLOR_GREEN
            let response = await this.messaging.sendToDevice(tokens.omg.priceUp, this.payload)
            this.logFCMResponse(response)
            await FirestoreService.updateDocument(!response.failureCount, [...waitingNotifyUsers.omg.priceUp, ...waitingNotifyUsers.omg.priceDown, ...waitingNotifyUsers.evx.priceUp, ...waitingNotifyUsers.evx.priceDown], price)
        }

        /* If there's users should be know that omg price is going down, then send notification */
        if (tokens.omg.priceDown.length) {
            this.payload.data.type = "down"
            this.payload.data.body = `Boo.. OMG is going down 5% check it out. The current price is now ${price.omg}`
            this.payload.data.color = COLOR_RED
            let response = await this.messaging.sendToDevice(tokens.omg.priceDown, this.payload)
            this.logFCMResponse(response)
            await FirestoreService.updateDocument(!response.failureCount, [...waitingNotifyUsers.omg.priceUp, ...waitingNotifyUsers.omg.priceDown, ...waitingNotifyUsers.evx.priceUp, ...waitingNotifyUsers.evx.priceDown], price)
        }

        /* If there's users should be know that evx price is going up, then send notification */
        if (tokens.evx.priceUp.length) {
            this.payload.data.type = "up"
            this.payload.data.body = `Hooray! EVX is going up more than 5%!. The current price is now ${price.evx}`
            this.payload.data.color = COLOR_GREEN
            let response = await this.messaging.sendToDevice(tokens.evx.priceUp, this.payload)
            this.logFCMResponse(response)
            await FirestoreService.updateDocument(!response.failureCount, [...waitingNotifyUsers.omg.priceUp, ...waitingNotifyUsers.omg.priceDown, ...waitingNotifyUsers.evx.priceUp, ...waitingNotifyUsers.evx.priceDown], price)
        }

        /* If there's users should be know that evx price is going down, then send notification */
        if (tokens.evx.priceDown.length) {
            this.payload.data.type = "down"
            this.payload.data.body = `Boo.. EVX is going down 5% check it out. The current price is now ${price.evx}`
            this.payload.data.color = COLOR_RED
            let response = await this.messaging.sendToDevice(tokens.evx.priceDown, this.payload)
            this.logFCMResponse(response)
            await FirestoreService.updateDocument(!response.failureCount, [...waitingNotifyUsers.omg.priceUp, ...waitingNotifyUsers.omg.priceDown, ...waitingNotifyUsers.evx.priceUp, ...waitingNotifyUsers.evx.priceDown], price)
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