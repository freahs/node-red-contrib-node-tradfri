# node-red-contrib-node-tradfri

Node-RED node to interface with IKEA Tradfri lights without any external binaries thanks to [node-tradfri](https://github.com/AlCalzone/node-tradfri-client).
and
[node-red-contrib-node-tradfri](https://github.com/freahs/node-red-contrib-node-tradfri).

* All operations (brightness, color temperature, color, etc.) supported by the gateway are available.
* Support for observation (i.e. reporting on changes to the light and groups).

## Usage
Only one node (besides the config node) are necessary for operation. After the configuration has been successful -- either by providing an existing identity and PSK or by generating a new Identity and PSK by providing the security code from the gateway -- simply select which light to target and check if the node should observe the device as well. Its also possible to select [All devices] and control an entire group.

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
