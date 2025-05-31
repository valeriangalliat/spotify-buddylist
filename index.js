const fetch = require('node-fetch');
const otplib = require('otplib');


// Clean the hex string by removing invalid characters
function cleanHex(hexStr) {
  const validChars = new Set('0123456789abcdefABCDEF');
  let cleaned = '';
  for (let char of hexStr) {
    if (validChars.has(char)) {
      cleaned += char;
    }
  }
  if (cleaned.length % 2 !== 0) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

// Generate the TOTP for a specific server time
async function generateTotp(serverTimeSeconds) {
  const secretCipher = [12, 56, 76, 33, 88, 44, 88, 33, 78, 78, 11, 66, 22, 22, 55, 69, 54];
  const processed = secretCipher.map((byte, i) => byte ^ (i % 33 + 9));
  const processedStr = processed.join('');
  const utf8Bytes = Buffer.from(processedStr, 'utf-8');
  const hexStr = utf8Bytes.toString('hex');
  const cleanedHex = cleanHex(hexStr);
  const secretBytes = Buffer.from(cleanedHex, 'hex');

  // Encode to base32 using otplib
  const secretBase32 = otplib.authenticator.encode(secretBytes);

  // Set the time step to 30 seconds (default) and use the given server time in seconds
  const timeStep = 30; // Interval of 30 seconds for TOTP

  // Calculate the number of steps from the Unix epoch
  const epochTime = Math.floor(serverTimeSeconds / timeStep);

  // Generate the TOTP for the specific time step
  return otplib.authenticator.generate(secretBase32, { step: timeStep, time: epochTime });
}

exports.getWebAccessToken = async function getWebAccessToken(spDcCookie) {
  const resp = await fetch('https://open.spotify.com/server-time');
  const serverTimeData = await resp.json();
  const serverTimeSeconds = serverTimeData.serverTime;

  // Generate TOTP using server time
  const totp = await generateTotp(serverTimeSeconds);
  const timestamp = Math.floor(Date.now() / 1000); // Current client timestamp

  const params = new URLSearchParams({
    reason: 'transport',
    productType: 'web_player',
    totp: totp,
    totpVer: '5',
    ts: timestamp.toString(),
  });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Cookie': `sp_dc=${spDcCookie}`,
  };

  const response = await fetch(`https://open.spotify.com/get_access_token?${params.toString()}`, {
    method: 'GET',
    headers: headers,
  });

  return await response.json();
}

exports.getFriendActivity = async function getFriendActivity(webAccessToken) {
  // Looks like the app now uses `https://spclient.wg.spotify.com/presence-view/v1/buddylist`
  // but both endpoints appear to be identical in the kind of token they accept
  // and the response format.
  const res = await
    fetch('https://guc-spclient.spotify.com/presence-view/v1/buddylist', {
      headers: {
        Authorization: `Bearer ${webAccessToken}`
      }
    })

  return res.json()
}

exports.wrapWebApi = function wrapWebApi(api) {
  const Request = require('spotify-web-api-node/src/base-request')
  const HttpManager = require('spotify-web-api-node/src/http-manager')

  api.getWebAccessToken = function getWebAccessToken(callback) {
    const { spDcCookie } = this.getCredentials()

    return Request.builder()
      .withHost('open.spotify.com')
      .withPort(443)
      .withScheme('https')
      .withPath('/get_access_token')
      .withQueryParameters({
        reason: 'transport',
        productType: 'web_player'
      })
      .withHeaders({
        Accept: 'application/json',
        Cookie: `sp_dc=${spDcCookie}`
      })
      .build()
      .execute(HttpManager.get, callback)
  }

  api.getFriendActivity = function getFriendActivity(callback) {
    return Request.builder()
      .withHost('guc-spclient.spotify.com')
      .withPort(443)
      .withScheme('https')
      .withAuth(this.getAccessToken())
      .withPath('/presence-view/v1/buddylist')
      .build()
      .execute(HttpManager.get, callback)
  }

  return api
}
