class MarketService {
    constructor() {
        this.ENDPOINT_BX = 'https://bx.in.th/api/'
        this.ENDPOINT_COIN_MARKET_CAP = 'https://api.coinmarketcap.com/v1/ticker/?limit=0'
    }

    async fetch() {
        let bxPrice = await this.fetchBx();
        let cmcPrice = await this.fetchCoinmarketCap(bxPrice)

        return [bxPrice, cmcPrice]
    }


    /* Fetch Bx.in.th price */
    async fetchBx() {
        let response = await fetch(this.ENDPOINT_BX)
        let bx = await response.json()
        bx = Object.keys(bx).map(k => bx[k]).filter(v => v['primary_currency'] == 'THB')
        let result = bx.reduce((acc, v) => {
            acc[v['secondary_currency'].toLowerCase()] = v['last_price']
            return acc
        }, {})

        // console.log(result)

        return result
    }

    /* Fetch coinmarketcap.com price */
    async fetchCoinmarketCap(bxPrice) {
        let response = await fetch(this.ENDPOINT_COIN_MARKET_CAP)
        let cmc = await response.json()
        let cmcList = await cmc.filter(v => v.id != 'das' && bxPrice[v.symbol.toLowerCase()] || v.id == 'dash')
        let result = cmcList.reduce((acc, v) => {
            acc[v['symbol'].substring(0,3).toLowerCase()] = v['price_usd']
            return acc
        }, {})
        return result
    }
}

module.exports = new MarketService()