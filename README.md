# NOTICE: CURRENTLY UNMAINTAINED

After returning two hubs to IKEA I removed all of their devices from my home (except for a stray E14 bulb for which couldn't find a replacement). Compared to similar devices on the market, I found Trådfri too unstable and unreliable. That was over a year ago, so things might have changed since then (or maybe I was just unlucky to begin with). I was planning on buying another hub just to address the issues but unfortunately haven't found time to do it. If anyone is interested, help would be welcome!

# node-red-contrib-node-tradfri

Node-RED node to interface with IKEA Tradfri lights without any external binaries thanks to [node-tradfri](https://github.com/AlCalzone/node-tradfri-client).
and
[node-red-contrib-node-tradfri](https://github.com/freahs/node-red-contrib-node-tradfri).

* All operations (brightness, color temperature, color, etc.) supported by the gateway are available.
* Support for observation (i.e. reporting on changes to the light and groups).

## Usage
Only one node (besides the config node) are necessary for operation. After the configuration has been successful -- either by providing an existing identity and PSK or by generating a new Identity and PSK by providing the security code from the gateway -- simply select which light to target and check if the node should observe the device as well. Its also possible to select [All devices] and control an entire group.

### Controlling the node
Nodes can be programmatically controlled by sending a message with `msg.payload` set to one of the following strings:
* `"status"` The node will output the current status of its target light.

### Controlling a light
Lights can be controlled by sending an objet with one or more of the following properties as `msg.payload` to the node.
* `onOff` `boolean` Turn the light on (`true`) or off (`false`).
* `dimmer` `number` `[0,100]` The brightness of the light.
* `colorTemperature` `number` `[0,100]` The color temperature of the light (cold white: `0`, warm white `100`).
* `color` `string` Sets the color of the light. For WS-bulbs, `F5FAF6`, `F1E0B5` and `EFD275` will set the light to the default cold, normal and warm temperatures respectively.
* `transition` `number` The default transition time for operations. Will only work for single operation commands and not for on/off. Defaults to 0. 
* `hue` `number` `[0,360]` Sets the hue of the light.
* `saturation` `number` `[0,100]` Sets the saturation of the light.

### Controlling a group
A group can be controlled by selecting [All devices] and sending an object with one or more of the following properties as `msg.payload` to the node.
* `dimmer` `number` The brightness in percent [0..100%].
* `onOff` `boolean` If the lightbulb is on (`true`) or off (`false`)
* `transitionTime` `number` The duration of state changes in seconds. Default 0.5s, not supported for on/off.
* `sceneId` `number` Set this to the instanceId of a scene (or "mood" as IKEA calls them), to activate it.

### Observing a light
If the node is set to observe it will send a message with the light's current properties as payload every time the light is updated:
* `name` `string` The name of this accessory as displayed in the app. Defaults to the model name.
* `createdAt` `number` The unix timestamp of the creation of the device. Unknown what this is exactly.
* `instanceId` `number` The ID under which the accessory is known to the gateway. Is used in callbacks throughout the library.
* `deviceInfo` `DeviceInfo{}` Some additional information about the device in form of a `DeviceInfo` object (see below)
* `alive` `boolean` Whether the gateway considers this device as alive.
* `lastSeen` `number` The unix timestamp of the last communication with the gateway.
* `lightList` `Light[]` An array of all lights belonging to this accessory in form of a `Light[]` array (see below).
* `otaUpdateState` `number` Unknown. Might be a boolean
`DeviceInfo` object
* `battery` `number` The battery percentage of a device. Only present if the device is battery-powered.
* `firmwareVersion` `string` The firmware version of the device
* `manufacturer` `string` The device manufacturer. Usually "IKEA of Sweden".
* `modelNumber` `string` The name/type of the device, e.g. "TRADFRI bulb E27 CWS opal 600lm"
* `power` `PowerSources` How the device is powered. One of the following enum values:
  * `Unknown (0)`
  * `InternalBattery (1)`
  * `ExternalBattery (2)`
  * `Battery (3)`

  Although not in the specs, this is apparently used by the remote
  * `PowerOverEthernet (4)`
  * `USB (5)`
  * `AC_Power (6)`
  * `Solar (7)`
* `serialNumber` `string` Not used currently. Always ""
`Lights` array
* `dimmer` `number` The brightness in percent [0..100%].
* `onOff` `boolean` If the lightbulb is on true or off false
* `transitionTime` `number` The duration of state changes in seconds. Default 0.5s, not supported for on/off.
* `isSwitchable` `boolean` Whether the lightbulb supports on/off.
* `isDimmable` `boolean` Whether the lightbulb supports setting the brightness.
* `spectrum` `"none" | "white" | "rgb"` The supported color spectrum of the lightbulb.
* `colorTemperature` `number` The color temperature in percent, where 0% equals cold white and 100% equals warm white.
* `color` `string` The 6 digit hex number representing the lightbulb's color. Don't use any prefixes like "#", only the hex number itself!
* `hue` `number` The color's hue [0..360°].
* `saturation` `number` The color's saturation [0..100%].

### Output
If the node is set to observe and the target light is updated or if triggered manually by sending a `"status"` request as `msg.payload` to the node, the node will send a `msg.payload` with the current status of the light.
* `id` `number` The id of the light.
* `name` `string` The given name of the light.
* `model` `string` The model of the light.
* `firmware` `string` The firmware of the light.
* `alive` `boolean` True if the gateway can communicate with the light, false if not.
* `on` `boolean` True if the light is on, false if not.
* `brightness` `number` `[0,100]` The brightness of the light.
* `colorTemperature` `number` `[0,100]` The color temperature of the light.
* `color` `string` The hex-code for the color of the light. Only fully supported by CWS bulbs.
* `colorX` `number` The x component of the xy-color.
* `colorY` `number` The y component of the xy-color.
* `transition` `number` The default transition time for operations. However, since the default value of 0.5 makes it impossible to send temperature and brightness updates in the same command, this is overridden and set to 0 by default.
* `created` `number` Probably when the light was paired with the gateway for the first time, measured in epoch time.
* `seen` `number` When the light was last interacted with by the gateway (or similar), measured in epoch time.
* `type` `number` The type of device where 2 is light.
* `power` `number` The type of power source powering the light. Will most likely always be 1.


## Installation
To install this repository in node red execute the following:

### Regular installation
Execute the following commands:
* `cd ~/.node-red` (depends where your node-red install directory is)
* `npm install git+https://github.com/flavorplus/node-red-contrib-node-tradfri.git`
* (re)start Node-red and the ["]tradfri] node should appear in the [function] list.

### Docker installation
Note: this has only been tested on a Synology NAS.
Execute the following commands:
* `docker exec -it nodered bash` (where nodered is the name of your running node red container)
* `cd /data`
* `npm install git+https://github.com/flavorplus/node-red-contrib-node-tradfri.git`

## Building
Make sure you have [gulp-cli] installed:
`npm install --global gulp-cli` (you might need to prefix it with `sudo ` in case of an error)

Enter the directory of this repository.

Install all (dev) dependancies with:
`npm install`

To clean, build and install, execute:
`gulp`

## Changelog

### 0.1.3
* Added group support and scenes
* A lot of re-writing and re-structuring
Please read the info in node-red carefully as the payload format changed.

### 0.1.2
* Moved output status object from `msg.payload.light` to `msg.payload`.
* Updated security code, identity and PSK to be saved as credentials in config.
* Updated info panels and tweaked node appearance.

### 0.1.1
* Published to NPM
