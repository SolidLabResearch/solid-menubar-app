const fetch = require('node-fetch-commonjs');
const fs = require('fs');
const {format} = require('date-fns');
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

  await addNameToPod({
    email: 'c1@example.com',
    password: `test`,
    webid: 'https://pod.playground.solidlab.be/c1/profile/card#me',
    name: 'Nathalie'
  });

  await addNameToPod({
    email: 'c2@example.com',
    password: `test`,
    webid: 'https://pod.playground.solidlab.be/c2/profile/card#me',
    name: 'Amara'
  });
}

async function storeCalendarOnPod(number) {
  let calendarData = fs.readFileSync(`vacation${number}$.ttl`, 'utf8');
  calendarData = calendarData.replaceAll('$$$TODAY$$$', format(new Date(), 'y-LL-dd'));
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

  if (!response.ok) {
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

  if (!response.ok) {
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
    body: data
  };

  const response = await fetch('https://pod.playground.solidlab.be/idp/register/', config);

  if (response.status === 500) {
    console.error(`Pod for ${email} already exists.`);
  } else {
    console.log(`Pod for ${email} was created.`);
  }
}

async function addNameToPod(options){
  const {email, password, webid, name} = options;

  const {id, secret} = await generateToken('https://pod.playground.solidlab.be/', email, password);
  const {accessToken, dpopKey} = await requestAccessToken('https://pod.playground.solidlab.be/.oidc/token', id, secret);
  const authFetch = await buildAuthenticatedFetch(fetch, accessToken, {dpopKey});
  const response = await authFetch(webid, {
    method: 'PATCH',
    body: `
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    @prefix schema: <http://schema.org/>.

    _:rename a solid:InsertDeletePatch;
      solid:inserts { <${webid}> schema:name "${name}". }.
    `,
    headers: {
      'content-type': 'text/n3'
    }
  });

  if (response.ok) {
    console.log(`Name of ${email} set to ${name}.`);
  } else {
    console.error(await response.text());
  }
}