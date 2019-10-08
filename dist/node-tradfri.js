"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tradfri = require("node-tradfri-client");
module.exports = function (RED) {
    RED.httpAdmin.get('/tradfri', RED.auth.needsPermission('tradfri.read'), function (req, res) {
        // Get config node
        const node = RED.nodes.getNode(req.query.nodeId);
        if (!node) {
            res.json({
                error: true
            });
            return;
        }
        // Get current groups and lights
        const lights = node.getLights();
        const groups = node.getGroups();
        const scenes = node.getScenes();
        // Build data structure of groups with their lights
        const data = {};
        for (const id in groups) {
            const group = groups[id];
            data[id] = {
                id,
                name: group.name,
                lights: group.deviceIDs.reduce((result, deviceId) => {
                    if (lights[deviceId]) {
                        result[deviceId] = lights[deviceId].name;
                    }
                    return result;
                }, {}),
                scenes: scenes[id].reduce((result, scene) => {
                    result[scene.instanceId] = scene.name;
                    return result;
                }, {})
            };
        }
        RED.log.trace(`[Tradfri: API] Received API request from: '${req}' and answered succesfully.`);
        res.json({ data });
    });
    function TradfriConnectionNode(config) {
        var node = this;
        RED.nodes.createNode(node, config);
        node.name = config.name;
        node.address = config.address;
        if ((typeof node.credentials.identity === 'undefined' && typeof node.credentials.psk !== 'undefined') || (typeof node.credentials.identity !== 'undefined' && typeof node.credentials.psk === 'undefined')) {
            RED.log.error("Must provide both identity and PSK or leave both blank to generate new credentials from security code.");
        }
        if (typeof node.credentials.identity === 'undefined' && typeof node.credentials.psk === 'undefined' && typeof node.credentials.securityCode === 'undefined') {
            RED.log.error("Must provide either identity and PSK or a security code to connect to the Tradfri hub");
        }
        var _lights = {};
        let _groups = {};
        let _scenes = {};
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
        var _groupUpdatedCallback = (group) => {
            _groups[group.instanceId] = group;
            if (_listeners[group.instanceId]) {
                for (let nodeId in _listeners[group.instanceId]) {
                    _listeners[group.instanceId][nodeId](group);
                }
            }
        };
        var _sceneUpdatedCallback = (groupId, scene) => {
            if (!_scenes[groupId]) {
                _scenes[groupId] = [];
            }
            _scenes[groupId].push(scene);
        };
        let _setupClient = () => __awaiter(this, void 0, void 0, function* () {
            let loggerFunction = (message, severity) => {
                RED.log.trace(severity + ", " + message);
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
                client.on("group updated", _groupUpdatedCallback);
                client.on("scene updated", _sceneUpdatedCallback);
                client.observeDevices();
                client.observeGroupsAndScenes();
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
        node.getGroup = (instanceId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_groups[instanceId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                }
                else {
                    return _groups[instanceId];
                }
            }
            throw new Error('Group not available');
        });
        node.getLights = () => {
            return _lights;
        };
        node.getGroups = () => {
            return _groups;
        };
        node.getScenes = () => {
            return _scenes;
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
            if (_client != null) {
                _client.destroy();
                _client = null;
            }
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
        node.groupId = config.groupId;
        node.observe = config.observe;
        var _config = RED.nodes.getNode(config.connection);
        var _send = (payload) => {
            let msg = Object.assign({}, payload);
            delete msg.isProxy;
            delete msg.options;
            delete msg.type;
            delete msg.client;
            RED.log.trace(`[Tradfri: ${node.id}] recieved update for '${msg.name}' (${msg.instanceId})`);
            node.send({ topic: "tradfri", payload: msg });
        };
        var _handleStatus = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let payload;
                if (node.deviceId === '') {
                    payload = yield _config.getGroup(node.groupId);
                }
                else {
                    payload = yield _config.getLight(node.deviceId);
                }
                _send(payload);
                RED.log.trace(`[Tradfri: ${node.id}] Status request successful`);
            }
            catch (e) {
                RED.log.info(`[Tradfri: ${node.id}] Status request unsuccessful, '${e.toString()}'`);
            }
        });
        var _handleScenes = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let payload;
                payload = yield _config.getScene(node.groupId);
                _send(payload);
                RED.log.trace(`[Tradfri: ${node.id}] Scenes request successful`);
            }
            catch (e) {
                RED.log.info(`[Tradfri: ${node.id}] Scenes request unsuccessful, '${e.toString()}'`);
            }
        });
        var _handleOp = (payload) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Prepare operation
                if (!payload || Object.keys(payload).length === 0) {
                    return;
                }
                let operation = Object.assign({ transitionTime: 0 }, payload);
                let client = yield _config.getClient();
                // Group or light operation?
                let result;
                if (node.deviceId === '') {
                    const group = yield _config.getGroup(node.groupId);
                    result = yield client.operateGroup(group, operation, true);
                }
                else {
                    const light = yield _config.getLight(node.deviceId);
                    result = yield client.operateLight(light, operation);
                }
                RED.log.trace(`[Tradfri: ${node.id}] Operation '${JSON.stringify(operation)}' returned '${result}'`);
            }
            catch (e) {
                RED.log.info(`[Tradfri: ${node.id}] Operation '${JSON.stringify(payload)}' unsuccessful, '${e.toString()}'`);
            }
        });
        if (node.observe) {
            _config.register(node.id, node.groupId, _send);
            if (node.deviceId !== '') {
                _config.register(node.id, node.deviceId, _send);
            }
        }
        node.on('input', function (msg) {
            (() => __awaiter(this, void 0, void 0, function* () {
                if (msg.hasOwnProperty('payload')) {
                    if (msg.payload === "status") {
                        msg.payload = { status: true };
                    }
                    else if (msg.payload === "scenes") {
                        msg.payload = { scenes: true };
                    }
                    let isStatus = msg.payload.hasOwnProperty('status');
                    let isScenes = msg.payload.hasOwnProperty('scenes');
                    if (isStatus) {
                        _handleStatus();
                    }
                    else if (isScenes) {
                        _handleScenes();
                    }
                    else {
                        _handleOp(msg.payload);
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
