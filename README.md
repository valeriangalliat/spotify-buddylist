# spotify-buddylist [![npm version](http://img.shields.io/npm/v/spotify-buddylist.svg?style=flat-square)](https://www.npmjs.org/package/spotify-buddylist)

> Fetch the friend activity Spotify feed.

## Overview

The [Spotify API](https://developer.spotify.com/documentation/web-api/)
doesn't include a way to fetch the friend activity feed that's
available on the right of the desktop app.

There's an [issue on the spotify/web-api repository](https://github.com/spotify/web-api/issues/83)
about that, where a number of people request access to this endpoint
since 2015, but it was closed this summer 2020 without any plan to give
access to this feature through the official API.

Because I want to fetch this data and I don't like being told no, this
repo is a wrapper around the unofficial API that the app calls to fetch
the friend activity feed.

Since the calls are pretty trivial, it's mostly there for public
documentation purpose rather than to really be used as a library, but I
still made it available on npm in case you quickly want to put together
with this.

The only dependency is [node-fetch](https://github.com/node-fetch/node-fetch)
to make HTTP requests.

## Usage

To use this API, you need to get a web player access token, not a
regular API access token, so you can't use the official API way of
logging in, getting and refreshing tokens.

The good news is that if you don't mind logging in on the web player and
refreshing a value in your code once a year, it's actually quite easier.
More on that [below](#sp-dc-cookie).

```js
const buddyList = require('spotify-buddylist')

const { accessToken } = await buddyList.getWebAccessToken(spDcCookie)
const friendActivity = await buddyList.getFriendActivity(accessToken)
```

The output looks like:

```json
{
  "friends": [
    {
      "timestamp": 1600773735000,
      "user": {
        "uri": "spotify:user:shaktirockgym",
        "name": "shaktirockgym"
      },
      "track": {
        "uri": "spotify:track:51xHvAUYQfhY29GcGlBM0n",
        "name": "Piano Sonata No. 16 in C Major, K. 545 \"Sonata facile\": 1. Allegro",
        "imageUrl": "http://i.scdn.co/image/ab67616d0000b273bf4b533ee6e9634a6fcd8882",
        "album": {
          "uri": "spotify:album:1XORY4rQNhqkZxTze6Px90",
          "name": "Piano Book (Deluxe Edition)"
        },
        "artist": {
          "uri": "spotify:artist:4NJhFmfw43RLBLjQvxDuRS",
          "name": "Wolfgang Amadeus Mozart"
        },
        "context": {
          "uri": "spotify:user:spotify:playlist:37i9dQZF1E4riV8HyBkA7r",
          "name": "Wolfgang Amadeus Mozart Radio",
          "index": 0
        }
      }
    }
  ]
}
```

## `sp_dc` cookie

This is the only value that you need for this to work. After you login
on the web player (which I don't automate because reCAPTCHA), you get
a bunch of cookies, including one named `sp_dc`.

Seems like it's valid for one year, and with just that value you can
call anytime an endpoint that gives you a refreshed, elevated API access
token, that, unlike the official API ones, will let you query the
undocumented endpoint that retrieves the friend activity.

## Usage with spotify-web-api-node

You might already be using the [spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node)
package to use the official API. For convenience, I included a method to
wrap it to include the `getWebAccessToken` and `getFriendActivity`
methods on it.

Using it that way, you can leverage the same elevated token for all the
official API requests as well.

```js
const SpotifyWebApi = require('spotify-web-api-node')
const buddyList = require('spotify-buddylist')

const api = buddyList.wrapWebApi(new SpotifyWebApi({ spDcCookie }))

const tokenResponse = await api.getWebAccessToken()
api.setAccessToken(tokenResponse.body.accessToken)

const friendActivityResponse = await api.getFriendActivity()
const friendActivity = friendActivityResponse.body
```

Should your script run more than the token response's
`accessTokenExpirationTimestampMs` (currently an hour), I would suggest
implementing token refresh logic which is just calling
`getWebAccessToken` and `setAccessToken` again like above.
