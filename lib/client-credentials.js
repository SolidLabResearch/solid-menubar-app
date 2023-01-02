const fetch = require('node-fetch-commonjs');
const { createDpopHeader, generateDpopKeyPair, buildAuthenticatedFetch } = require('@inrupt/solid-client-authn-core');
const fsExtra = require("fs-extra");
const path = require("path");

async function generateToken(serverUrl, email, password) {
// This assumes your server is started under http://localhost:3000/.
// This URL can also be found by checking the controls in JSON responses when interacting with the IDP API,
// as described in the Identity Provider section.
  const response = await fetch(serverUrl + 'idp/credentials/', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    // The email/password fields are those of your account.
    // The name field will be used when generating the ID of your token.
    body: JSON.stringify({email, password, name: 'benefit-calculation-orchestrator'}),
  });

// These are the identifier and secret of your token.
// Store the secret somewhere safe as there is no way to request it again from the server!
  return await response.json();
}

async function requestAccessToken(tokenUrl, id, secret) {
  // A key pair is needed for encryption.
// This function from `solid-client-authn` generates such a pair for you.
  const dpopKey = await generateDpopKeyPair();

// These are the ID and secret generated in the previous step.
// Both the ID and the secret need to be form-encoded.
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
// This URL can be found by looking at the "token_endpoint" field at
// http://localhost:3000/.well-known/openid-configuration
// if your server is hosted at http://localhost:3000/.
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
  });

// This is the Access token that will be used to do an authenticated request to the server.
// The JSON also contains an "expires_in" field in seconds,
// which you can use to know when you need request a new Access token.
  const { access_token: accessToken } = await response.json();
  return {accessToken, dpopKey};
}

async function getAuthenticatedFetch(configFilePath) {
  const {email, password, serverUrl} = await fsExtra.readJson(configFilePath);
  const tokenUrl = serverUrl + '.oidc/token';
  const temp = await getIDSecretFromJSONFile(path.join(process.cwd(), 'idSecrets.json'), serverUrl, email);
  let id, secret;

  if (!temp) {
    console.log('Generating new id and secret');
    const result = await generateToken(serverUrl, email, password);
    id = result.id;
    secret = result.secret;
    storeIDSecretInJSONFile(path.join(process.cwd(), 'idSecrets.json'), serverUrl, email, id, secret);
  } else {
    console.log('Using existing id and secret');
    id = temp.id;
    secret = temp.secret;
  }

  const {accessToken, dpopKey} = await requestAccessToken(tokenUrl, id, secret);
  return await buildAuthenticatedFetch(fetch, accessToken, { dpopKey});
}

async function getIDSecretFromJSONFile(jsonFilePath, serverUrl, email) {
  let data = [];

  if (await fsExtra.pathExists(jsonFilePath)) {
    data = await fsExtra.readJson(jsonFilePath);
  }

  for (const el of data) {
    if (el.serverUrl === serverUrl && el.email === email) {
      return {id: el.id, secret: el.secret};
    }
  }

  return null;
}

async function storeIDSecretInJSONFile(jsonFilePath, serverUrl, email, id, secret) {
  let data = [];

  if (await fsExtra.pathExists(jsonFilePath)) {
    data = await fsExtra.readJson(jsonFilePath);
  }

  data.push({serverUrl, email, id, secret});

  await fsExtra.writeJson(jsonFilePath, data);
}

module.exports = {getAuthenticatedFetch, generateToken, requestAccessToken, getIDSecretFromJSONFile, storeIDSecretInJSONFile};
