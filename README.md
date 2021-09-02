# spotify-buddylist [![npm version](http://img.shields.io/npm/v/spotify-buddylist.svg?style=flat-square)](https://www.npmjs.org/package/spotify-buddylist)

> Fetch the friend activity Spotify feed.

**Note:** don't know how to code? Check the [extra info](#dont-know-how-to-code)
at the bottom!

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
something with this.

The only dependency is [node-fetch](https://github.com/node-fetch/node-fetch)
to make HTTP requests.

## Usage

To use this API, you need to get a web player access token, not a
regular API access token, so you can't use the official API way of
logging in, getting and refreshing tokens.

The good news is that if you don't mind logging in on the web player and
refreshing a value in your code once a year, it's actually quite easier
than the official OAuth way. More on that [below](#sp_dc-cookie).

```js
const buddyList = require('spotify-buddylist')

async function main () {
  const spDcCookie = 'put your cookie here'

  const { accessToken } = await buddyList.getWebAccessToken(spDcCookie)
  const friendActivity = await buddyList.getFriendActivity(accessToken)

  console.log(friendActivity)
}

main()
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
on the [web player] (which I don't automate because reCAPTCHA), you get
a bunch of cookies, including one named `sp_dc`.

[web player]: https://open.spotify.com/

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

## Don't know how to code?

If the documentation above doesn't make much sense to you, here's a
couple extra information you might find useful. 🙏

Because spotify-buddylist is a library, it's meant to be used by *other
programs*, and it doesn't makes any assumption on how it's going to be
used. You're free to *code* a program that automatically populates
another playlist, sends you a notification when a specific friend plays
a specific song, feeds an online spreadsheet, or just appends to a local
file.

But don't worry, if you don't know how to code, you can still use the
[example](example.js) that just displays the data when you run it. The
following steps will show you how to do that.

### Installing

Because this library is built with [Node.js](https://nodejs.org/),
you'll need to install it first.

Then, [download the archive for this repository](https://github.com/valeriangalliat/spotify-buddylist/archive/refs/heads/master.zip)
and extract it.

Open a terminal, go in the spotify-buddylist directory that you just
extracted, and run:

```sh
npm install
```

This will install the extra dependencies needed for the program to run.

### Fetching the cookie

Then you'll need to grab your `sp_dc` cookie from Spotify. This is a
requirement because Spotify doesn't allow third-party apps to get the
friend activity feed, so this cookie allows us to pretend that we're the
Spotify app itself to get access to that data.

For that, login on the [web player] and open your browser's web
developer tools. It's usually in "settings", "more tools", "developer
tools". In that pane, go in "application", "storage", "cookies",
`https://open.spotify.com` (or something close to that depending on your
browser).

You'll find a cookie named `sp_dc`. Copy its value.

### Running the example

In the spotify-buddylist directory, open `example.js` with any text
editor, and paste the cookie value in place of the text "put your cookie
here".

Now, you can run the following command to execute the script:

```sh
node example.js
```

This will display the JSON response from Spotify (once).

If you want to run it periodically, you can uncomment the last line of
the file (remove the `//` from the beginning of the line and save the
file) and run the above command again. Now the script will run
indefinitely, fetching new data every minute and appending it to the
terminal output.

That should be enough to get you started! 🎉

If you want to do more things with that, you might want to learn a
little bit of JavaScript. Programming is powerful, and will allow you to
do the things that *you* want to do with your computer, instead of being
limited to the things that someone else decided that you should be able
to do. Enjoy!
