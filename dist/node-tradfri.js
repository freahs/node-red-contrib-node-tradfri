"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tradfri = require("node-tradfri-client");
module.exports = function (RED) {
    function lightFromAccessory(accessory) {
        return Object.assign({}, {
            id: accessory.instanceId,
            name: accessory.name,
            model: accessory.deviceInfo.modelNumber,
            firmware: accessory.deviceInfo.firmwareVersion,
            alive: accessory.alive,
            on: accessory.lightList[0].onOff,
            onTime: accessory.lightList[0].onTime,
            brightness: accessory.lightList[0].dimmer,
            colorTemperature: accessory.lightList[0].colorTemperature,
            color: accessory.lightList[0].color,
            hue: accessory.lightList[0].hue,
            saturation: accessory.lightList[0].saturation,
            colorX: accessory.lightList[0].colorX,
            colorY: accessory.lightList[0].colorY,
            transition: accessory.lightList[0].transitionTime,
            created: accessory.createdAt,
            seen: accessory.lastSeen,
            type: accessory.type,
            power: accessory.deviceInfo.power
        });
    }
    function toLightOperation(op) {
        let props = { on: "onOff", brightness: "dimmer", transition: "transitionTime" };
        for (let k in props) {
            if (op.hasOwnProperty(k)) {
                op[props[k]] = op[k];
                delete op[k];
            }
        }
        return op;
    }
    RED.httpAdmin.get("/tradfri/lights", RED.auth.needsPermission('tradfri.read'), function (req, res) {
        let nodeId = req.query.nodeId;
        if (nodeId != null) {
            let node = RED.nodes.getNode(nodeId);
            let lights = node.getLights();
            let ret = [];
            for (let k in lights) {
                ret.push({ name: lights[k].name, id: k });
            }
            res.json(JSON.stringify(ret));
        }
    });
    function TradfriConnectionNode(config) {
        var node = this;
        RED.nodes.createNode(node, config);
        node.name = config.name;
        node.address = config.address;
        if ((typeof node.credentials.identity === 'undefined' && typeof node.credentials.psk !== 'undefined') || (typeof node.credentials.identity !== 'undefined' && typeof node.credentials.psk === 'undefined')) {
            RED.log.error("Must provide both identity and PSK or leave both blank to generate new credentials from security code.");
        }
        if (node.credentials.identity == null && node.credentials.psk == null && node.credentials.securityCode == null) {
            RED.log.error("Must provide either identity and PSK or a security code to connect to the Tradfri hub");
        }
        var _lights = {};
        var _listeners = {};
        var _client = null;
        var _deviceUpdatedCallback = (accessory) => {
            if (accessory.type === tradfri.AccessoryTypes.lightbulb) {
                _lights[accessory.instanceId] = accessory;
            }
            if (_listeners[accessory.instanceId]) {
                for (let nodeId in _listeners[accessory.instanceId]) {
                    _listeners[accessory.instanceId][nodeId](accessory);
                }
            }
        };
        let _setupClient = () => __awaiter(this, void 0, void 0, function* () {
            let loggerFunction = (message, severity) => {
                RED.log.info(severity + ", " + message);
            };
            let client = new tradfri.TradfriClient(node.address);
            if (typeof node.credentials.identity === 'undefined' && typeof node.credentials.psk === 'undefined') {
                const { identity, psk } = yield client.authenticate(node.credentials.securityCode);
                node.credentials.securityCode = null;
                node.credentials.identity = identity;
                node.credentials.psk = psk;
                RED.nodes.addCredentials(node.id, node.credentials);
            }
            if (yield client.connect(node.credentials.identity, node.credentials.psk)) {
                RED.log.trace(`[Tradfri: ${node.id}] Connected using Identity:'${node.credentials.identity}' and PSK: '${node.credentials.psk}'`);
                client.on("device updated", _deviceUpdatedCallback);
                client.observeDevices();
                _client = client;
            }
            else {
                throw new Error(`Client not available`);
            }
        });
        let _reconnect = () => __awaiter(this, void 0, void 0, function* () {
            let timeout = 5000;
            if (_client != null) {
                _client.destroy();
                _client = null;
            }
            while (_client == null) {
                try {
                    yield _setupClient();
                }
                catch (e) {
                    RED.log.trace(`[Tradfri: ${node.id}] ${e.toString()}, reconnecting...`);
                }
                yield new Promise(resolve => setTimeout(resolve, timeout));
            }
        });
        let pingInterval = 30;
        let _ping = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                let client = yield node.getClient();
                let res = yield client.ping();
                RED.log.trace(`[Tradfri: ${node.id}] ping returned '${res}'`);
            }
            catch (e) {
                RED.log.trace(`[Tradfri: ${node.id}] ping returned '${e.toString()}'`);
            }
        }), pingInterval * 1000);
        _reconnect();
        node.getClient = () => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_client == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                }
                else {
                    return _client;
                }
            }
            throw new Error('Client not available');
        });
        node.getLight = (instanceId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_lights[instanceId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                }
                else {
                    return _lights[instanceId];
                }
            }
            throw new Error('Light not available');
        });
        node.getLights = () => {
            return _lights;
        };
        node.register = (nodeId, instanceId, callback) => {
            if (!_listeners[instanceId]) {
                _listeners[instanceId] = {};
            }
            _listeners[instanceId][nodeId] = callback;
            RED.log.info(`[Tradfri: ${nodeId}] registered event listener for ${instanceId}`);
        };
        node.unregister = (nodeId) => {
            for (let instanceId in _listeners) {
                if (_listeners[instanceId].hasOwnProperty(nodeId)) {
                    delete _listeners[instanceId][nodeId];
                    RED.log.info(`[Tradfri: ${nodeId}] unregistered event listeners`);
                }
            }
        };
        node.on('close', () => {
            clearInterval(_ping);
            _client.destroy();
            RED.log.debug(`[Tradfri: ${node.id}] Config was closed`);
        });
    }
    RED.nodes.registerType("tradfri-connection", TradfriConnectionNode, {
        credentials: {
            securityCode: { type: "text" },
            identity: { type: "text" },
            psk: { type: "text" }
        }
    });
    function TradfriNode(config) {
        var node = this;
        RED.nodes.createNode(node, config);
        node.name = config.name;
        node.deviceId = config.deviceId;
        node.deviceName = config.deviceName;
        node.observe = config.observe;
        var _config = RED.nodes.getNode(config.connection);
        var _prev = {};
        var _send = (payload) => {
            node.send({ topic: "tradfri", payload: payload });
        };
        var _getPayload = (accessory) => {
            let light = lightFromAccessory(accessory);
            light['prev'] = Object.assign({}, _prev);
            return light;
        };
        var _deviceUpdated = (accessory) => {
            let ret = _getPayload(accessory);
            _prev = lightFromAccessory(accessory);
            _send(ret);
            RED.log.trace(`[Tradfri: ${node.id}] recieved update for '${accessory.name}' (${accessory.instanceId})`);
        };
        var _getTargetId = (msg) => {
            let payload = msg.payload;
            if (payload.hasOwnProperty('id') && Array.isArray(payload.id)) {
                return payload.id;
            }
            else if (payload.hasOwnProperty('id')) {
                return [payload.id];
            }
            else if (node.deviceId > 0) {
                return [node.deviceId];
            }
            else {
                throw new Error('No valid target device');
            }
        };
        var _handleDirectStatus = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let client = yield _config.getClient();
                let res = yield client.request('15001/' + node.deviceId, 'get');
                _send(res);
            }
            catch (e) {
                _send(e);
            }
        });
        var _handleStatus = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let accessory = yield _config.getLight(node.deviceId);
                _send(_getPayload(accessory));
                RED.log.trace(`[Tradfri: ${node.id}] Status request successful`);
            }
            catch (e) {
                RED.log.info(`[Tradfri: ${node.id}] Status request unsuccessful, '${e.toString()}'`);
            }
        });
        var _handleDirectLightOp = (light) => __awaiter(this, void 0, void 0, function* () {
            let clamp = (num, min, max) => {
                return num <= min ? min : num >= max ? max : num;
            };
            let cmd = { 3311: [Object.assign({}, {
                        5851: clamp(light.brightness, 0, 254),
                        5711: clamp(light.colorTemperature, 200, 454),
                        5712: light.transition,
                        5850: light.on,
                        5707: light.hue,
                        5708: light.saturation,
                        5706: light.color // f5faf6, f1e0b5, efd275 are valid for WS bulbs
                    })] };
            try {
                let client = yield _config.getClient();
                let res = yield client.request('15001/' + node.deviceId, 'put', Object.assign({}, cmd));
                RED.log.trace(`[Tradfri: ${node.id}] DirectLightOp '${JSON.stringify(cmd)}' returned '${res}'`);
            }
            catch (e) {
                RED.log.info(`[Tradfri: ${node.id}] DirectLightOp '${JSON.stringify(cmd)}' unsuccessful, '${e.toString()}'`);
            }
        });
        var _handleLightOp = (light) => __awaiter(this, void 0, void 0, function* () {
            let lightOp = toLightOperation(light);
            if (!lightOp.hasOwnProperty('transitionTime')) {
                lightOp['transitionTime'] = 0;
            }
            try {
                let light = yield _config.getLight(node.deviceId);
                if (Object.keys(lightOp).length > 0) {
                    let client = yield _config.getClient();
                    let res = yield client.operateLight(light, lightOp);
                    RED.log.trace(`[Tradfri: ${node.id}] LightOp '${JSON.stringify(lightOp)}' returned '${res}'`);
                }
            }
            catch (e) {
                RED.log.info(`[Tradfri: ${node.id}] LightOp '${JSON.stringify(lightOp)}' unsuccessful, '${e.toString()}'`);
            }
        });
        if (node.observe) {
            _config.register(node.id, node.deviceId, _deviceUpdated);
        }
        node.on('input', function (msg) {
            (() => __awaiter(this, void 0, void 0, function* () {
                if (msg.hasOwnProperty('payload')) {
                    if (msg.payload === "status") {
                        msg.payload = { status: true };
                    }
                    let isDirect = msg.payload.hasOwnProperty('direct');
                    let isStatus = msg.payload.hasOwnProperty('status');
                    if (isDirect && isStatus) {
                        _handleDirectStatus();
                    }
                    else if (isStatus) {
                        _handleStatus();
                    }
                    else if (isDirect) {
                        _handleDirectLightOp(msg.payload);
                    }
                    else {
                        _handleLightOp(msg.payload);
                    }
                }
            }))();
        });
        node.on('close', function () {
            RED.log.debug(`[Tradfri: ${node.id}] Node was closed`);
            _config.unregister(node.id);
        });
    }
    RED.nodes.registerType("tradfri", TradfriNode);
};
