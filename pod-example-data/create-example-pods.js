const fetch = require('node-fetch-commonjs');
const fs = require('fs');
const {generateToken, requestAccessToken} = require('../lib/client-credentials');
const {buildAuthenticatedFetch} = require('@inrupt/solid-client-authn-core');

main();

async function main() {
  await createPod({
    email: 'c1@example.com',
    password: `test`,
    podName: 'c1'
  });

  await createPod({
    email: 'c2@example.com',
    password: `test`,
    podName: 'c2'
  });

  await createPod({
    email: 'c3@example.com',
    password: `test`,
    podName: 'c3'
  });

  storeCalendarOnPod(1);
  storeCalendarOnPod(2);
}

async function storeCalendarOnPod(number) {
  const calendarData = fs.readFileSync(`vacation${number}$.ttl`, 'utf8');
  const calendarACL = fs.readFileSync(`vacation${number}.acl`, 'utf8');
  const {id, secret} = await generateToken('https://pod.playground.solidlab.be/', `c${number}@example.com`, `test`);
  const {accessToken, dpopKey} = await requestAccessToken('https://pod.playground.solidlab.be/.oidc/token', id, secret);
  const authFetch = await buildAuthenticatedFetch(fetch, accessToken, {dpopKey});
  const response = await authFetch(`https://pod.playground.solidlab.be/c${number}/profile/vacation-calendar`, {
    method: 'PUT',
    body: calendarData,
    headers: {
      'content-type': 'text/turtle'
    }
  });

  if (response.status !== 205) {
    console.log(await response.text());
  } else {
    console.log(`Vacation calendar for c${number}@example.com stored.`);
  }

  const response1 = await authFetch(`https://pod.playground.solidlab.be/c${number}/profile/vacation-calendar.acl`, {
    method: 'PUT',
    body: calendarACL,
    headers: {
      'content-type': 'text/turtle'
    }
  });

  if (response1.status !== 205) {
    console.log(await response1.text());
  } else {
    console.log(`Permissions for vacation calendar for c${number}@example.com set.`);
  }
}

async function createPod(options) {
  const {email, password, podName} = options;

  const data = JSON.stringify({
    email,
    password,
    "confirmPassword": password,
    "createWebId": true,
    "register": true,
    "createPod": true,
    "rootPod": false,
    podName
  });

  const config = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  };

  const response = await fetch('https://pod.playground.solidlab.be/idp/register/', config);

  if (response.status === 500) {
    console.error(`Pod for ${email} already exists.`);
  } else {
    console.log(`Pod for ${email} was created.`);
  }
}