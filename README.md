This is a very simple NodeJS Express app demonstrating the process of having your
users authorize your app with Gazelle and then fetching data.

### Instructions

To install the NodeJS packages run `npm install`.

To run you will first need to have created a Gazelle App in the
[developer console](https://gazelleapp.io/developer).

Then set environment variables to the App ID, secret, and URL you want Gazelle
to redirect to once a user has authorized your App. The callback URL must be
included in the list of authorized callback URLs you configured for your
Gazelle App in the developer console.

Finally, run the demo with just `node server.js`:

```bash
export GAZELLE_APP_ID=YOUR_ID
export GAZELLE_APP_SECRET=YOUR_SECRET
export GAZELLE_APP_CALLBACK_URL=http://localhost:4567/callback

node server.js
```

Then open your browser to http://localhost:4567 and follow the instructions.

Full API documentation can be found here: https://gazelleapp.io/docs/graphql/private/
