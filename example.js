const buddyList = require('./')

async function main () {
  const spDcCookie = 'put your cookie here'

  const accessTokenInfo = await buddyList.getWebAccessToken(spDcCookie)

  console.log('Access token:', JSON.stringify(accessTokenInfo))

  const friendActivity = await buddyList.getFriendActivity(accessTokenInfo.accessToken)

  console.log(JSON.stringify(friendActivity, null, 2))
}

main()

// Run every minute
// setInterval(() => main(), 1000 * 60)
