const FirestoreService = require('../firestore')
const admin = require('firebase-admin')
const COLOR_RED = '#f44336'
const COLOR_GREEN = '#4caf50'

class CloudMessagingService {
    async notifyUsers(waitingNotifyUsers, price) {
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
            this.logFCMResponse(response)
            FirestoreService.updateDocument(!response.failureCount, [...waitingNotifyUsers.priceUp, ...waitingNotifyUsers.priceDown], price)
        }
    
        if (waitingNotifyUserTokens.priceDown.length) {
            payload.data.type = "down"
            payload.data.body = `Boo.. OMG is going down 5% check it out. The current price is now ${price.omg}`
            payload.data.color = COLOR_RED
            let response = await admin.messaging().sendToDevice(waitingNotifyUserTokens.priceDown, payload)
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