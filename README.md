# node-red-contrib-node-tradfri

Node-RED node to interface with IKEA Tradfri lights without any external binaries thanks to [node-tradfri](https://github.com/AlCalzone/node-tradfri-client).

* All operations (brightness, color temperature, color, etc.) supported by the gateway are available
* Support for observation (i.e. reporting on changes to the light).

## Usage
Only one node (besides the config node) are necessary for operation. After the configuration has been sucessfull -- either by providing an existing identity and PSK or by generating new ones by providing the security code from the gateway -- simply select which light to target and check if the node should observe the device as well.

### Controlling the node
Nodes can be programmatically controlled by sending a message with `msg.payload` set to one of the following strings:
* `"status"` The node will output the current status of its target light.

### Controlling the light
Lights can be controlled by sending an objet with one or more of the following properties as `msg.payload` to the node.
* `on` `boolean` Turn the light on or off.
* `brightness` `number` `[0,100]` The brightness of the light.
* `colorTemperature` `number` `[0,100]` The color temperature of the light.
* `color` `string` Sets the color of the light. For WS-bulbs, `F5FAF6`, `F1E0B5` and `EFD275` will set the light to the default cold, normal and warm temperatures respectively.
* `transition` `number` The default transition time for operations. Will only work for single operation commands and not for on/off. Defaults to 0. 
* `hue` `number` `[0,365]` Sets the hue of the light. Only for CWS. (UNTESTED)
* `saturation``number` `[0,100]` Sets the saturation of the light. Only for CWS. (UNTESTED)

### Output
If the node is set to observe and the target light is updated or if triggered manually by sending a `"status"` request as `msg.payload` to the node, the node will send a `msg.payload` for which the `light` property is the current status of the light.
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
