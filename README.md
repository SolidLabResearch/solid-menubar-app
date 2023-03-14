# Solid menubar app example

Important: I didn't clean this code or add any in-line documentation.

## Usage
1. Install dependencies via
   ```shell
   npm i
   ```
2. Copy config.example.json to config.json via
   ```shell
   cp config.example.json config.json
   ```
3. Edit config.json. See details below.
4. Start app via
   ```shell
   npm start
   ```
   
## Config file
The config file supports the following attributes:

- `webid`: your WebID
- `email`: email to log in to your pod/identity provider
- `password`: password to log in to your pod/identity provider
- `serverUrl`: url of your identify provider
- `icon`: path of the icon to show in the menubar
- `vacations`: array of vacation calendars with the properties `vacationUrl` and `webid`
- `vacations[*].vacationUrl`: url of a vacation calendar
- `vacations[*].webid`: WebID to whom the vacation calendar belongs

You find an example config file in `config.examnple.json`.

## Create playground pods and add calendars

You can create three pods for testing by doing the following steps:

1. Navigate to `pod-example-data` via `cd pod-example-data`.
2. Execute the script `create-example-pods.js` via `node create-example-pods.js`.

The details of the pods are

| Email          | Password | Identity provider                   | WebID                                                 | Calendar                                                        |
|----------------|----------|-------------------------------------|-------------------------------------------------------|-----------------------------------------------------------------|
| c1@example.com | `test`   | https://pod.playground.solidlab.be/ | https://pod.playground.solidlab.be/c1/profile/card#me | https://pod.playground.solidlab.be/c1/profile/vacation-calendar |
| c2@example.com | `test`   | https://pod.playground.solidlab.be/ | https://pod.playground.solidlab.be/c2/profile/card#me | https://pod.playground.solidlab.be/c2/profile/vacation-calendar |
| c3@example.com | `test`   | https://pod.playground.solidlab.be/ | https://pod.playground.solidlab.be/c3/profile/card#me | None                                                            |

You use `c3@example.com` as your account for logging in with the app.
This account is already configured in `pod-example-data/config.json`.
   
## Screenshot

![img.png](img.png)

## Launch a startup (macOS)

Follow these steps to launch the app a startup in macOS:

1. Copy `be.ugent.vacation.example.plist` to `~/Library/LaunchAgents/be.ugent.vacation.plist`.
2. Update paths to this directory in `~/Library/LaunchAgents/be.ugent.vacation.plist`.
3. Copy `run-launch.example.sh` to `run-launch.sh`.
4. Update the `PATH` variable in `run-launch.sh`.
5. Load app via `launchctl load be.ugent.vacation.plist`.