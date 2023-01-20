let express = require('express');
let axios = require('axios');

// Normally you'd want to save your users' access tokens somewhere permanent so that they can be retrieved
// and used as needed.  For simplicity of this demo we're just sticking them into a singleton that will go
// away when you restart the server.
const in_memory_storage = {};

// Set these 2 environment variables to the values of your application that you created at
// https://gazelleapp.io/developer/oauth/applications
const gazelle_app_client_id = process.env["GAZELLE_APP_ID"];
const gazelle_app_secret = process.env["GAZELLE_APP_SECRET"];

// This is the URL that you want Gazelle to redirect users back to once they have authorized your app.
// You must have added this URL as an "Authorized Callback" in your Gazelle App.
const gazelle_app_callback_url = process.env["GAZELLE_APP_CALLBACK_URL"];

let app = express();
app.set('view engine', 'ejs');

async function retrieveFivePianos(accessToken) {
  // A GraphQL query string describing the data we wish to fetch.  See https://gazelleapp.io/docs/graphql/private/
  const graphqlQueryStr = `
    query($sortBy: [PianoSort!], $first: Int) {
      allPianos(sortBy: $sortBy, first: $first) {
        nodes { id make model serialNumber }
      }
    }
  `;

  // Build an object that we'll convert to JSON when we POST the request to Gazelle
  const graphqlQuery = {
    query: graphqlQueryStr,
    variables: {
      first: 5,
      sortBy: ["CREATED_AT_DESC"]
    }
  };

  // Do a POST to the Gazelle API endpoint passing in the GraphQL query and variables, passing the
  // access token in the Authorization header.  See documentation here:
  // https://gazelleapp.io/docs/graphql/private/authentication
  response = await axios.post(
    "https://gazelleapp.io/graphql/private",
    graphqlQuery,
    {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken.access_token}`
        }
      }
    );

  return response.data;
}


app.get('/', async (request, response) => {
  // If we haven't authorized and authenticated yet, show a simple page with a button to redirect the
  // user to authorize our app.  Typically you'd be checking for an existing access token from some sort
  // of persistent storage, but in this demo we're simply using an in-memory object.
  if (!in_memory_storage.access_token) {
    // Create an authorization URL as described at: https://gazelleapp.io/docs/graphql/private/authentication#authorization-flow
    const authUrl = `https://gazelleapp.io/developer/oauth/authorize?client_id=${gazelle_app_client_id}&response_type=code&redirect_uri=${gazelle_app_callback_url}`;

    // Render the not_authenticated_yet template and return it on the response.
    response.render("not_authenticated_yet", {
      authorizationUrl: authUrl,
    });
  } else {
    // Using the access token, retrieve 5 pianos from the Gazelle api.
    const pianos = (await retrieveFivePianos(in_memory_storage.access_token)).data.allPianos.nodes;

    // Render the five_pianos template and return it in the response.
    response.render("five_pianos", { pianos: pianos });
  }
});

app.get('/callback', async (request, response) => {
  // Pull the temporary grant code from the request's query parameter named 'code'
  const grantToken = request.query.code;

  // Use the temporary grant token to retrieve an access token
  const tokenResponse = await axios.post("https://gazelleapp.io/developer/oauth/token", {
    client_id: gazelle_app_client_id,
    client_secret: gazelle_app_secret,
    code: grantToken,
    grant_type: "authorization_code",
    redirect_uri: gazelle_app_callback_url,
  });

  // Now hang on to the access token so that we can use it on subsequent requests to make API calls.
  // Typically you'd hang on to the access token in some more persistent storage system, but for this
  // demo we're simply storing it in an in-memory object.
  in_memory_storage.access_token = tokenResponse.data;

  // Redirect back to the main page.
  response.redirect("/");
});

// Start up the Express server.
app.listen(4567, () => console.log('Gazelle OAuth 2.0 demo app listening on port 4000'));
