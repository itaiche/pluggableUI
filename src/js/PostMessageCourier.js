;(function (root, factory) {
    "use strict";

    /* istanbul ignore if */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.EventsUtil", [], function () {
            return factory(root, root, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports);
    }
    /* istanbul ignore next  */
    else {
        // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, hide) {
    "use strict";

    function getListeners(lstnrs, eventName, appName) {
        var callBacks = [];
        if (lstnrs[eventName] && lstnrs[eventName].length) {
            for (var i = 0; i < lstnrs[eventName].length; i++) {
                if ((!appName || "*" === lstnrs[eventName][i].appName) ||//generic event // &&
                    lstnrs[eventName][i].appName === appName) {//Specific events for a named instance
                    callBacks.push(lstnrs[eventName][i]);
                }
            }
        }
        if (lstnrs["*"]) {
            for (var k = 0; k < lstnrs["*"].length; k++) {
                if ((!appName || "*" === lstnrs["*"][k].appName) ||//generic event // &&
                    lstnrs["*"][k].appName === appName) {//Specific events for a named instance
                    callBacks.push(lstnrs["*"][k]);
                }
            }
        }
        return callBacks;
    }

    /* istanbul ignore next  */
    function log(msg, level, app) {
        if (root && "function" === typeof root.log) {
            root.log(msg, level, app);
        }
    }

    /**
     * var eventObj = {
     *   unbindObj: unbindObj,
     *   attrName: "eventName",
     *   loggerName: "Events",
     *   lstnrs: {}
     * };
     */
    function unbind(eventObj) {
        var cmdName = eventObj.unbindObj[eventObj.attrName];
        var unBound = false;
        var updatedListeners;

        if (!eventObj.unbindObj) {
            log("CMD listen id not spec for unbind", "ERROR", eventObj.loggerName);
            return null;
        }

        if (typeof eventObj.unbindObj === "string") {//Data is of type commandId
            return _unregister(eventObj.lstnrs, eventObj.unbindObj);
        }
        else if (!eventObj.unbindObj.func && !eventObj.unbindObj.context && !eventObj.unbindObj.appName) {//No data passed in to help us find unbind
            return false;
        }

        var listeners = eventObj.lstnrs;
        if (cmdName) {
            listeners = {};
            listeners[cmdName] = eventObj.lstnrs[cmdName];
        }
        for (var key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                if (listeners[key] && listeners[key].length) {
                    updatedListeners = _unbind(listeners[key], eventObj.unbindObj.func, eventObj.unbindObj.context, eventObj.unbindObj.appName);
                    if (updatedListeners.length !== listeners[key].length) {
                        eventObj.lstnrs[key] = updatedListeners;
                        unBound = true;
                    }
                }
            }
        }
        return unBound;
    }

    /**
     * Clones objects and properties (everything except functions)
     * @param cloneObj - the object we want to clone
     * @return {Object}
     */
    function cloneEventData(cloneObj) {
        var resultObj = {};
        if (cloneObj.constructor === Object) {//If this is an object
            for (var key in cloneObj) {
                //noinspection JSUnfilteredForInLoop
                if (cloneObj.hasOwnProperty(key) && cloneObj[key] !== null && cloneObj[key] !== undefined) {//Make sure we have some data that's object specific
                    //noinspection JSUnfilteredForInLoop
                    if (typeof cloneObj[key] === "object" && cloneObj[key].constructor !== Array) {
                        //noinspection JSUnfilteredForInLoop
                        resultObj[key] = cloneEventData(cloneObj[key]);
                    }
                    else { //noinspection JSUnfilteredForInLoop
                        if (cloneObj[key].constructor === Array) {
                            //noinspection JSUnfilteredForInLoop
                            resultObj[key] = cloneObj[key].slice(0) || [];
                        }
                        else { //noinspection JSUnfilteredForInLoop
                            if (typeof cloneObj[key] !== "function") {
                                //noinspection JSUnfilteredForInLoop
                                resultObj[key] = cloneObj[key] !== null && cloneObj[key] !== undefined ? cloneObj[key] : "";
                            }
                        }
                    }
                }
            }
        } else {//Return copy of Array or primitive type in case of no Object
            if (cloneObj.constructor === Array) {
                resultObj = cloneObj.slice(0) || [];
            }
            else if (typeof cloneObj !== "function") {
                resultObj = cloneObj;
            }
        }
        return resultObj;
    }

    function hasFired(fired, app, evName) {
        if ((typeof (evName) === "undefined" || evName === "*") && app === "*") {
            return fired;
        }
        var firedEvents = [];
        for (var n = 0; n < fired.length; n++) {
            if (fired[n].eventName === evName || evName === "*") {
                if ((app && app === fired[n].appName) ||//For events specific to a caller
                    (!fired[n].appName || fired[n].appName === "*") || app === "*") { //For all events that don't have a specific appName
                    firedEvents.push(fired[n]);
                }
            }
        }
        return firedEvents;
    }

    /**
     * Stores events so we can later ask for them, can be set to a limited store by defaults on instantiation
     * @param data = {
     *  triggerData: triggerData,
     *  eventBufferLimit: eventBufferLimit,
     *  attrName: attrName,
     *  fired: fired,
     *  index: index
     * }
     */
    function storeEventData(data) {
        //noinspection JSUnresolvedVariable
        if (data.eventBufferLimit === 0 || (data.triggerData.data && !!data.triggerData.data.doNotStore)) {//No events should be stored or this event should not be stored
            data = null;
            return;
        }
        var firedEventData = {eventName: data.triggerData[data.attrName], appName: data.triggerData.appName};
        firedEventData.data = data.triggerData.passDataByRef ? data.triggerData.data : cloneEventData(data.triggerData.data);
        if (data.eventBufferLimit > 0) {//Limiting Array size to what was decided on creation
            if (data.index >= data.eventBufferLimit) {
                data.index = 0;
            }
            data.fired[data.index] = firedEventData;
            data.index++;
        }
        else {//All events should be stored
            data.fired.push(firedEventData);
        }
        data = null;
    }

    function _unregister(lstnrs, eventId) {
        var unBound = false;
        if (!eventId) {
            log("Ev listen id not spec for unregister", "ERROR", "Events");
            return null;
        }
        for (var eventName in lstnrs) {
            if (lstnrs.hasOwnProperty(eventName)) {
                for (var i = 0; i < lstnrs[eventName].length; i++) {
                    if (lstnrs[eventName][i].id == eventId) {
                        lstnrs[eventName].splice(i, 1);
                        log("Ev listen=" + eventId + " and name=" + eventName + " unregister", "DEBUG", "Events");
                        unBound = true;
                        break;
                    }
                }
            }
        }
        if (!unBound) {
            log("Ev listen not found " + eventId + " unregister", "DEBUG", "Events");
        }
        return unBound;
    }

    /**
     * The actual unbinding of the callbacks from the events mechanism
     * @param listeners - the array of listeners that match this query
     * @param func - the function we want to unbind
     * @param context - the context we want to unbind
     * @param appName - the specific appName we want to unbind (UID)
     * @return {Array} - the new array of listeners we want to use
     */
    function _unbind(listeners, func, context, appName) {
        var newListeners = [];
        if (listeners && listeners.length) {
            for (var i = 0; i < listeners.length; i++) {
                try {
                    var sameFunc = (!context && listeners[i].func === func);//If this fits the function and no context was passed
                    var sameContext = (!func && context && listeners[i].context === context);//If this fits the context and no function was passed
                    var sameFuncAndContext = (func && context && listeners[i].func === func && listeners[i].context === context);//if this fits the function and context
                    var hasSameAppName = (appName && appName === listeners[i].appName);//If we're unbinding a specific appName
                    var hasGlobalAppName = (listeners[i].appName === "*");//If we're unbinding a general appName
                    if ((sameFunc || sameContext || sameFuncAndContext)) {
                        if (hasSameAppName || hasGlobalAppName) {
                            continue;//This is a callback to remove
                        }
                        if (sameContext) {
                            continue;
                        }
                    }
                    else if (!func && !context && hasSameAppName) {//This should only happen if nothing but an appName was passed in
                        continue;//This is a callback to remove
                    }
                    newListeners.push(listeners[i]);//This is callbacks we keep
                } catch (err) {
                    log("Error in unbind e=" + err.message, "ERROR", "Events");
                }
            }
        }
        return newListeners;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    var ret = {
        getListeners: getListeners,
        log: log,
        unbind: unbind,
        hasFired: hasFired,
        cloneEventData: cloneEventData,
        storeEventData: storeEventData
    };
    if (!hide) {
        exports.EventsUtil = exports.EventsUtil || ret;
    }
    return ret;
}));

;(function (root, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.Events", ["Chronos.EventsUtil"], function (EventsUtil) {
            return factory(root, root, EventsUtil, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./util/EventsUtil").EventsUtil);
    }
    /* istanbul ignore next  */
    else {
        /**
         * @depend ./util/EventsUtil.js
         */
        // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.EventsUtil);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, evUtil, hide) {
    "use strict";

    function Events(defaults) {
        var appName = "Events",
            attrName = "eventName",
            eventId = 0,
            lstnrs = {},
            fired = [],
            prefix = "evId_",
            indexer = 0,
            cloneData,
            eventBufferLimit,
            defaultAppName;

        defaultAppName = defaults && defaults.appName || "*";
        cloneData = (defaults && typeof defaults.cloneEventData === "boolean" ? defaults.cloneEventData : false);
        eventBufferLimit = (defaults && !isNaN(defaults.eventBufferLimit) ? defaults.eventBufferLimit : -1);

        /**
         * This registers to an event only once, if it has fired the bind will be removed
         * @param data
         * @return {*}
         */
        function once(data) {
            if (data) {
                data.triggerOnce = true;
                return bind(data);
            } else {
                return null;
            }
        }

        /**
         * This function allows registering for events with the following structure:
         * @param app = {
         *   eventName: string that is the name of the event that will be triggered like 'click'
         *   aSync: boolean flag if this call back is called synchronously when the event fires, or after we queue all the listeners
         *   appName: string that specifies an added identifier for multiple instances of the same event name (click by button1, click by button 2)
         *   func: function - the callback function which the event data will be passed to
         *   context: the context which the event data will be run with
         *   triggerOnce: this is for listening only to the first trigger of this event
         *   } || app = app name
         *
         * @param ev = event name
         * @param fn = callback function
         * @return {*}
         */
        function bind(app, ev, fn) {
            var evData = app;

            if ("string" === typeof app) {
                evData = {
                    appName: app,
                    eventName: ev,
                    func: fn
                };
            }

            evData.appName = evData.appName || defaultAppName;
            if ("*" !== defaultAppName) {
                if ("string" === typeof app && ("function" === typeof ev || "undefined" === typeof ev)) {
                    evData.eventName = app;
                }
            }

            if (!evData.eventName || !evData.func || ("function" !== typeof evData.func && evData.func.constructor !== Array)) {
                evUtil.log("Ev listen has invalid params: evName=[" + evData.eventName + "]", "ERROR", "Events");
                return null;
            }
            if (evData.func.constructor === Array) {
                var evIds = [], cloneEvent, cloneId;
                for (var i = 0; i < evData.func.length; i++) {
                    cloneEvent = evUtil.cloneEventData(evData);
                    cloneEvent.func = evData.func[i];
                    cloneId = bind(cloneEvent);
                    evIds.push(cloneId);
                }
                return evIds;
            }
            var evId = prefix + (eventId++);
            var newObj = {
                id: evId,
                func: evData.func,
                context: evData.context || null,
                aSync: evData.aSync ? true : false,
                appName: evData.appName,
                triggerOnce: evData.triggerOnce || false
            };
            lstnrs[evData.eventName] = lstnrs[evData.eventName] || [];
            lstnrs[evData.eventName].push(newObj);
            evUtil.log("Ev listen rgstr: evName=[" + evData.eventName + "] aSync=" + newObj.aSync + " appName=" + newObj.name, "DEBUG", "Events");
            evData = null;
            app = null;
            return evId;
        }

        /**
         * This function allows unbinding according to a permutation of the three parameters
         * @param unbindObj
         * eventName - the eventName you want to unbind
         * func - the pointer to the function you want to unbind
         * context - the context you want to unbind
         * appName - the specific appName we want to unbind
         * OR - eventId
         * @return {Boolean}
         */
        function unbind(unbindObj) {
            if ("*" !== defaultAppName) {
                unbindObj.appName = unbindObj.appName || defaultAppName;
            }
            return evUtil.unbind({
                unbindObj: unbindObj,
                attrName: attrName,
                loggerName: appName,
                lstnrs: lstnrs
            });
        }

        /**
         * firedEventData can pass two request parameters
         * @param app name
         * @param evName = event name
         * @return {Array}
         */
        function hasFired(app, evName) {
            if ("undefined" === typeof evName) {
                evName = app;
                app = defaultAppName;
            }

            return evUtil.hasFired(fired, app, evName);
        }

        /**
         * This publishes/triggers an event
         * @param app = {
         *  eventName - the name of the event triggered
         *  appName - optional specifies the identifier it is bound to
         *  passDataByRef: boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         *  data - optional event parameters to be passed to the listeners
         *  } || app name
         *  @param evName = event name
         *  @param data = event data
         * @return {*}
         */
        function trigger(app, evName, data) {
            var triggerData = app;
            if ("string" === typeof app) {
                triggerData = {
                    eventName: evName,
                    appName: app,
                    data: data
                };
            }
            if ("*" !== defaultAppName) {
                triggerData.appName = triggerData.appName || defaultAppName;
                if ("string" === typeof app && ("object" === typeof evName || "undefined" === typeof evName)) {
                    triggerData.eventName = app;
                }
            }
            if (!triggerData || typeof (triggerData.eventName) === "undefined") {
                evUtil.log("Ev name not spec for publish", "ERROR", "Events");
                triggerData = null;
                return null;
            }
            triggerData.passDataByRef = triggerData.passDataByRef || !cloneData;
            _storeEventData(triggerData);

            var callBacks = evUtil.getListeners(lstnrs, triggerData.eventName, triggerData.appName);

            if (callBacks.length > 0) {
                for (var j = 0; j < callBacks.length; j++) {
                    var eventData = triggerData.passDataByRef ? triggerData.data : evUtil.cloneEventData(triggerData.data);//Clone the event data if there was not an explicit request to passByRef
                    var eventInformation = {appName: triggerData.appName, eventName: triggerData.eventName};
                    var callBack = callBacks[j];
                    if (callBack.aSync || (eventData && eventData.aSync)) {
                        setTimeout(_createCallBack(callBack, eventData, eventInformation), 0);
                    } else {
                        _createCallBack(callBack, eventData, eventInformation)();
                    }
                }
            }
            triggerData = null;
            return (callBacks.length > 0);
        }

        //------------------- Private methods ------------------------------//

        function _createCallBack(callBack, callBackEventData, triggerInformation) {
            return function () {
                try {
                    callBack.func.call(callBack.context, callBackEventData, triggerInformation);
                    callBackEventData = null;//Delete local pointer
                    if (callBack.triggerOnce) {
                        unbind(callBack);
                    }
                    callBack = null;
                } catch (err) {
                    //noinspection JSUnresolvedVariable
                    evUtil.log("Error executing " + triggerInformation.eventName + " eventId: " + callBack.id + "e=" + err.message, "ERROR", "Events");
                }
            };
        }

        /**
         * Stores events so we can later ask for them, can be set to a limited store by defaults on instantiation
         * @param triggerData
         */
        function _storeEventData(triggerData) {
            evUtil.storeEventData({
                triggerData: triggerData,
                eventBufferLimit: eventBufferLimit,
                attrName: attrName,
                fired: fired,
                index: indexer
            });
        }


        this.once = once;
        this.hasFired = hasFired;
        this.trigger = trigger;
        this.publish = trigger;
        this.bind = bind;
        this.register = bind;
        this.unbind = unbind;
        this.unregister = unbind;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.Events = exports.Events || Events;
    }
    return Events;
}));

;(function (root, factory) {
    "use strict";

    /* istanbul ignore if */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.CommandsUtil", ["Chronos.EventsUtil"], function (EventsUtil) {
            return factory(root, root, EventsUtil, true);

        });
        return;
    }
    //</amd>
    /* istanbul ignore next */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./EventsUtil").EventsUtil);
    }
    /* istanbul ignore next  */
    else {
        /**
         * @depend ./EventsUtil.js
         */
            // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.EventsUtil);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, evUtil, hide) {
    "use strict";

    /**
     * var cmdObj = {
     *   cmd: cmd,
     *   attrName: "cmdName",
     *   loggerName: "Commands",
     *   prefix: "_somePrefix",
     *   id: commandId,
     *   lstnrs: {}
     * };
     */
    function bind(cmdObj) {
        var cmdName = cmdObj.cmd[cmdObj.attrName];

        if (!cmdName || !cmdObj.cmd.func || "function" !== typeof cmdObj.cmd.func || !valid(cmdObj.cmd, cmdName)) {
            evUtil.log("comply: has invalid params: command=[" + cmdName + "]", "ERROR", cmdObj.loggerName);
            return null;
        }
        if (cmdObj.lstnrs[cmdName] && cmdObj.lstnrs[cmdName].length) {
            evUtil.log("comply: cannot comply because command already exist command=" + cmdName, "ERROR", cmdObj.loggerName);
            return null;
        }
        var cmdId = cmdObj.prefix + (cmdObj.id++);
        var newObj = {
            id: cmdId,
            func: cmdObj.cmd.func,
            context: cmdObj.cmd.context || null,
            appName: cmdObj.cmd.appName
        };

        cmdObj.lstnrs[cmdName] = cmdObj.lstnrs[cmdName] || [];
        cmdObj.lstnrs[cmdName].push(newObj);
        evUtil.log("Cmd comply: evName=[" + cmdName + "] appName=" + newObj.appName, "DEBUG", cmdObj.loggerName);
        return cmdId;
    }

    function valid(cmd, name) {
        return !((name && name === "*") || (cmd.appName && cmd.appName === "*"));
    }

    // attach properties to the exports object to define
    // the exported module properties.
    var ret = {
        bind: bind,
        valid: valid
    };
    if (!hide) {
        exports.CommandsUtil = exports.CommandsUtil || ret;
    }
    return ret;
}));

;(function (root, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.Commands", ["Chronos.EventsUtil", "Chronos.CommandsUtil"], function (EventsUtil, CommandsUtil) {
            return factory(root, root, EventsUtil, CommandsUtil, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./util/EventsUtil").EventsUtil, require("./util/CommandsUtil").CommandsUtil);
    }
    /* istanbul ignore next  */
    else {
        /**
         * @depend ./util/EventsUtil.js
         * @depend ./util/CommandsUtil.js
         */
        // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.EventsUtil, root.Chronos.CommandsUtil);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, evUtil, cmdUtil, hide) {
    "use strict";

    function Commands(defaults) {
        var appName = "Commands",
            attrName = "cmdName",
            commandId = 0,
            commands = {},
            fired = [],
            prefix = "cmdId_",
            indexer = 0,
            cloneData,
            eventBufferLimit,
            defaultAppName;

        defaultAppName = defaults && defaults.appName || "*";
        cloneData = (defaults && typeof defaults.cloneEventData === "boolean" ? defaults.cloneEventData : false);
        eventBufferLimit = (defaults && !isNaN(defaults.eventBufferLimit) ? defaults.eventBufferLimit : -1);

        /**
         * This function allows registering for command with the following structure:
         * @param cmd = {
         *   cmdName: string that is the name of the event that will be triggered like 'get'
         *   appName: string that specifies an added identifier for multiple instances of the same event name (click by button1, click by button 2)
         *   func: function - the callback function which the event data will be passed to
         *   context: the context which the event data will be run with
         *   }
         *
         * @return {String} - command Id.
         */
        function comply(cmd) {
            if ("*" !== defaultAppName) {
                cmd.appName = cmd.appName || defaultAppName;
            }
            return cmdUtil.bind({
                cmd: cmd,
                attrName: attrName,
                loggerName: appName,
                prefix: prefix,
                id: commandId,
                lstnrs: commands
            });
        }

        /**
         * This function allows unbinding according to a permutation of the three parameters
         * @param unbindObj
         * cmdName - the eventName you want to unbind
         * func - the pointer to the function you want to unbind
         * context - the context you want to unbind
         * appName - the specific appName we want to unbind
         * OR - commandId
         * @return {Boolean} - has stopped complying.
         */
        function stopComplying(unbindObj) {
            if ("*" !== defaultAppName) {
                unbindObj.appName = unbindObj.appName || defaultAppName;
            }
            return evUtil.unbind({
                unbindObj: unbindObj,
                attrName: attrName,
                loggerName: appName,
                lstnrs: commands
            });
        }

        /**
         * firedEventData can pass two request parameters
         * @param app name
         * @param cmdName = command name
         * @return {Array}
         */
        function hasFired(app, cmdName) {
            if ("undefined" === typeof cmdName) {
                cmdName = app;
                app = defaultAppName;
            }

            return evUtil.hasFired(fired, app, cmdName);
        }

        /**
         * This triggers a command
         * @param cmd = {
         *  cmdName - the name of the command triggered
         *  appName - optional specifies the identifier it is bound to
         *  passDataByRef: boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         *  data - optional event parameters to be passed to the listeners
         *  }
         *
         * @param cb - optional callback to notify when finished
         * @return {*}
         */
        function command(cmd, cb) {
            if (!cmd || typeof (cmd.cmdName) === "undefined" || !cmdUtil.valid(cmd, cmd.cmdName)) {
                evUtil.log("CMD name not spec for command", "ERROR", "Commands");
                return null;
            }
            if ("*" !== defaultAppName) {
                cmd.appName = cmd.appName || defaultAppName;
            }
            cmd.passDataByRef = cmd.passDataByRef || !cloneData;
            _storeEventData(cmd);
            if (!commands[cmd.cmdName]) {
                return false;
            }
            var callBacks = evUtil.getListeners(commands, cmd.cmdName, cmd.appName);

            if (callBacks.length > 0) {
                for (var j = 0; j < callBacks.length; j++) {
                    var cmdData = cmd.passDataByRef ? cmd.data : evUtil.cloneEventData(cmd.data);//Clone the event data if there was not an explicit request to passByRef
                    var callBack = callBacks[j];

                    try {
                        if ("function" === typeof cb) {
                            callBack.func.call(callBack.context, cmdData, cb);
                        } else {
                            callBack.func.call(callBack.context, cmdData);
                        }
                        cmdData = null;//Delete local pointer
                        callBack = null;
                    } catch (err) {
                        if ("function" === typeof cb) {
                            try {
                                cb(err);
                            } catch (e) {
                                evUtil.log("Error executing callback on error, " +cmd.cmdName + " commandId: " + callBack.id + "e=" + e.message, "ERROR", "Commands");
                            }
                        }
                        //noinspection JSUnresolvedVariable
                        evUtil.log("Error executing " + cmd.cmdName + " commandId: " + callBack.id + "e=" + err.message, "ERROR", "Commands");
                    }
                }
            }
            return (callBacks.length > 0);
        }

        //------------------- Private methods ------------------------------//

        /**
         * Stores commands so we can later ask for them, can be set to a limited store by defaults on instantiation
         * @param triggerData
         */
        function _storeEventData(triggerData) {
            evUtil.storeEventData({
                triggerData: triggerData,
                eventBufferLimit: eventBufferLimit,
                attrName: attrName,
                fired: fired,
                index: indexer
            });
        }

        this.hasFired = hasFired;
        this.comply = comply;
        this.stopComplying = stopComplying;
        this.command = command;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.Commands = exports.Commands || Commands;
    }
    return Commands;
}));

;(function (root, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.Reqres", ["Chronos.EventsUtil", "Chronos.CommandsUtil"], function (EventsUtil, CommandsUtil) {
            return factory(root, root, EventsUtil, CommandsUtil, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./util/EventsUtil").EventsUtil, require("./util/CommandsUtil").CommandsUtil);
    }
    /* istanbul ignore next  */
    else {
        /**
         * @depend ./util/EventsUtil.js
         * @depend ./util/CommandsUtil.js
         */
        // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.EventsUtil, root.Chronos.CommandsUtil);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, evUtil, cmdUtil, hide) {
    function ReqRes(defaults) {
        var appName = "ReqRes",
            attrName = "reqName",
            requestId = 0,
            requests = {},
            fired = [],
            prefix = "reqId_",
            indexer = 0,
            cloneData,
            eventBufferLimit,
            defaultAppName;

        defaultAppName = defaults && defaults.appName || "*";
        cloneData = (defaults && typeof defaults.cloneEventData === "boolean" ? defaults.cloneEventData : false);
        eventBufferLimit = (defaults && !isNaN(defaults.eventBufferLimit) ? defaults.eventBufferLimit : -1);

        /**
         * This function allows registering for command with the following structure:
         * @param req = {
         *   reqName: string that is the name of the event that will be triggered like 'get'
         *   appName: string that specifies an added identifier for multiple instances of the same event name (click by button1, click by button 2)
         *   func: function - the callback function which the event data will be passed to
         *   context: the context which the event data will be run with
         *   }
         *
         * @return {String} - command Id.
         */
        function reply(req) {
            if ("*" !== defaultAppName) {
                req.appName = req.appName || defaultAppName;
            }
            return cmdUtil.bind({
                cmd: req,
                attrName: attrName,
                loggerName: appName,
                prefix: prefix,
                id: requestId,
                lstnrs: requests
            });
        }

        /**
         * This function allows unbinding according to a permutation of the three parameters
         * @param unbindObj
         * reqName - the eventName you want to unbind
         * func - the pointer to the function you want to unbind
         * context - the context you want to unbind
         * appName - the specific appName we want to unbind
         * OR - requestId
         * @return {Boolean} - has stopped complying.
         */
        function stopReplying(unbindObj) {
            if ("*" !== defaultAppName) {
                unbindObj.appName = unbindObj.appName || defaultAppName;
            }
            return evUtil.unbind({
                unbindObj: unbindObj,
                attrName: attrName,
                loggerName: appName,
                lstnrs: requests
            });
        }

        /**
         * firedEventData can pass two request parameters
         * @param app name
         * @param reqName = command name
         * @return {Array}
         */
        function hasFired(app, reqName) {
            if ("undefined" === typeof reqName) {
                reqName = app;
                app = defaultAppName;
            }

            return evUtil.hasFired(fired, app, reqName);
        }

        /**
         * This triggers a command
         * @param req = {
         *  reqName - the name of the command triggered
         *  appName - optional specifies the identifier it is bound to
         *  passDataByRef: boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         *  data - optional event parameters to be passed to the listeners
         *  }
         *  @param cb - optional callback to notify when finished
         * @return {*}
         */
        function request(req, cb) {
            var ret;
            if (!req || typeof (req.reqName) === "undefined" || !cmdUtil.valid(req, req.reqName)) {
                evUtil.log("request: name not spec for command", "ERROR", "ReqRes");
                throw new Error("Invalid request object");
            }
            if ("*" !== defaultAppName) {
                req.appName = req.appName || defaultAppName;
            }
            req.passDataByRef = req.passDataByRef || !cloneData;
            _storeEventData(req);
            if (!requests[req.reqName]) {
                return ret; //return undefined
            }
            var callBacks = evUtil.getListeners(requests, req.reqName, req.appName);

            if (callBacks.length > 0) {
                for (var j = 0; j < callBacks.length; j++) {
                    var reqData = req.passDataByRef ? req.data : evUtil.cloneEventData(req.data);//Clone the event data if there was not an explicit request to passByRef
                    var requestInformation = {appName: req.appName, reqName: req.reqName};
                    var callBack = callBacks[j];

                    try {
                        if ("function" === typeof cb) {
                            ret = callBack.func.call(callBack.context, reqData, cb);
                        } else {
                            ret = callBack.func.call(callBack.context, reqData);
                        }
                        reqData = null;//Delete local pointer
                        callBack = null;
                    } catch (err) {
                        if ("function" === typeof cb) {
                            try {
                                cb(err);
                            } catch (e) {
                                evUtil.log("Error executing callback on error, " + requestInformation.reqName + " requestId: " + callBack.id + "e=" + e.message, "ERROR", "ReqRes");
                            }
                        }
                        //noinspection JSUnresolvedVariable
                        evUtil.log("Error executing " + requestInformation.reqName + " requestId: " + callBack.id + "e=" + err.message, "ERROR", "ReqRes");
                    }
                }
            }
            return ret;
        }

        //------------------- Private methods ------------------------------//

        /**
         * Stores requests so we can later ask for them, can be set to a limited store by defaults on instantiation
         * @param triggerData
         */
        function _storeEventData(triggerData) {
            evUtil.storeEventData({
                triggerData: triggerData,
                eventBufferLimit: eventBufferLimit,
                attrName: attrName,
                fired: fired,
                index: indexer
            });
        }

        this.hasFired = hasFired;
        this.request = request;
        this.reply = reply;
        this.stopReplying = stopReplying;

    }

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.ReqRes = exports.ReqRes || ReqRes;
    }
    return ReqRes;
}));

// Just a very dumb proxy wrapper to unify
// all events mechanisms inside a single
// channel proxy wrapper
;(function (root, factory) {
    "use strict";
    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.Channels", ["Chronos.Events", "Chronos.Commands", "Chronos.Reqres"], function (Events, Commands, Reqres) {
            return factory(root, root, Events, Commands, Reqres, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./Events").Events, require("./Commands").Commands, require("./Reqres").ReqRes);
    }
    /* istanbul ignore next  */
    else {
        /**
         * @depend ./Events.js
         * @depend ./Commands.js
         * @depend ./Reqres.js
         */
        // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.Events, root.Chronos.Commands, root.Chronos.ReqRes);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, Events, Commands, ReqRes, hide) {
    function Channels(options) {
        options = options || {};

        var externalAPIS = [];

        var events = options.events || new Events(options.config && options.config.events);
        var commands = options.commands || new Commands(options.config && options.config.commands);
        var reqres = options.reqres || new ReqRes(options.config && options.config.reqres);

        this.once = events.once;
        this.hasFiredEvents = events.hasFired;
        this.trigger = events.trigger;
        this.publish = events.publish;
        this.bind = events.bind;
        this.register = events.register;
        this.unbind = events.unbind;
        this.unregister = events.unregister;
        this.hasFiredCommands = commands.hasFired;
        this.comply = commands.comply;
        this.stopComplying = commands.stopComplying;
        this.command = commands.command;
        this.hasFiredReqres = reqres.hasFired;
        this.request = reqres.request;
        this.reply = reqres.reply;
        this.stopReplying = reqres.stopReplying;

        if (options.externalProxy === true) {
            this.trigger = _wrapCalls({
                func: events.trigger,
                context: events,
                triggerType: "trigger"
            });
            this.publish = _wrapCalls({
                func: events.publish,
                context: events,
                triggerType: "trigger"
            });
            this.registerProxy = registerProxy;
        }

        /**
         * Wraps API calls to trigger other registered functions
         * @param options
         * @returns {Function}
         * @private
         */
        function _wrapCalls(options){
            return function(){
                var api;

                options.func.apply(options.context, Array.prototype.slice.call(arguments, 0));

                for (var i = 0; i < externalAPIS.length; i++) {
                    api = externalAPIS[i];
                    if (api[options.triggerType]) {
                        try {
                            api[options.triggerType].apply(api.context,Array.prototype.slice.call(arguments, 0));
                        }
                        catch (exc) {}
                    }
                }
            };
        }

        /**
         * Registers external proxy for trigger of events
         * @param external
         */
        function registerProxy(external){
            if (typeof external === 'object' && external.trigger) {
                externalAPIS.push(external);
            }
        }
    }

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.Channels = exports.Channels || Channels;
    }
    return Channels;
}));

;(function (root, factory) {
    "use strict";

    /* istanbul ignore if */
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("CircuitBreaker", ["exports"], function () {
            if (!root.CircuitBreaker) {
                factory(root);
            }

            return root.CircuitBreaker;
        });

        return;
    }
    //</amd>
    /* istanbul ignore else */
    if ("object" === typeof exports) {
        // CommonJS
        factory(exports);
    }
    else {
        factory(root);
    }
}(typeof CircuitRoot === "undefined" ? this : CircuitRoot , function (root) {
    "use strict";

    /*jshint validthis:true */
    /**
     * @type {{OPEN: number, HALF_OPEN: number, CLOSED: number}}
     * State representation for the circuit
     */
    var STATE = {
        OPEN: 0,
        HALF_OPEN: 1,
        CLOSED: 2
    };

    /**
     * @type {{FAILURE: string, SUCCESS: string, TIMEOUT: string, OUTAGE: string}}
     * Measure types for each bucket
     */
    var MEASURE = {
        FAILURE: "failure",
        SUCCESS: "success",
        TIMEOUT: "timeout",
        OUTAGE: "outage"
    };

    /**
     * CircuitBreaker constructor
     * @constructor
     * @param {Object} [options] the configuration options for the instance
     * @param {Number} [options.slidingTimeWindow = 30000] - the time window that will be used for state calculations [milliseconds]
     * @param {Number} [options.bucketsNumber = 10] - the number of the buckets that the time window will be split to (a bucket is a sliding unit that is added/remove from the time window)
     * @param {Number} [options.tolerance = 50] - the tolerance before opening the circuit in percentage
     * @param {Number} [options.calibration = 5] - the calibration of minimum calls before starting to validate measurements [number]
     * @param {Number} [options.timeout = 0] - optional timeout parameter to apply and time the command [number]
     * @param {Function} [options.onopen] - handler for open
     * @param {Function} [options.onclose] - handler for close
     */
    function CircuitBreaker(options) {
        // For forcing new keyword
        if (false === (this instanceof CircuitBreaker)) {
            return new CircuitBreaker(options);
        }

        this.initialize(options);
    }

    CircuitBreaker.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} [options] the configuration options for the instance
         * @param {Number} [options.slidingTimeWindow = 30000] - the time window that will be used for state calculations [milliseconds]
         * @param {Number} [options.bucketsNumber = 10] - the number of the buckets that the time window will be split to (a bucket is a sliding unit that is added/remove from the time window)
         * @param {Number} [options.tolerance = 50] - the tolerance before opening the circuit in percentage
         * @param {Number} [options.calibration = 5] - the calibration of minimum calls before starting to validate measurements [number]
         * @param {Number} [options.timeout = 0] - optional timeout parameter to apply and time the command [number]
         * @param {Function} [options.onopen] - handler for open
         * @param {Function} [options.onclose] - handler for close
         */
        function initialize(options) {
            if (!this.initialized) {
                options = options || {};

                this.slidingTimeWindow = !isNaN(options.slidingTimeWindow) && 0 < options.slidingTimeWindow ? parseInt(options.slidingTimeWindow, 10) : 30000;
                this.bucketsNumber = !isNaN(options.bucketsNumber) && 0 < options.bucketsNumber ? parseInt(options.bucketsNumber, 10) : 10;
                this.tolerance = !isNaN(options.tolerance) && 0 < options.tolerance ? parseInt(options.tolerance, 10) : 50;
                this.calibration = !isNaN(options.calibration) && 0 < options.calibration ? parseInt(options.calibration, 10) : 5;
                this.timeout = !isNaN(options.timeout) && 0 < options.timeout ? parseInt(options.timeout, 10) : 0;
                this.onopen = ("function" === typeof options.onopen) ? options.onopen : function() {};
                this.onclose = ("function" === typeof options.onclose) ? options.onclose : function() {};
                this.buckets = [_createBucket.call(this)];

                this.state = STATE.CLOSED;
                this.initialized = true;

                _startTicking.call(this);
            }
        }

        /**
         * Method for assigning a defer execution
         * Code waiting for this promise uses this method
         * @param {Function} command - the command to run via the circuit
         * @param {Function} [fallback] - the fallback to run when circuit is opened
         * @param {Function} [timeout] - the timeout for the executed command
         */
        function run(command, fallback, timeout) {
            if (fallback && "function" !== typeof fallback) {
                timeout = fallback;
                fallback = void 0;
            }

            if (isOpen.call(this)) {
                _fallback.call(this, fallback || function() {});
                return false;
            }
            else {
                return _execute.call(this, command, timeout);
            }
        }

        /**
         * Method for forcing the circuit to open
         */
        function open() {
            this.forced = this.state;
            this.state = STATE.OPEN;
        }

        /**
         * Method for forcing the circuit to close
         */
        function close() {
            this.forced = this.state;
            this.state = STATE.CLOSED;
        }

        /**
         * Method for resetting the forcing
         */
        function reset() {
            this.state = this.forced;
            this.forced = void 0;
        }

        /**
         * Method for checking whether the circuit is open
         */
        function isOpen() {
            return STATE.OPEN === this.state;
        }

        /**
         * Method for calculating the needed metrics based on all calculation buckets
         */
        function calculate() {
            var bucketErrors;
            var percent;
            var total = 0;
            var error = 0;


            for (var i = 0; i < this.buckets.length; i++) {
                bucketErrors = (this.buckets[i][MEASURE.FAILURE] + this.buckets[i][MEASURE.TIMEOUT]);
                error += bucketErrors;
                total += bucketErrors + this.buckets[i][MEASURE.SUCCESS];
            }

            percent = (error / (total > 0 ? total : 1)) * 100;

            return {
                total: total,
                error: error,
                percent: percent
            };
        }

        /**
         * Method for the timer tick which manages the buckets
         * @private
         */
        function _tick() {
            if (this.timer) {
                clearTimeout(this.timer);
            }

            _createNextSlidingBucket.call(this);

            if (this.bucketIndex > this.bucketsNumber) {
                this.bucketIndex = 0;

                if (isOpen.call(this)) {
                    this.state = STATE.HALF_OPEN;
                }
            }

            this.timer = setTimeout(_tick.bind(this), this.bucket);
        }

        /**
         * Method for starting the timer and creating the metrics buckets for calculations
         * @private
         */
        function _startTicking() {
            this.bucketIndex = 0;
            this.bucket = this.slidingTimeWindow / this.bucketsNumber;

            if (this.timer) {
                clearTimeout(this.timer);
            }

            this.timer = setTimeout(_tick.bind(this), this.bucket);
        }

        /**
         * Method for creating a single metrics bucket for calculations
         * @private
         */
        function _createBucket() {
            var bucket = {};

            bucket[MEASURE.FAILURE] = 0;
            bucket[MEASURE.SUCCESS] = 0;
            bucket[MEASURE.TIMEOUT] = 0;
            bucket[MEASURE.OUTAGE] = 0;

            return bucket;
        }

        /**
         * Method for retrieving the last metrics bucket for calculations
         * @private
         */
        function _getLastBucket() {
            return this.buckets[this.buckets.length - 1];
        }

        /**
         * Method for creating the next bucket and removing the first bucket in case we got to the needed buckets number
         * @private
         */
        function _createNextSlidingBucket() {
            this.bucketIndex++;

            this.buckets.push(_createBucket.call(this));

            if (this.buckets.length > this.bucketsNumber) {
                this.buckets.shift();
            }
        }

        /**
         * Method for adding a calculation measure for a command
         * @param {CircuitBreaker.MEASURE} prop - the measurement property (success, error, timeout)
         * @param {Object} status - the status of the command (A single command can only be resolved once and represent a single measurement)
         * @private
         */
        function _measure(prop, status) {
            return function() {
                if (status.done) {
                    return;
                }
                else if (status.timer) {
                    clearTimeout(status.timer);
                    status.timer = null;
                    delete status.timer;
                }

                var bucket = _getLastBucket.call(this);
                bucket[prop]++;

                if (!this.forced) {
                    _updateState.call(this);
                }

                status.done = true;
            }.bind(this);
        }

        /**
         * Method for executing a command via the circuit and counting the needed metrics
         * @param {Function} command - the command to run via the circuit
         * @param {Number} timeout - optional timeout for the command
         * @private
         */
        function _execute(command, timeout) {
            var status = {
                done: false
            };
            var markSuccess = _measure.call(this, MEASURE.SUCCESS, status);
            var markFailure = _measure.call(this, MEASURE.FAILURE, status);
            var markTimeout = _measure.call(this, MEASURE.TIMEOUT, status);

            timeout = !isNaN(timeout) && 0 < timeout ? parseInt(timeout, 10) : this.timeout;

            if (0 < timeout) {
                status.timer = setTimeout(markTimeout, timeout);
            }

            try {
                command(markSuccess, markFailure, markTimeout);
            }
            catch(ex) {
                // TODO: Deal with errors
                markFailure();
            }
        }

        /**
         * Method for executing a command fallback via the circuit and counting the needed metrics
         * @param {Function} fallback - the command fallback to run via the circuit
         * @private
         */
        function _fallback(fallback) {
            try {
                fallback();
            }
            catch(ex) {
                // TODO: Deal with errors
            }

            var bucket = _getLastBucket.call(this);
            bucket[MEASURE.OUTAGE]++;
        }

        /**
         * Method for updating the circuit state based on the last command or existing metrics
         * @private
         */
        function _updateState() {
            var metrics = calculate.call(this);

            if (STATE.HALF_OPEN === this.state) {
                var lastCommandFailed = !_getLastBucket.call(this)[MEASURE.SUCCESS] && 0 < metrics.error;

                if (lastCommandFailed) {
                    this.state = STATE.OPEN;
                }
                else {
                    this.state = STATE.CLOSED;
                    this.onclose(metrics);
                }
            }
            else {
                var toleranceDeviation = metrics.percent > this.tolerance;
                var calibrationDeviation = metrics.total > this.calibration;
                var deviation = calibrationDeviation && toleranceDeviation;

                if (deviation) {
                    this.state = STATE.OPEN;
                    this.onopen(metrics);
                }
            }
        }

        return {
            initialize: initialize,
            run: run,
            close: close,
            open: open,
            reset: reset,
            isOpen: isOpen,
            calculate: calculate
        };
    }());

    /**
     * @type {{OPEN: number, HALF_OPEN: number, CLOSED: number}}
     * State representation for the circuit
     */
    CircuitBreaker.STATE = STATE;

    /**
     * Method to polyfill bind native functionality in case it does not exist
     * Based on implementation from:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     * @param {Object} object - the object to bind to
     * @returns {Function} the bound function
     */
    /* istanbul ignore next */
    function bind(object) {
        /*jshint validthis:true */
        var args;
        var fn;

        if ("function" !== typeof this) {
            // Closest thing possible to the ECMAScript 5
            // Internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        args = Array.prototype.slice.call(arguments, 1);
        fn = this;

        function Empty() {}

        function bound() {
            return fn.apply(this instanceof Empty && object ? this : object,
                args.concat(Array.prototype.slice.call(arguments)));
        }

        Empty.prototype = this.prototype;
        bound.prototype = new Empty();

        return bound;
    }

    /* istanbul ignore if  */
    if (!Function.prototype.bind) {
        Function.prototype.bind = bind;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    root.CircuitBreaker = root.CircuitBreaker || CircuitBreaker;
}));

;(function (root, factory) {
    "use strict";

    /* istanbul ignore if */
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("cacher", ["exports"], function () {
            if (!root.Cacher) {
                factory(root);
            }

            return root.Cacher;
        });
        return;
    }
    //</amd>
    /* istanbul ignore else */
    if ("object" === typeof exports) {
        // CommonJS
        factory(exports);
    }
    else {
        factory(root);
    }
}(typeof CacherRoot === "undefined" ? this : CacherRoot , function (root) {
    "use strict";

    /*jshint validthis:true */

    /**
     * Cacher constructor
     * @constructor
     * @param {Object} [options] - the configuration options for the instance
     * @param {Number} [options.max] - optional max items in cache
     * @param {Number} [options.maxStrategy] - optional strategy for max items (new items will not be added or closest ttl item should be removed)
     * @param {Number} [options.ttl] - optional TTL for each cache item
     * @param {Number} [options.interval] - optional interval for eviction loop
     * @param {Function} [options.ontimeout] - optional global handler for timeout of items in cache
     * @param {Function} [options.onkickout] - optional global handler for kick out (forced evict) of items in cache
     * @param {Array} [options.stores] - optional array of stores by priority
     * @param {Function} [options.oncomplete] - optional callback for loading completion
     */
    function Cacher(options) {
        // For forcing new keyword
        if (false === (this instanceof Cacher)) {
            return new Cacher(options);
        }

        this.initialize(options);
    }

    Cacher.MAX_STRATEGY = {
        NO_ADD: 0,
        CLOSEST_TTL: 1
    };

    Cacher.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} [options] - the configuration options for the instance
         * @param {Number} [options.max] - optional max items in cache
         * @param {Number} [options.maxStrategy] - optional strategy for max items (new items will not be added or closest ttl item should be removed)
         * @param {Number} [options.ttl] - optional TTL for each cache item
         * @param {Number} [options.interval] - optional interval for eviction loop
         * @param {Function} [options.ontimeout] - optional global handler for timeout of items in cache - return false if you want the item to not be deleted after ttl
         * @param {Function} [options.onkickout] - optional global handler for kick out (forced evict) of items in cache
         * @param {Array} [options.stores] - optional array of stores by priority
         * @param {Function} [options.oncomplete] - optional callback for loading completion
         */
        function initialize(options) {
            var that = this;
            var stop = false;
            var index = 0;

            function addItem(err, item) {
                that.nostore = true;
                set.call(that, item.key, item.value, item.ttl);
                delete that.nostore;
            }

            if (!this.initialized) {
                options = options || {};

                this.cache = {};                                                                                                               // Objects cache
                this.length = 0;                                                                                                               // Amount of items in cache
                this.maxStrategy = options.maxStrategy || Cacher.MAX_STRATEGY.NO_ADD;                                                          // The strategy to use when max items in cache
                this.max = options.max && !isNaN(options.max) && 0 < options.max ? parseInt(options.max, 10) : 0;                              // Maximum items in cache - 0 for unlimited
                this.ttl = options.ttl && !isNaN(options.ttl) && 0 < options.ttl ? parseInt(options.ttl, 10) : 0;                              // Time to leave for items (this can be overidden for specific items using the set method - 0 for unlimited
                this.interval = options.interval && !isNaN(options.interval) && 0 < options.interval ? parseInt(options.interval, 10) : 1000;  // Interval for running the eviction loop
                this.ontimeout = "function" === typeof options.ontimeout ? options.ontimeout : function () {};                                 // Callback for timeout of items
                this.onkickout = "function" === typeof options.onkickout ? options.onkickout : function () {};                                 // Callback for kickout of items
                this.stores = options.stores || [];

                while (index < this.stores.length && !stop) {
                    if (this.stores[index].autoload && this.stores[index].load) {
                        stop = true;
                        this.stores[index].load({
                            onitem: addItem,
                            oncomplete: options.oncomplete
                        });
                    }

                    index++;
                }

                this.initialized = true;

                _evict.call(this);
            }
        }

        /**
         * Method for getting an item from the cache
         * @param {String} key - the key for the item
         * @param {Boolean} [pop = false] - a boolean flag indicating whether to also pop/remove the item from cache
         * @returns {Object} the item from cache
         */
        function get(key, pop) {
            var item = pop ? remove.call(this, key) : this.cache && this.cache[key] && this.cache[key].item;
            return item;
        }

        /**
         * Method for setting an item to the cache
         * @param {String} key - the key for the item to be cached
         * @param {Object} item - the item to cache
         * @param {Number} [ttl] - the time to live for the item inside the cache
         * @param {Function} [callback] - optional callback to be called on item timeout - return false if you want the item to not be deleted after ttl
         */
        function set(key, item, ttl, callback) {
            return _insert.call(this, key, item, ttl, callback);
        }

        /**
         * Method for removing an item from the cache
         * @param {String} key - the key for the item to be removed
         * @returns {Object} the item that was removed from cache
         */
        function remove(key) {
            var item = this.cache && this.cache[key] && this.cache[key].item;

            if (item) {
                this.cache[key].item = null;
                this.cache[key].callback = null;
                this.cache[key].timeout = null;
                this.cache[key] = null;
                delete this.cache[key];
                this.length--;

                _syncStores.call(this, "remove", key);
            }

            return item;
        }

        /**
         * Method for removing all items from the cache
         */
        function removeAll() {
            if (this.length) {
                for (var key in this.cache) {
                    if (this.cache.hasOwnProperty(key)) {
                        remove.call(this, key);
                    }
                }
            }
        }

        /**
         * Method for syncing with stores
         * @param {String} action - the sync action (add, remove)
         * @param {String} key - the key for the item to be removed
         * @param {Object} item - the item to cache
         * @param {Number} ttl - the time to live for the item inside the cache
         * @private
         */
        function _syncStores(action, key, item, ttl) {
            if (!this.nostore) {
                for (var i = 0; i < this.stores.length; i++) {
                    if (this.stores[i][action]) {
                        this.stores[i][action](key, item, ttl);
                    }
                    else if (this.stores[i].save) {
                        this.stores[i].save({
                            items: this.cache
                        });
                    }
                }
            }
        }

        /**
         * Method for rejecting the promise
         * @param {String} key - the key for the item to be cached
         * @param {Object} item - the item to cache
         * @param {Number} ttl - the time to live for the item inside the cache
         * @param {Function} callback - optional callback to be called on item timeout
         * @returns {Boolean} indication whether the item had been added to the cache or not (since the cache is full)
         * @private
         */
        function _insert(key, item, ttl, callback) {
            var eviction;
            var timeout;

            if (0 === this.max || this.length < this.max || Cacher.MAX_STRATEGY.CLOSEST_TTL === this.maxStrategy) {
                eviction = (ttl && !isNaN(ttl) && 0 < ttl ? parseInt(ttl, 10) : this.ttl);

                this.cache[key] = {
                    item: item
                };

                this.length++;

                if (eviction) {
                    timeout = (new Date()).getTime() + eviction;
                    this.cache[key].timeout = timeout;
                }

                if ("function" === typeof callback) {
                    this.cache[key].callback = callback;
                }

                _syncStores.call(this, "set", key, item, ttl);

                if (eviction && (this.cache[key].callback || "function" === typeof this.ontimeout || "function" === typeof this.onkickout) || this.max && this.length > this.max) {
                    _evict.call(this, this.max && this.length > this.max);
                }

                return true;
            }
            else {
                return false;
            }
        }

        /**
         * Method for evicting expired items from the cache
         * @param {Boolean} kickoutClosestTTL - optional flag to force the removal of the item with the closest TTL
         * @returns {Number} The number of removed items from the cache
         * @private
         */
        function _evict(kickoutClosestTTL) {
            var callback;
            var item;
            var cbRes;
            var timeoutRes;
            var kickOut;
            var removed = 0;

            if (this.timer) {
                clearTimeout(this.timer);
            }

            if (this.length) {
                for (var key in this.cache) {
                    if (this.cache.hasOwnProperty(key) && this.cache[key].timeout) {
                        if (this.cache[key].timeout <= (new Date()).getTime()) {
                            item = this.cache[key].item;
                            callback = this.cache[key].callback;

                            if (callback) {
                                cbRes = callback(key, item);
                            }

                            if (this.ontimeout) {
                                timeoutRes = this.ontimeout(key, item);
                            }

                            // Now remove it
                            if (cbRes !== false && timeoutRes !== false) {
                                remove.call(this, key);
                                removed++;
                            }
                            else if (!removed && kickoutClosestTTL) {
                                if (!kickOut) {
                                    kickOut = {
                                        key: key,
                                        timeout: this.cache[key].timeout
                                    };
                                }
                                else if (kickOut.timeout > this.cache[key].timeout) {
                                    kickOut.key = key;
                                    kickOut.timeout = this.cache[key].timeout;
                                }
                            }
                        }
                        else if (!removed && kickoutClosestTTL) {
                            if (!kickOut) {
                                kickOut = {
                                    key: key,
                                    timeout: this.cache[key].timeout
                                };
                            }
                            else if (kickOut.timeout > this.cache[key].timeout) {
                                kickOut.key = key;
                                kickOut.timeout = this.cache[key].timeout;
                            }
                        }
                    }
                }

                if (!removed && kickOut && this.cache[kickOut.key]) {
                    item = this.cache[kickOut.key].item;
                    callback = this.cache[kickOut.key].callback;

                    if (callback) {
                        callback(kickOut.key, item);
                    }

                    if (this.onkickout) {
                        this.onkickout(kickOut.key, item);
                    }

                    // Now remove it
                    remove.call(this, kickOut.key);
                    removed++;
                }
            }

            this.timer = setTimeout(_evict.bind(this), this.interval);

            return removed;
        }

        return {
            initialize: initialize,
            get: get,
            set: set,
            remove: remove,
            removeAll: removeAll
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    root.Cacher = root.Cacher || Cacher;
}))
;


;(function (root, chronosRoot, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageUtilities", [], function () {
            return factory(root, chronosRoot, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" !== typeof exports) {
        chronosRoot.Chronos = chronosRoot.Chronos || {};
        factory(root, chronosRoot.Chronos);
    }
}(this, typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, hide) {
    "use strict";

    var SEQUENCE_FORMAT = "_xxxxxx-4xxx-yxxx";

    /**
     * This function was added because of incompatibility between the JSON.stringify and Prototype.js library
     * When a customer uses Prototype.js library, It overrides the Array.prototype.toJSON function of the native JSON
     * uses. This causes arrays to be double quoted and Shark to fail on those SDEs.
     * The function accepts a value and uses the native JSON.stringify
     * Can throw an exception (same as JSON.stringify).
     * @returns {String} the strigified object
     */
    function stringify() {
        var stringified;
        var toJSONPrototype;

        if ("function" === typeof Array.prototype.toJSON) {
            toJSONPrototype = Array.prototype.toJSON;
            Array.prototype.toJSON = void 0;

            try {
                stringified = JSON.stringify.apply(null, arguments);
            }
            catch (ex) {
                /* istanbul ignore next  */
                Array.prototype.toJSON = toJSONPrototype;
                /* istanbul ignore next  */
                throw ex;
            }

            Array.prototype.toJSON = toJSONPrototype;
        }
        else {
            stringified = JSON.stringify.apply(null, arguments);
        }

        return stringified;
    }

    /**
     * Method to identify whether the browser supports passing object references to postMessage API
     * @returns {Boolean} whether the browser supports passing object references to postMessage API
     */
    function hasPostMessageObjectsSupport() {
        var hasObjectsSupport = true;
        try {
            root.postMessage({
                toString:function() {
                    hasObjectsSupport = false;
                }
            }, "*");
        }
        catch (ex) {
            // Browsers which has postMessage Objects support sends messages using
            // the structured clone algorithm - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
            // In which Error and Function objects cannot be duplicated by the structured clone algorithm; attempting to do so will throw a DATA_CLONE_ERR exception.
            if (ex && 'DataCloneError' !== ex.name) {
                hasObjectsSupport = false;
            }
        }

        return hasObjectsSupport;
    }


    /**
     * Method to create a unique sequence
     * @param {String} format - the format for the unique name eg. xxxxx-xx4xxx-yxxxx
     * @returns {String} the unique iFrame name
     */
    function createUniqueSequence(format) {
        return format && format.replace(/[xy]/g, function(chr) {
                var rnd = Math.random() * 16 | 0;
                var val = chr === "x" ? rnd : (rnd & 0x3 | 0x8);

                return val.toString(16);
            });
    }

    /**
     * Method to validate and parse an input number
     * @param {Number} input - the input value to parse
     * @param {Number} defaultValue - the default value to return in case of invalid input
     * @returns {Number} the number to return
     */
    function parseNumber(input, defaultValue) {
        return !isNaN(input) && 0 < input ? parseInt(input, 10) : defaultValue;
    }

    /**
     * Method to validate and parse a function reference
     * @param {Function} input - the input value to parse
     * @param {Function|Boolean} defaultValue - the default value to return in case of invalid input or true for empty function
     * @returns {Function} the function to return
     */
    function parseFunction(input, defaultValue) {
        return (("function" === typeof input) ? input : (true === defaultValue ? function() {} : defaultValue));
    }

    /**
     * Function to extract the host domain from any URL
     * @param {String} url - the url to resolve the host for
     * @param {Object} [win] - the window to resolve the host for
     * @param {Boolean} [top] - boolean indication for using helper of the top window if needed
     * @returns {String} the host
     */
    function getHost(url, win, top) {
        var domainRegEx = new RegExp(/(http{1}s{0,1}?:\/\/)([^\/\?]+)(\/?)/ig);
        var matches;
        var domain;
        var frame;

        if (url && 0 === url.indexOf("http")) {
            matches = domainRegEx.exec(url);
        }
        else { // This is a partial url so we assume it's relative, this is mainly nice for tests
            frame = top ? (win.top || (win.contentWindow && win.contentWindow.parent) || window) : win;
            return frame.location.protocol + "//" + frame.location.host;
        }

        if (matches && 3 <= matches.length && "" !== matches[2]) {
            domain = matches[1].toLowerCase() + matches[2].toLowerCase(); // 0 - full match 1- HTTPS 2- domain
        }

        return domain;
    }

    /**
     * Method to resolve the needed origin parameters from url
     * @param {String} [hostParam] - string to represent the name of the host parameter in querystring
     * @param {String} [url] - string to represent the url to resolve parameters from
     * @returns {String} the parameter from the url
     */
    function resolveParameters(hostParam, url) {
        var param;
        var value = getURLParameter("lpHost", url);

        if (!value) {
            param = getURLParameter("hostParam", url) || hostParam;

            if (param) {
                value = getURLParameter(param, url);
            }
        }

        return value;
    }

    /**
     * Method to resolve the needed origin
     * @param {Object} [target] - the target to resolve the host for
     * @param {Boolean} [top] - boolean indication for using helper of the top window if needed
     * @param {String} [hostParam] - string to represent the name of the host parameter in querystring
     * @returns {String} the origin for the target
     */
    function resolveOrigin(target, top, hostParam) {
        var origin;
        var url;
        var ref;

        try {
            url = target && target.contentWindow && "undefined" !== typeof Window && !(target instanceof Window) && target.getAttribute && target.getAttribute("src");
        }
        catch(ex) {}

        try {
            if (!url) {
                url = resolveParameters(hostParam);
            }

            if (!url) {
                url = document.referrer;
                ref = true;
            }

            if (url) {
                url = decodeURIComponent(url);

                if (ref) {
                    url = resolveParameters(hostParam, url);
                }
            }

            origin = getHost(url, target, top);
        }
        catch(ex) {
            log("Cannot parse origin", "ERROR", "PostMessageUtilities");
        }

        return origin || "*";
    }

    /**
     * Method to retrieve a url parameter from querystring by name
     * @param {String} name - the name of the parameter
     * @param {String} [url] - optional url to parse
     * @returns {String} the url parameter value
     */
    function getURLParameter(name, url) {
        return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(url || document.location.search) || [void 0, ""])[1].replace(/\+/g, "%20")) || null;
    }

    /**
     * Method to delay a message execution (async)
     * @param {Function} method - the function to delay
     * @param {Number} [milliseconds] - optional milliseconds to delay or false to run immediately
     */
    function delay(method, milliseconds) {
        var timer;
        /* istanbul ignore if  */
        if ("undefined" !== typeof setImmediate && (isNaN(milliseconds) || 0 >= milliseconds)) {
            timer = setImmediate(method);
        }
        else if (false === milliseconds) {
            method();
        }
        else {
            timer = setTimeout(method, (isNaN(milliseconds) || 0 >= milliseconds) ? 0 : parseInt(milliseconds, 10));
        }

        return function() {
            clearDelay(timer);
        };
    }

    /**
     * Method to clear the delay of a message execution (async)
     * @param {Number} id - the id of the timer to clear
     */
    function clearDelay(timer) {
        var timerId = parseNumber(timer);
        if (timerId) {
            /* istanbul ignore if  */
            if ("undefined" !== typeof clearImmediate) {
                clearImmediate(timerId);
            }
            else {
                clearTimeout(timerId);
            }
        }
    }

    /**
     * Method to add DOM events listener to an element
     * @param {Object} element - the element we're binding to
     * @param {String} event - the event we want to bind
     * @param {Function} callback - the function to execute
     */
    function addEventListener(element, event, callback) {
        /* istanbul ignore else: IE9- only  */
        if (element.addEventListener) {
            element.addEventListener(event, callback, false);
        }
        else {
            element.attachEvent("on" + event, callback);
        }

        return function() {
            removeEventListener(element, event, callback);
        };
    }

    /**
     * Method to add DOM events listener to an element
     * @param {Object} element - the element we're binding to
     * @param {String} event - the event we want to bind
     * @param {Function} callback - the function to execute
     */
    function removeEventListener(element, event, callback) {
        /* istanbul ignore else: IE9- only  */
        if (element.removeEventListener) {
            element.removeEventListener(event, callback, false);
        }
        else {
            element.detachEvent("on" + event, callback);
        }
    }

    /**
     * Method to implement a simple logging based on lptag
     * @param {String} msg - the message to log
     * @param {String} level - the logging level of the message
     * @param {String} app - the app which logs
     */
    /* istanbul ignore next  */
    function log(msg, level, app) {
        if (root && "function" === typeof root.log) {
            root.log(msg, level, app);
        }
    }

    /**
     * Method to polyfill bind native functionality in case it does not exist
     * Based on implementation from:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     * @param {Object} object - the object to bind to
     * @returns {Function} the bound function
     */
    /* istanbul ignore next */
    function bind(object) {
        /*jshint validthis:true */
        var args;
        var fn;

        if ("function" !== typeof this) {
            // Closest thing possible to the ECMAScript 5
            // Internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        args = Array.prototype.slice.call(arguments, 1);
        fn = this;

        function Empty() {}

        function bound() {
            return fn.apply(this instanceof Empty && object ? this : object,
                args.concat(Array.prototype.slice.call(arguments)));
        }

        Empty.prototype = this.prototype;
        bound.prototype = new Empty();

        return bound;
    }

    /* istanbul ignore if  */
    if (!Function.prototype.bind) {
        Function.prototype.bind = bind;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    var ret = {
        SEQUENCE_FORMAT: SEQUENCE_FORMAT,
        stringify: stringify,
        hasPostMessageObjectsSupport: hasPostMessageObjectsSupport,
        createUniqueSequence: createUniqueSequence,
        parseNumber: parseNumber,
        parseFunction: parseFunction,
        getHost: getHost,
        resolveOrigin: resolveOrigin,
        getURLParameter: getURLParameter,
        delay: delay,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        log: log,
        bind: bind
    };
    if (!hide) {
        exports.PostMessageUtilities = exports.PostMessageUtilities || ret;
    }
    return ret;
}));

;(function (root, chronosRoot, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageChannelPolyfill", ["Chronos.PostMessageUtilities"], function (PostMessageUtilities) {
            return factory(root, chronosRoot, PostMessageUtilities, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" !== typeof exports) {
        /**
         * @depend ./PostMessageUtilities.js
         */
        chronosRoot.Chronos = chronosRoot.Chronos || {};
        factory(root, chronosRoot.Chronos, chronosRoot.Chronos.PostMessageUtilities);
    }
}(this, typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, PostMessageUtilities, hide) {
    "use strict";

    /*jshint validthis:true */
    var PORT_PREFIX = "LPPort_";

    /**
     * PostMessageChannelPolyfill constructor
     * @constructor
     * @param {Object} target - The DOM node of the target iframe or window
     * @param {Object} [options] the configuration options for the instance
     * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
     * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
     */
    function PostMessageChannelPolyfill(target, options) {
        /* istanbul ignore if  */
        // For forcing new keyword
        if (false === (this instanceof PostMessageChannelPolyfill)) {
            return new PostMessageChannelPolyfill(target, options);
        }

        this.initialize(target, options);
    }

    PostMessageChannelPolyfill.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} target - The DOM node of the target iframe or window
         * @param {Object} [options] the configuration options for the instance
         * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
         * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
         */
        function initialize(target, options) {
            if (!this.initialized) {
                options = options || {};

                this.target = target || root.top;
                this.hosted = this.target === root || this.target === root.top;
                this.portId = PostMessageUtilities.createUniqueSequence(PORT_PREFIX + PostMessageUtilities.SEQUENCE_FORMAT);
                this.serialize = PostMessageUtilities.parseFunction(options.serialize, PostMessageUtilities.stringify);
                this.deserialize = PostMessageUtilities.parseFunction(options.deserialize, JSON.parse);

                this.initialized = true;
            }
        }

        /**
         * Method for posting the message to the target
         * @param {Object} message - the message to be post
         */
        function postMessage(message) {
            var wrapped;
            var parsed;
            var origin = _getOrigin.call(this);
            var receiver = this.target;

            if (message) {
                try {
                    if (!this.hosted) {
                        receiver = this.target.contentWindow;
                    }
                    wrapped = _wrapMessage.call(this, message);
                    parsed = this.serialize(wrapped);
                    receiver.postMessage(parsed, origin);
                }
                catch(ex) {
                    /* istanbul ignore next  */
                    PostMessageUtilities.log("Error while trying to post the message", "ERROR", "PostMessageChannelPolyfill");
                    /* istanbul ignore next  */
                    return false;
                }
            }
        }

        /**
         * Method for receiving the incoming message
         * @param {Object} event - the event object on message
         */
        function receive(event) {
            var message;
            if ("function" === typeof this.onmessage) {
                message = _unwrapMessage.call(this, event);
                return this.onmessage(message);
            }
        }

        /**
         * Method for getting the origin to be used
         * @private
         */
        function _getOrigin() {
            if (!this.origin) {
                this.origin = PostMessageUtilities.resolveOrigin(this.target);
            }

            return this.origin;
        }

        /**
         * Method for wrapping the outgoing message with port and id
         * @param {Object} message - the message to be wrapped
         * @returns {Object} the wrapped message
         * @private
         */
        function _wrapMessage(message) {
            return {
                port: this.portId,
                message: message
            };
        }

        /**
         * Method for unwrapping the incoming message from port and id
         * @param {Object} event - the event object on message
         * @returns {Object} the unwrapped message
         * @private
         */
        function _unwrapMessage(event) {
            var msgObject;

            if (event && event.data) {
                try {
                    msgObject = this.deserialize(event.data);

                    if (msgObject.port && 0 === msgObject.port.indexOf(PORT_PREFIX)) {
                        return {
                            origin: event.origin,
                            data: msgObject.message
                        };
                    }
                }
                catch (ex) {
                    /* istanbul ignore next  */
                    PostMessageUtilities.log("Error while trying to deserialize the message", "ERROR", "PostMessageChannelPolyfill");
                }
            }

            return msgObject || event;
        }

        return {
            initialize: initialize,
            postMessage: postMessage,
            receive: receive
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.PostMessageChannelPolyfill = exports.PostMessageChannelPolyfill || PostMessageChannelPolyfill;
    }
    return PostMessageChannelPolyfill;
}));

;(function (root, chronosRoot, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageChannel", ["Chronos.PostMessageUtilities", "Chronos.PostMessageChannelPolyfill"], function (PostMessageUtilities, PostMessageChannelPolyfill) {
            return factory(root, chronosRoot, PostMessageUtilities, PostMessageChannelPolyfill, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" !== typeof exports) {
        /**
         * @depend ./PostMessageUtilities.js
         * @depend ./PostMessageChannelPolyfill.js
         */
        chronosRoot.Chronos = chronosRoot.Chronos || {};
        factory(root, chronosRoot.Chronos, chronosRoot.Chronos.PostMessageUtilities, chronosRoot.Chronos.PostMessageChannelPolyfill);
    }
}(this, typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, PostMessageUtilities, PostMessageChannelPolyfill, hide) {
    "use strict";

    /*jshint validthis:true */
    var IFRAME_PREFIX = "LPFRM";
    var TOKEN_PREFIX = "LPTKN";
    var HANSHAKE_PREFIX = "HNDSK";
    var DEFAULT_CONCURRENCY = 100;
    var DEFAULT_HANDSHAKE_RETRY_INTERVAL = 5000;
    var DEFAULT_HANDSHAKE_RETRY_ATTEMPTS = 3;
    var DEFAULT_BODY_LOAD_DELAY = 100;

    /**
     * PostMessageChannel constructor
     * @constructor
     * @param {Object} options the configuration options for the instance
     * @param {Object} options.target - the target iframe or iframe configuration
     * @param {String} [options.target.url] - the url to load
     * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
     * @param {String} [options.target.style] - the CSS style to apply
     * @param {String} [options.target.style.width] width of iframe
     * @param {String} [options.target.style.height] height of iframe
     *          .....
     * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
     * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded,
     * @param {Object} [options.target.context] - optional context for the callback
     * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded {
     * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
     * @param {Object} [options.onready.context] - optional context for the callback
     * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
     * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
     * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
     * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
     * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
     * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
     * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
     * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
     * @param {Function} onmessage - the handler for incoming messages
     */
    function PostMessageChannel(options, onmessage) {
        /* istanbul ignore if  */
        // For forcing new keyword
        if (false === (this instanceof PostMessageChannel)) {
            return new PostMessageChannel(options, onmessage);
        }

        this.initialize(options, onmessage);
    }

    PostMessageChannel.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} options the configuration options for the instance
         * @param {Object} options.target - the target iframe or iframe configuration
         * @param {String} [options.target.url] - the url to load
         * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @param {String} [options.target.style] - the CSS style to apply
         * @param {String} [options.target.style.width] width of iframe
         * @param {String} [options.target.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
         * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded,
         * @param {Object} [options.target.context] - optional context for the callback
         * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded {
         * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
         * @param {Object} [options.onready.context] - optional context for the callback
         * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
         * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
         * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
         * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
         * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
         * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
         * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
         * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
         * @param {Function} onmessage - the handler for incoming messages
         */
        function initialize(options, onmessage) {
            var handleMessage;
            var handler;

            if (!this.initialized) {
                this.hosted = false;
                this.messageQueue = [];

                options = options || {};
                handler = _initParameters.call(this, options, onmessage);
                if (!_isNativeMessageChannelSupported.call(this)) {
                    this.receiver = new PostMessageChannelPolyfill(this.target, {
                        serialize: this.serialize,
                        deserialize: this.deserialize
                    });
                    this.receiver.onmessage = handler;
                }

                if (this.hosted || !_isNativeMessageChannelSupported.call(this)) {
                    handleMessage = _getHandleMessage(handler).bind(this);
                    this.removeListener = PostMessageUtilities.addEventListener(root, "message", handleMessage);
                }
                else if (_isNativeMessageChannelSupported.call(this)) {
                    this.channelFactory();
                }

                if (this.target && !this.loading && !this.ready) {
                    _kickStartHandshake.call(this, handler, handleMessage);
                }

                this.initialized = true;
            }
        }

        /**
         * Method for removing the handler
         * @param {String} name - a name of the reference which holds the remove handler on this context,
         * @param {Boolean} ignore - optional flag to indicate whether to ignore the execution of the remove handler
         *
         */
        function _removeHandler(name, ignore) {
            // Remove handler if needed
            var func = PostMessageUtilities.parseFunction(this[name]);
            if (func) {
                if (!ignore) {
                    func.call(this);
                }

                this[name] = void 0;
                delete this[name];
            }
        }

        /**
         * Method for removing the timer
         */
        function _removeTimer(ignore) {
            // Remove timer if needed
            _removeHandler.call(this, "rmtimer", ignore);
        }

        /**
         * Method for removing the timer
         */
        function _removeLoadedHandler(ignore) {
            // Remove load handler if needed
            _removeHandler.call(this, "rmload", ignore);
        }

        /**
         * Method for disposing the object
         */
        function dispose() {
            if (!this.disposed) {
                if (this.removeListener) {
                    this.removeListener.call(this);
                    this.removeListener = void 0;
                }

                if (this.targetUrl && this.target || this.removeDispose) {
                    try {
                        if (this.targetContainer) {
                            this.targetContainer.removeChild(this.target);
                        }
                        else {
                            document.body.removeChild(this.target);
                        }
                    }
                    catch(ex) {
                        /* istanbul ignore next  */
                        PostMessageUtilities.log("Error while trying to remove the iframe from the container", "ERROR", "PostMessageChannel");
                    }
                }

                // Remove load handler if needed
                _removeTimer.call(this);

                // Remove timer if needed
                _removeLoadedHandler.call(this);

                this.messageQueue.length = 0;
                this.messageQueue = void 0;
                this.channel = void 0;
                this.onready = void 0;
                this.disposed = true;
            }
        }

        /**
         * Method to post the message to the target
         * @param {Object} message - the message to post
         * @param {Object} [target] - optional target for post
         * @param {Boolean} [force = false] - force post even if not ready
         */
        function postMessage(message, target, force) {
            var consumer;
            var parsed;

            if (!this.disposed) {
                try {
                    if (message) {
                        if (this.ready || force) {
                            // Post the message
                            consumer = target || this.receiver;
                            parsed = _prepareMessage.call(this, message);
                            consumer.postMessage(parsed);
                            return true;
                        }
                        else if (this.maxConcurrency >= this.messageQueue.length) {
                            // Need to delay/queue messages till target is ready
                            this.messageQueue.push(message);
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                }
                catch(ex) {
                    /* istanbul ignore next  */
                    PostMessageUtilities.log("Error while trying to post the message", "ERROR", "PostMessageChannel");
                    return false;
                }
            }
        }

        function _kickStartHandshake(handler, handleMessage) {
            var initiated;
            try {
                initiated = _handshake.call(this);
            }
            catch (ex) {
                initiated = false;
            }

            if (!initiated) {
                // Fallback to pure postMessage
                this.channel = false;
                this.receiver = new PostMessageChannelPolyfill(this.target, {
                    serialize: this.serialize,
                    deserialize: this.deserialize
                });
                this.receiver.onmessage = handler;

                if (!this.hosted) {
                    handleMessage = _getHandleMessage(handler).bind(this);
                    this.removeListener = PostMessageUtilities.addEventListener(root, "message", handleMessage);
                }

                _handshake.call(this);
            }

            this.handshakeAttempts--;

            PostMessageUtilities.delay(function () {
                if (!this.disposed && !this.hosted && !this.ready) {
                    this.rmload = _addLoadHandler.call(this, this.target);
                    this.rmtimer = PostMessageUtilities.delay(_handshake.bind(this, this.handshakeInterval), this.handshakeInterval);
                }
            }.bind(this));
        }

        function _initParameters(options, onmessage) {
            var handler;
            _simpleParametersInit.call(this, options);
            handler = _wrapMessageHandler(onmessage).bind(this);

            this.channelFactory = _hookupMessageChannel.call(this, handler);

            // No Iframe - We are inside it (hosted) initialized by the host/container
            if (!options.target || (options.target !== root || options.target === root.top) && "undefined" !== typeof Window && options.target instanceof Window) {
                this.hosted = true;
                this.target = options.target || root.top;
            }
            else if (options.target.contentWindow) { // We've got a reference to an "external" iframe
                this.target = options.target;
            }
            else if (options.target.url) { // We've got the needed configuration for creating an iframe
                this.targetUrl = options.target.url;
                this.targetOrigin = this.targetOrigin || PostMessageUtilities.getHost(options.target.url);
            }

            if (!this.hosted) {
                this.token = PostMessageUtilities.createUniqueSequence(TOKEN_PREFIX + PostMessageUtilities.SEQUENCE_FORMAT);
            }

            if (this.targetUrl) { // We've got the needed configuration for creating an iframe
                this.loading = true;
                this.targetContainer = options.target.container || document.body;
                this.target = _createIFrame.call(this, options.target, this.targetContainer);
            }
            return handler;
        }

        function _simpleParametersInit(options) {
            this.serialize = PostMessageUtilities.parseFunction(options.serialize, PostMessageUtilities.stringify);
            this.deserialize = PostMessageUtilities.parseFunction(options.deserialize, JSON.parse);
            this.targetOrigin = options.targetOrigin;
            this.maxConcurrency = PostMessageUtilities.parseNumber(options.maxConcurrency, DEFAULT_CONCURRENCY);
            this.handshakeInterval = PostMessageUtilities.parseNumber(options.handshakeInterval, DEFAULT_HANDSHAKE_RETRY_INTERVAL);
            this.handshakeAttemptsOrig = PostMessageUtilities.parseNumber(options.handshakeAttempts, DEFAULT_HANDSHAKE_RETRY_ATTEMPTS);
            this.handshakeAttempts = this.handshakeAttemptsOrig;
            this.hostParam = options.hostParam;
            this.channel = "undefined" !== typeof options.channel ? options.channel : _getChannelUrlIndicator();
            this.useObjects = options.useObjects;
            this.onready = _wrapReadyCallback(options.onready, options.target).bind(this);
            this.removeDispose = options.removeDispose;
        }

        /**
         * Method for handling the initial handler binding for needed event listeners
         * @param {Object} handler - the event object on message
         */
        function _getHandleMessage(handler) {
            return function(event) {
                var handshake;
                var previous;

                if (event.ports && 0 < event.ports.length) {
                    this.receiver = event.ports[0];

                    if (_isHandshake.call(this, event)) {
                        if (!this.token) {
                            this.token = event.data;
                        }
                    }

                    this.receiver.start();

                    // Swap Listeners
                    previous = this.removeListener.bind(this);
                    this.removeListener = PostMessageUtilities.addEventListener(this.receiver, "message", handler);
                    previous();

                    if (!this.disposed && this.hosted && !this.ready) {
                        handshake = true;
                    }
                }
                else {
                    if (_isHandshake.call(this, event)) {
                        if (!this.token) {
                            this.token = event.data;
                        }

                        if (!this.disposed && this.hosted && !this.ready) {
                            handshake = true;
                        }
                    }
                    else if (this.token) {
                        this.receiver.receive.call(this.receiver, event);
                    }
                }

                if (handshake) {
                    this.receiver.postMessage(HANSHAKE_PREFIX + this.token);
                    _onReady.call(this);
                }
            };
        }

        /**
         * Method to prepare the message for posting to the target
         * @param message
         * @returns {*}
         * @private
         */
        function _prepareMessage(message) {
            _tokenize.call(this, message);
            return this.serialize(message);
        }

        /**
         * Method to get url indication for using message channel or polyfill
         * @returns {Boolean} indication for message channel usage
         * @private
         */
        /* istanbul ignore next: it is being covered at the iframe side - cannot add it to coverage matrix  */
        function _getChannelUrlIndicator() {
            if ("true" === PostMessageUtilities.getURLParameter("lpPMCPolyfill")) {
                return false;
            }
        }

        /**
         * Method to create and hookup message channel factory for further use
         * @param {Function} onmessage - the message handler to be used with the channel
         * @private
         */
        function _hookupMessageChannel(onmessage) {
            return function() {
                this.channel = new MessageChannel();
                this.receiver = this.channel.port1;
                this.dispatcher = this.channel.port2;
                this.receiver.onmessage = onmessage;
                this.neutered = false;
            }.bind(this);
        }

        /**
         * Method for applying the token if any on the message
         * @param {Object} message - the message to be tokenize
         * @private
         */
        function _tokenize(message) {
            if (this.token) {
                message.token = this.token;
            }
        }

        /**
         * Method for applying the token if any on the message
         * @param {Object} message - the message to be tokenize
         * @private
         */
        function _validateToken(message) {
            return (message && message.token === this.token);
        }

        /**
         * Method to validate whether an event is for handshake
         * @param {Object} event - the event object on message
         * @private
         */
        function _isHandshake(event) {
            return (event && event.data && "string" === typeof event.data && (0 === event.data.indexOf(TOKEN_PREFIX) || (HANSHAKE_PREFIX + this.token) === event.data));
        }

        /**
         * Method for wrapping the callback of iframe ready
         * @param {Function} [onready] - the handler for iframe ready
         * @param {Object} [target] - the target iframe configuration
         * @returns {Function} handler function for messages
         * @private
         */
        function _wrapReadyCallback(onready, target) {
            return function(err) {
                if (target && "function" === typeof target.callback) {
                    target.callback.call(target.context, err, this.target);
                }
                if (onready) {
                    if ("function" === typeof onready) {
                        onready(err, this.target);
                    }
                    else if ("function" === typeof onready.callback) {
                        onready.callback.call(onready.context, err, this.target);
                    }
                }
            };
        }

        /**
         * Method for wrapping the handler of the postmessage for parsing
         * @param {Function} onmessage - the handler for incoming messages to invoke
         * @returns {Function} handler function for messages
         * @private
         */
        function _wrapMessageHandler(onmessage) {
            return function(message) {
                var msgObject;

                if (!message.origin || "*" === message.origin ||  this.targetOrigin === message.origin) {
                    if (_isHandshake.call(this, message) && !this.disposed && !this.hosted && !this.ready) {
                        _onReady.call(this);
                    }
                    else {
                        try {
                            msgObject = this.deserialize(message.data);

                            if (_validateToken.call(this, msgObject)) {
                                return onmessage && onmessage(msgObject);
                            }
                        }
                        catch (ex) {
                            msgObject = message.data || message;
                            PostMessageUtilities.log("Error while trying to handle the message", "ERROR", "PostMessageChannel");
                        }

                        return msgObject || message;
                    }
                }
            };
        }

        /**
         * Method to check whether the browser supports MessageChannel natively
         * @returns {Boolean} support flag
         * @private
         */
        function _isNativeMessageChannelSupported() {
            return false !== this.channel && "undefined" !== typeof MessageChannel && "undefined" !== typeof MessagePort;
        }

        /**
         * Method to hookup the initial "handshake" between the two parties (window and iframe) So they can start their communication
         * @param {Number} retry - retry in milliseconds
         * @returns {Boolean} indication if handshake initiated
         * @private
         */
        function _handshake(retry) {
            // Remove load handler if needed
            _removeTimer.call(this, true);

            if (!this.disposed && !this.ready) {
                if (!_isNativeMessageChannelSupported.call(this)) {
                    this.targetOrigin = this.targetOrigin || PostMessageUtilities.resolveOrigin(this.target) || "*";
                }

                if (!this.hosted) {
                    if (_isNativeMessageChannelSupported.call(this)) {
                        try {
                            if (this.neutered) {
                                this.channelFactory();
                            }
                            this.target.contentWindow.postMessage(this.token, this.targetOrigin, [ this.dispatcher ]);
                            this.neutered = true;
                        }
                        catch(ex) {
                            /* istanbul ignore next  */
                            return false;
                        }
                    }
                    else {
                        this.target.contentWindow.postMessage(this.token, this.targetOrigin);
                    }
                }
            }

            if (!this.disposed && !this.ready && retry) {
                if (0 < this.handshakeAttempts) {
                    this.handshakeAttempts--;
                    this.rmtimer = PostMessageUtilities.delay(_handshake.bind(this, retry), retry);
                }
                else {
                    this.onready(new Error("Loading: Operation Timeout!"));
                }
            }

            return true;
        }

        /**
         * Method to mark ready, and process queued/waiting messages if any
         * @private
         */
        function _onReady() {
            if (!this.disposed && !this.ready) {
                this.ready = true;

                // Handshake was successful, Channel is ready for messages
                // Set the counter back to original value for dealing with iframe reloads
                this.handshakeAttempts = this.handshakeAttemptsOrig;

                // Process queued messages if any
                if (this.messageQueue && this.messageQueue.length) {
                    PostMessageUtilities.delay(function() {
                        var message;
                        var parsed;

                        if (!this.disposed && this.ready) {
                            while (this.messageQueue && this.messageQueue.length) {
                                message = this.messageQueue.shift();
                                try {
                                    parsed = _prepareMessage.call(this, message);
                                    this.receiver.postMessage(parsed);
                                }
                                catch(ex) {
                                    /* istanbul ignore next  */
                                    PostMessageUtilities.log("Error while trying to post the message from queue", "ERROR", "PostMessageChannel");
                                }
                            }

                            // Invoke the callback for ready
                            this.onready();
                        }
                    }.bind(this));
                }
                else {
                    // Invoke the callback for ready
                    this.onready();
                }
            }
        }

        /**
         * Method to enable running a callback once the document body is ready
         * @param {Object} [options] Configuration options
         * @param {Function} options.onready - the callback to run when ready
         * @param {Object} [options.doc = root.document] - document to refer to
         * @param {Number} [options.delay = 0] - milliseconds to delay the execution
         * @private
         */
        function _waitForBody(options) {
            options = options || {};
            var onready = options.onready;
            var doc = options.doc || root.document;
            var delay = options.delay;

            function _ready() {
                if (doc.body) {
                    onready();
                }
                else {
                    PostMessageUtilities.delay(_ready, delay || DEFAULT_BODY_LOAD_DELAY);
                }
            }

            PostMessageUtilities.delay(_ready, delay || false);
        }

        /**
         * Creates an iFrame in memory and sets the default attributes except the actual URL
         * Does not attach to DOM at this point
         * @param {Object} options a passed in configuration options
         * @param {String} options.url - the url to load,
         * @param {String} [options.style] - the CSS style to apply
         * @param {String} [options.style.width] width of iframe
         * @param {String} [options.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true),
         * @param {Function} [options.callback] - a callback to invoke after the iframe had been loaded,
         * @param {Object} [options.context] - optional context for the callback
         * @param {Object} [container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @returns {Element} the attached iFrame element
         * @private
         */
        function _createIFrame(options, container) {
            var frame = document.createElement("IFRAME");
            var name = PostMessageUtilities.createUniqueSequence(IFRAME_PREFIX + PostMessageUtilities.SEQUENCE_FORMAT);
            var delay = options.delayLoad;
            var defaultAttributes = {
                "id": name,
                "name" :name,
                "tabindex": "-1",       // To prevent it getting focus when tabbing through the page
                "aria-hidden": "true",  // To prevent it being picked up by screen-readers
                "title":  "",           // Adding an empty title for accessibility
                "role": "presentation", // Adding a presentation role http://yahoodevelopers.tumblr.com/post/59489724815/easy-fixes-to-common-accessibility-problems
                "allowTransparency":"true"
            };
            var defaultStyle = {
                width :"0px",
                height : "0px",
                position :"absolute",
                top : "-1000px",
                left : "-1000px"
            };

            options.attributes = options.attributes || defaultAttributes;
            for (var key in options.attributes){
                if (options.attributes.hasOwnProperty(key)) {
                    frame.setAttribute(key, options.attributes[key]);
                }
            }

            options.style = options.style || defaultStyle;
            if (options.style) {
                for (var attr in options.style) {
                    if (options.style.hasOwnProperty(attr)) {
                        frame.style[attr] = options.style[attr];
                    }
                }
            }

            // Append and hookup after body tag opens
            _waitForBody({
                delay: delay,
                onready: function() {
                    (container || document.body).appendChild(frame);
                    this.rmload = _addLoadHandler.call(this, frame);
                    _setIFrameLocation.call(this, frame, options.url, (false !== options.bust));
                }.bind(this)
            });

            return frame;
        }

        /**
         * Add load handler for the iframe to make sure it is loaded
         * @param {Object} frame - the actual DOM iframe
         * @returns {Function} the remove handler function
         * @private
         */
        function _addLoadHandler(frame) {
            var load = function() {
                this.loading = false;

                if (this.handshakeAttempts === this.handshakeAttemptsOrig) {
                    // Probably a first try for handshake or a reload of the iframe,
                    // Either way, we'll need to perform handshake, so ready flag should be set to false (if not already)
                    this.ready = false;
                }

                _handshake.call(this, this.handshakeInterval);
            }.bind(this);

            PostMessageUtilities.addEventListener(frame, "load", load);

            return function() {
                _removeLoadHandler(frame, load);
            };
        }

        /**
         * Remove load handler for the iframe
         * @param {Object} frame - the actual DOM iframe
         * @param {Function} handler - the actual registered load handler
         * @private
         */
        function _removeLoadHandler(frame, handler) {
            PostMessageUtilities.removeEventListener(frame, "load", handler);
        }

        /**
         * Sets the iFrame location using a cache bust mechanism,
         * making sure the iFrame is actually loaded and not from cache
         * @param {Object} frame - the iframe DOM object
         * @param {String} src - the source url for the iframe
         * @param {Boolean} bust - flag to indicate usage of cache buster when loading the iframe
         * @private
         */
        function _setIFrameLocation(frame, src, bust){
            src += (0 < src.indexOf("?") ? "&" : "?");

            if (bust) {
                src += "bust=";
                src += (new Date()).getTime() + "&";
            }

            src += ((this.hostParam ? "hostParam=" + this.hostParam + "&" + this.hostParam + "=" : "lpHost=") + encodeURIComponent(PostMessageUtilities.getHost(void 0, frame, true)));

            if (!_isNativeMessageChannelSupported.call(this)) {
                src += "&lpPMCPolyfill=true";
            }

            if (false === this.useObjects) {
                src += "&lpPMDeSerialize=true";
            }

            frame.setAttribute("src", src);
        }

        return {
            initialize: initialize,
            postMessage: postMessage,
            dispose: dispose
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.PostMessageChannel = PostMessageChannel;
    }
    return PostMessageChannel;
}));

;(function (root, chronosRoot, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.PostMessagePromise", ["exports"], function () {
            return factory(root, chronosRoot, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" !== typeof exports) {
        chronosRoot.Chronos = chronosRoot.Chronos || {};
        factory(root, chronosRoot.Chronos);
    }
}(this, typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, hide) {
    "use strict";

    /*jshint validthis:true */
    var ACTION_TYPE = {
        RESOLVE: "resolve",
        REJECT: "reject",
        PROGRESS: "progress"
    };

    /**
     * PostMessagePromise constructor
     * @constructor
     * @param {Function} [executer] - optional method to be invoked during initialization that will have
     *                   arguments of resolve and reject according to ES6 Promise A+ spec
     */
    function PostMessagePromise(executer) {
        // For forcing new keyword
        /* istanbul ignore if  */
        if (false === (this instanceof PostMessagePromise)) {
            return new PostMessagePromise(executer);
        }

        this.initialize(executer);
    }

    PostMessagePromise.prototype = (function () {
        /**
         * Method for initialization
         * @param {Function} [executor] - optional method to be invoked during initialization that will have
         *                   arguments of resolve and reject according to ES6 Promise A+ spec
         *
         */
        function initialize(executor) {
            if (!this.initialized) {
                this.queue = [];
                this.actions = {
                    resolve: resolve.bind(this),
                    reject: reject.bind(this),
                    progress: progress.bind(this)
                };

                // Option to pass executor method
                if ("function" === typeof executor) {
                    executor.call(this, this.actions.resolve, this.actions.reject);
                }
                this.initialized = true;
            }
        }

        /**
         * Method for assigning a defer execution
         * Code waiting for this promise uses this method
         * @param {Function} onresolve - the resolve callback
         * @param {Function} onreject - the reject callback
         * @param {Function} onprogress - the onprogress handler
         */
        function then(onresolve, onreject, onprogress) {
            // Queue the calls to then()
            this.queue.push({
                resolve: onresolve,
                reject: onreject,
                progress: onprogress
            });
        }

        /**
         * Method for resolving the promise
         * @param {Object} [data] - the data to pass the resolve callback
         */
        function resolve(data) {
            _complete.call(this, ACTION_TYPE.RESOLVE, data);
        }

        /**
         * Method for rejecting the promise
         * @param {Object} [data] - the data to pass the resolve callback
         */
        function reject(data) {
            _complete.call(this, ACTION_TYPE.REJECT, data);
        }

        /**
         * Method for calling the progress handler
         * @param {Object} [status] - the status to pass the progress handler
         */
        function progress(status) {
            _completeQueue.call(this, ACTION_TYPE.PROGRESS, status);
        }

        /**
         * Method for calling all queued handlers with a specified type to complete the queue
         * @param {PostMessagePromise.ACTION_TYPE} type - the type of handlers to invoke
         * @param {Object} [arg] - the arg to pass the handler handler
         * @param {Boolean} empty - a flag to indicate whether the queue should be empty after completion
         * @private
         */
        function _completeQueue(type, arg, empty) {
            var i;
            var item;

            if (this.queue && this.queue.length) {
                i = 0;
                item = this.queue[i++];

                while (item) {
                    if (item[type]) {
                        item[type].call(this, arg);
                    }
                    item = this.queue[i++];
                }

                if (empty) {
                    // Clear
                    this.queue.length = 0;
                }
            }
        }

        /**
         * Method for completing the promise (resolve/reject)
         * @param {PostMessagePromise.ACTION_TYPE} type - resolve/reject
         * @param {Object} [arg] - the data to pass the handler
         * @private
         */
        function _complete(type, arg) {
            // Sync/Override then()
            var action = this.actions[type];

            // Override then to invoke the needed action
            this.then = function (resolve, reject) {
                if (action) {
                    action.call(this, arg);
                }
            }.bind(this);

            // Block multiple calls to resolve or reject by overriding
            this.resolve = this.reject = function () {
                throw new Error("This Promise instance had already been completed.");
            };

            // Block progress by overriding with false result
            this.progress = function () {
                return false;
            };

            // Complete all waiting (async) queue
            _completeQueue.call(this, type, arg, true);

            // Clean
            if (this.queue) {
                this.queue.length = 0;
                delete this.queue;
            }
        }

        return {
            initialize: initialize,
            then: then,
            resolve: resolve,
            reject: reject,
            progress: progress
        };
    }());

    /**
     * Method for polyfilling Promise support if not exist
     */
    /* istanbul ignore next  */
    PostMessagePromise.polyfill = function() {
        if (!root.Promise) {
            root.Promise = PostMessagePromise;
        }
    };

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.PostMessagePromise = exports.PostMessagePromise || PostMessagePromise;
    }
    return PostMessagePromise;
}));

;(function (root, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageMapper", ["Chronos.PostMessageUtilities"], function (PostMessageUtilities) {
            return factory(root, root, PostMessageUtilities, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" !== typeof exports) {
        /**
         * @depend ./PostMessageUtilities.js
         */
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.PostMessageUtilities);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, PostMessageUtilities, hide) {
    "use strict";

    /*jshint validthis:true */

    /**
     * PostMessageMapper constructor
     * @constructor
     * @param {Channels} [eventChannel] - the event channel on which events/commands/requests will be bind/triggered (must implement the Channels API)
     */
    function PostMessageMapper(eventChannel) {
        // For forcing new keyword
        /* istanbul ignore if  */
        if (false === (this instanceof PostMessageMapper)) {
            return new PostMessageMapper(eventChannel);
        }

        this.initialize(eventChannel);
    }

    PostMessageMapper.prototype = (function () {
        /**
         * Method for initialization
         * @param {Channels} [eventChannel] - the event channel on which events/commands/requests will be bind/triggered (must implement the Channels API)
         */
        function initialize(eventChannel) {
            if (!this.initialized) {
                this.eventChannel = eventChannel;

                this.initialized = true;
            }
        }

        /**
         * Method mapping the message to the correct event on the event channel and invoking it
         * @param {Object} message - the message to be mapped
         * @returns {Function} the handler function to invoke on the event channel
         */
        function toEvent(message) {
            if (message) {
                if (message.error) {
                    PostMessageUtilities.log("Error on message: " + message.error, "ERROR", "PostMessageMapper");
                    return function() {
                        return message;
                    };
                }
                else {
                    return _getMappedMethod.call(this, message);
                }
            }
        }

        /**
         * Method mapping the method call on the event aggregator to a message which can be posted
         * @param {String} id - the id for the call
         * @param {String} name - the name of the method
         * optional additional method arguments
         * @returns {Object} the mapped method
         */
        function toMessage(id, name) {
            return {
                method: {
                    id: id,
                    name: name,
                    args: Array.prototype.slice.call(arguments, 2)
                }
            };
        }

        /**
         * Method getting the mapped method on the event channel after which it can be invoked
         * @param {Object} message - the message to be mapped
         * optional additional method arguments
         * @return {Function} the function to invoke on the event channel
         * @private
         */
        function _getMappedMethod(message) {
            var method = message && message.method;
            var name = method && method.name;
            var args = method && method.args;
            var eventChannel = this.eventChannel;

            return function() {
                if (eventChannel && eventChannel[name]) {
                    return eventChannel[name].apply(eventChannel, args);
                }
                else {
                    /* istanbul ignore next  */
                    PostMessageUtilities.log("No channel exists", "ERROR", "PostMessageMapper");
                }
            };
        }

        return {
            initialize: initialize,
            toEvent: toEvent,
            toMessage: toMessage
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.PostMessageMapper = exports.PostMessageMapper || PostMessageMapper;
    }
    return PostMessageMapper;
}));

/**
 * LIMITATIONS:
 * 1) Only supports browsers which implements postMessage API and have native JSON implementation (IE8+, Chrome, FF, Safari, Opera, IOS, Opera Mini, Android)
 * 2) IE9-, FF & Opera Mini does not support MessageChannel and therefore we fallback to using basic postMessage.
 *    This makes the communication opened to any handler registered for messages on the same origin.
 * 3) All passDataByRef flags (in LPEventChannel) are obviously ignored
 * 4) In case the browser does not support passing object using postMessage (IE8+, Opera Mini), and no special serialize/deserialize methods are supplied to PostMessageCourier,
 *    All data is serialized using JSON.stringify/JSON.parse which means that Object data is limited to JSON which supports types like:
 *    strings, numbers, null, arrays, and objects (and does not allow circular references).
 *    Trying to serialize other types, will result in conversion to null (like Infinity or NaN) or to a string (Dates)
 *    that must be manually deserialized on the other side
 * 5) When Iframe is managed outside of PostMessageCourier (passed by reference to the constructor),
 *    a targetOrigin option is expected to be passed to the constructor, and a query parameter with the name "lpHost" is expected on the iframe url (unless the PostMessageCourier
 *    at the iframe side, had also been initialized with a valid targetOrigin option)
 */
// TODO: Add Support for target management when there is a problem that requires re-initialization of the target
;(function (root, cacherRoot, circuitRoot, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageCourier", ["Chronos.PostMessageUtilities", "Chronos.Channels", "cacher", "CircuitBreaker", "Chronos.PostMessageChannel", "Chronos.PostMessagePromise", "Chronos.PostMessageMapper"],
            function (PostMessageUtilities, Channels, cacher, CircuitBreaker, PostMessageChannel, PostMessagePromise, PostMessageMapper) {
                return factory(root, root, PostMessageUtilities, Channels,
                    cacher, CircuitBreaker, PostMessageChannel, PostMessagePromise, PostMessageMapper, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" !== typeof exports) {
        /**
         * @depend ../Channels.js
         * @depend ../../node_modules/circuit-breakerjs/src/CircuitBreaker.js
         * @depend ../../node_modules/cacherjs/src/cacher.js
         * @depend ./PostMessageUtilities.js
         * @depend ./PostMessageChannel.js
         * @depend ./PostMessagePromise.js
         * @depend ./PostMessageMapper.js
         */
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.PostMessageUtilities, root.Chronos.Channels,
            cacherRoot.Cacher,  circuitRoot.CircuitBreaker,
            root.Chronos.PostMessageChannel, root.Chronos.PostMessagePromise, root.Chronos.PostMessageMapper);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot,
    typeof CacherRoot === "undefined" ? this : CacherRoot,
    typeof CircuitRoot === "undefined" ? this : CircuitRoot,
    function (root, exports, PostMessageUtilities, Channels, Cacher, CircuitBreaker, PostMessageChannel, PostMessagePromise, PostMessageMapper, hide) {
        "use strict";

        /*jshint validthis:true */
        var MESSAGE_PREFIX = "LPMSG_";
        var ACTION_TYPE = {
            TRIGGER: "trigger",
            COMMAND: "command",
            REQUEST: "request",
            RETURN: "return"
        };
        var DEFAULT_TIMEOUT = 30 * 1000;
        var DEFAULT_CONCURRENCY = 100;
        var DEFAULT_MESSURE_TIME = 30 * 1000;
        var DEFAULT_MESSURE_TOLERANCE = 30;
        var DEFAULT_MESSURE_CALIBRATION = 10;
        var CACHE_EVICTION_INTERVAL = 1000;

        /**
         * PostMessageCourier constructor
         * @constructor
         * @param {Object} options - the configuration options for the instance
         * @param {Object} options.target - the target iframe or iframe configuration
         * @param {String} [options.target.url] - the url to load
         * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @param {String} [options.target.style] - the CSS style to apply
         * @param {String} [options.target.style.width] width of iframe
         * @param {String} [options.target.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
         * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded
         * @param {Object} [options.target.context] - optional context for the callback
         * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded
         * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
         * @param {Object} [options.onready.context] - optional context for the callback
         * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
         * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
         * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
         * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
         * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
         * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
         * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
         * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
         * @param {Function} onmessage - the handler for incoming messages
         * @param {Object} [options.eventChannel] - optional events channel to be used (if not supplied, a new one will be created OR optional events, optional commands, optional reqres to be used
         * @param {Number} [options.timeout = 30000] - optional milliseconds parameter for waiting before timeout to responses (default is 30 seconds)
         * @param {Number} [options.messureTime = 30000] - optional milliseconds parameter for time measurement indicating the time window to apply when implementing the internal fail fast mechanism (default is 30 seconds)
         * @param {Number} [options.messureTolerance = 30] - optional percentage parameter indicating the tolerance to apply on the measurements when implementing the internal fail fast mechanism (default is 30 percents)
         * @param {Number} [options.messureCalibration = 10] optional numeric parameter indicating the calibration of minimum calls before starting to validate measurements when implementing the internal fail fast mechanism (default is 10 calls)
         * @param {Function} [options.ondisconnect] - optional disconnect handler that will be invoked when the fail fast mechanism disconnects the component upon to many failures
         * @param {Function} [options.onreconnect] - optional reconnect handler that will be invoked when the fail fast mechanism reconnects the component upon back to normal behaviour
         *
         * @example
         * var courier = new Chronos.PostMessageCourier({
         *     target: {
         *         url: "http://localhost/chronosjs/debug/courier.frame.html",
         *         style: {
         *             width: "100px",
         *             height: "100px"
         *         }
         *     }
         * });
         */
        function PostMessageCourier(options) {
            // For forcing new keyword
            /* istanbul ignore if  */
            if (false === (this instanceof PostMessageCourier)) {
                return new PostMessageCourier(options);
            }

            this.initialize(options);
        }

        PostMessageCourier.prototype = (function () {
            /**
             * Method for initialization
             * @param {Object} options - the configuration options for the instance
             * @param {Object} options.target - the target iframe or iframe configuration
             * @param {String} [options.target.url] - the url to load
             * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
             * @param {String} [options.target.style] - the CSS style to apply
             * @param {String} [options.target.style.width] width of iframe
             * @param {String} [options.target.style.height] height of iframe
             *          .....
             * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
             * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded
             * @param {Object} [options.target.context] - optional context for the callback
             * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded
             * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
             * @param {Object} [options.onready.context] - optional context for the callback
             * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
             * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
             * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
             * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
             * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
             * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
             * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
             * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
             * @param {Function} onmessage - the handler for incoming messages
             * @param {Boolean} [options.registerExternal] - allows registering external components for triggering to them as well
             * @param {Object} [options.eventChannel] - optional events channel to be used (if not supplied, a new one will be created OR optional events, optional commands, optional reqres to be used
             * @param {Number} [options.timeout = 30000] - optional milliseconds parameter for waiting before timeout to responses (default is 30 seconds)
             * @param {Number} [options.messureTime = 30000] - optional milliseconds parameter for time measurement indicating the time window to apply when implementing the internal fail fast mechanism (default is 30 seconds)
             * @param {Number} [options.messureTolerance = 30] - optional percentage parameter indicating the tolerance to apply on the measurements when implementing the internal fail fast mechanism (default is 30 percents)
             * @param {Number} [options.messureCalibration = 10] optional numeric parameter indicating the calibration of minimum calls before starting to validate measurements when implementing the internal fail fast mechanism (default is 10 calls)
             * @param {Function} [options.ondisconnect] - optional disconnect handler that will be invoked when the fail fast mechanism disconnects the component upon to many failures
             * @param {Function} [options.onreconnect] - optional reconnect handler that will be invoked when the fail fast mechanism reconnects the component upon back to normal behaviour
             */
            function initialize(options) {

                if (!this.initialized) {
                    options = options || {};

                    // Init options for serialization of messages
                    _initializeSerialization.call(this, options);

                    // Init the communication components
                    _initializeCommunication.call(this, options);

                    // Init the cache for handling responses
                    _initializeCache.call(this, options);

                    // Init the fail fast mechanism which monitors responses
                    _initializeFailFast.call(this, options);

                    _registerProxy.call(this, this.eventChannel);

                    // Dumb Proxy methods
                    this.once = this.eventChannel.once;
                    this.hasFiredEvents = this.eventChannel.hasFiredEvents;
                    this.bind = this.eventChannel.bind;
                    this.register = this.eventChannel.register;
                    this.unbind = this.eventChannel.unbind;
                    this.unregister = this.eventChannel.unregister;
                    this.hasFiredCommands = this.eventChannel.hasFiredCommands;
                    this.comply = this.eventChannel.comply;
                    this.stopComplying = this.eventChannel.stopComplying;
                    this.hasFiredReqres = this.eventChannel.hasFiredReqres;
                    this.reply = this.eventChannel.reply;
                    this.stopReplying = this.eventChannel.stopReplying;
                    this.initialized = true;
                }
            }

            /**
             * Registers an external call to trigger for events to propagate calls to Channels.trigger automatically
             * @param eventChannel
             * @private
             */
            function _registerProxy(eventChannel) {
                if (eventChannel && "function" === typeof eventChannel.registerProxy) {
                    eventChannel.registerProxy({
                        trigger: function () {
                            _postMessage.call(this, Array.prototype.slice.apply(arguments), ACTION_TYPE.TRIGGER);
                        },
                        context: this
                    });
                }
            }

            /**
             * Method to get the member instance of the message channel
             * @returns {PostMessageChannel} the member message channel
             */
            function getMessageChannel() {
                return this.messageChannel;
            }

            /**
             * Method to get the member instance of the event channel
             * @returns {Events} the member event channel
             */
            function getEventChannel() {
                return this.eventChannel;
            }

            /**
             * Method to trigger event via post message
             * @link Chronos.Events#trigger
             * @param {Object|String} options - Configuration object or app name
             * @param {String} [options.eventName] - the name of the event triggered
             * @param {String} [options.appName] - optional specifies the identifier it is bound to
             * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
             * @param {Object} [options.data] - optional event parameters to be passed to the listeners
             * @param {String|Boolean} [evName] - the name of the event triggered || [noLocal] - optional boolean flag indicating whether to trigger the event on the local event channel too
             * @param {Object} [data] - optional event parameters to be passed to the listeners
             * @param {Boolean} [noLocal] - optional boolean flag indicating whether to trigger the event on the local event channel too
             * @returns {*}
             *
             * @example
             * courier.trigger({
             *     appName: "frame",
             *     eventName: "got_it",
             *     data: 2
             * });
             */
            function trigger() {
                if (!this.disposed) {
                    var args = Array.prototype.slice.apply(arguments);

                    // We are looking for a "noLocal" param which can only be second or forth
                    // And only if its value is true, we will not trigger the event on the local event channel
                    if (!((2 === arguments.length || 4 === arguments.length) &&
                        true === arguments[arguments.length - 1])) {
                        this.eventChannel.trigger.apply(this.eventChannel, args);
                    }

                    return _postMessage.call(this, args, ACTION_TYPE.TRIGGER);
                }
            }

            /**
             * Method to trigger a command via post message
             * @link Chronos.Commands#command
             * @param {Object|String} options - Configuration object or app name
             * @param {String} [options.cmdName] - the name of the command triggered
             * @param {String} [options.appName] - optional specifies the identifier it is bound to
             * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
             * @param {Object} [options.data] - optional event parameters to be passed to the listeners
             * @param {Function} [callback] - optional callback method to be triggered when the command had finished executing
             * @returns {*}
             *
             * @example
             * courier.command({
             *     appName: "frame",
             *     cmdName: "expect",
             *     data: data
             * }, function(err) {
             *     if (err) {
             *         console.log("Problem invoking command");
             *     }
             * });
             */
            function command() {
                if (!this.disposed) {
                    var args = Array.prototype.slice.apply(arguments);
                    return _postMessage.call(this, args, ACTION_TYPE.COMMAND);
                }
            }

            /**
             * Method to trigger a request via post message
             * @link Chronos.ReqRes#request
             * @param {Object|String} options - Configuration object or app name
             * @param {String} [options.reqName] - the name of the request triggered
             * @param {String} [options.appName] - optional specifies the identifier it is bound to
             * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
             * @param {Object} [options.data] - optional event parameters to be passed to the listeners
             * @param {Function} [callback] - optional callback method to be triggered when the command had finished executing
             * @return {*}
             *
             * @example
             * courier.request({
             *     appName: "iframe",
             *     reqName: "Ma Shlomha?",
             *     data: data
             * }, function(err, data) {
             *      if (err) {
             *          console.log("Problem invoking request");
	         *          return;
	         *      }
             *
             *      // Do Something with data
             * });
             */
            function request() {
                if (!this.disposed) {
                    var args = Array.prototype.slice.apply(arguments);
                    return _postMessage.call(this, args, ACTION_TYPE.REQUEST);
                }
            }

            /**
             * Method for disposing the object
             */
            function dispose() {
                if (!this.disposed) {
                    this.messageChannel.dispose();
                    this.messageChannel = void 0;
                    this.eventChannel = void 0;
                    this.mapper = void 0;
                    this.callbackCache = void 0;
                    this.circuit = void 0;
                    this.disposed = true;
                }
            }

            /**
             * Method for initializing the options for serialization of messages
             * @param {Boolean} [options.useObjects = true upon browser support] - optional indication for passing objects by reference
             * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
             * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
             * @private
             */
            function _initializeSerialization(options) {
                this.useObjects = false === options.useObjects ? options.useObjects : _getUseObjectsUrlIndicator();
                if ("undefined" === typeof this.useObjects) {
                    // Defaults to true
                    this.useObjects = true;
                }
                options.useObjects = this.useObjects;

                // Define the serialize/deserialize methods to be used
                if ("function" !== typeof options.serialize || "function" !== typeof options.deserialize) {
                    if (this.useObjects && PostMessageUtilities.hasPostMessageObjectsSupport()) {
                        this.serialize = _de$serializeDummy;
                        this.deserialize = _de$serializeDummy;
                    }
                    else {
                        this.serialize = PostMessageUtilities.stringify;
                        this.deserialize = JSON.parse;
                    }

                    options.serialize = this.serialize;
                    options.deserialize = this.deserialize;
                }
                else {
                    this.serialize = options.serialize;
                    this.deserialize = options.deserialize;
                }
            }

            /**
             * Method for initializing the communication elements
             * @param {Object} [options.eventChannel] - optional events channel to be used (if not supplied, a new one will be created OR optional events, optional commands, optional reqres to be used
             * @private
             */
            function _initializeCommunication(options) {
                var mapping;
                var onmessage;

                // Grab the event channel and initialize a new mapper
                this.eventChannel = options.eventChannel || new Channels({
                    events: options.events,
                    commands: options.commands,
                    reqres: options.reqres
                });
                this.mapper = new PostMessageMapper(this.eventChannel);

                // Bind the mapping method to the mapper
                mapping = this.mapper.toEvent.bind(this.mapper);
                // Create the message handler which uses the mapping method
                onmessage = _createMessageHandler(mapping).bind(this);

                // Initialize a message channel with the message handler
                this.messageChannel = new PostMessageChannel(options, onmessage);
            }

            /**
             * Method for initializing the cache for responses
             * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
             * @param {Number} [options.timeout = 30000] - optional milliseconds parameter for waiting before timeout to responses (default is 30 seconds)
             * @private
             */
            function _initializeCache(options) {
                this.callbackCache = new Cacher({
                    max: PostMessageUtilities.parseNumber(options.maxConcurrency, DEFAULT_CONCURRENCY),
                    ttl: PostMessageUtilities.parseNumber(options.timeout, DEFAULT_TIMEOUT),
                    interval: CACHE_EVICTION_INTERVAL
                });
            }

            /**
             * Method for initializing the fail fast mechanisms
             * @param {Number} [options.messureTime = 30000] - optional milliseconds parameter for time measurement indicating the time window to apply when implementing the internal fail fast mechanism (default is 30 seconds)
             * @param {Number} [options.messureTolerance = 30] - optional percentage parameter indicating the tolerance to apply on the measurements when implementing the internal fail fast mechanism (default is 30 percents)
             * @param {Number} [options.messureCalibration = 10] optional numeric parameter indicating the calibration of minimum calls before starting to validate measurements when implementing the internal fail fast mechanism (default is 10 calls)
             * @param {Function} [options.ondisconnect] - optional disconnect handler that will be invoked when the fail fast mechanism disconnects the component upon to many failures
             * @param {Function} [options.onreconnect] - optional reconnect handler that will be invoked when the fail fast mechanism reconnects the component upon back to normal behaviour
             * @private
             */
            function _initializeFailFast(options) {
                var messureTime = PostMessageUtilities.parseNumber(options.messureTime, DEFAULT_MESSURE_TIME);
                this.circuit = new CircuitBreaker({
                    timeWindow: messureTime,
                    slidesNumber: Math.ceil(messureTime / 100),
                    tolerance: PostMessageUtilities.parseNumber(options.messureTolerance, DEFAULT_MESSURE_TOLERANCE),
                    calibration: PostMessageUtilities.parseNumber(options.messureCalibration, DEFAULT_MESSURE_CALIBRATION),
                    onopen: PostMessageUtilities.parseFunction(options.ondisconnect, true),
                    onclose: PostMessageUtilities.parseFunction(options.onreconnect, true)
                });
            }

            /**
             * Method to get url indication for using serialization/deserialization
             * @returns {Boolean} indication for serialization/deserialization usage
             * @private
             */
            function _getUseObjectsUrlIndicator() {
                var deserialize = PostMessageUtilities.getURLParameter("lpPMDeSerialize");

                if ("true" === deserialize) {
                    return false;
                }
            }

            /**
             * Just a dummy serialization/deserialization method for browsers supporting objects with postMessage API
             * @param {Object} object - the object to (NOT) serialize/deserialize.
             * @returns {Object} The same object
             */
            function _de$serializeDummy(object) {
                return object;
            }

            /**
             * Method for posting the message via the circuit breaker
             * @param {Array} args - the arguments for the message to be processed.
             * @param {String} name - name of type of command.
             * @private
             */
            function _postMessage(args, name) {
                return this.circuit.run(function (success, failure, timeout) {
                    var message = _prepare.call(this, args, name, timeout);

                    if (message) {
                        try {
                            var initiated = this.messageChannel.postMessage.call(this.messageChannel, message);

                            if (false === initiated) {
                                failure();
                            }
                            else {
                                success();
                            }
                        }
                        catch (ex) {
                            failure();
                        }
                    }
                    else {
                        // Cache is full, as a fail fast mechanism, we should not continue
                        failure();
                    }
                }.bind(this));
            }

            /**
             * Method for posting the returned message via the circuit breaker
             * @param {Object} message - the message to post.
             * @param {bject} [target] - optional target for post.
             * @private
             */
            function _returnMessage(message, target) {
                return this.circuit.run(function (success, failure) {
                    try {
                        var initiated = this.messageChannel.postMessage.call(this.messageChannel, message, target);

                        if (false === initiated) {
                            failure();
                        }
                        else {
                            success();
                        }
                    }
                    catch (ex) {
                        failure();
                    }
                }.bind(this));
            }

            /**
             * Method for preparing the message to be posted via the postmessage and caching the callback to be called if needed
             * @param {Array} args - the arguments to pass to the message mapper
             * @param {String} name - the action type name (trigger, command, request)
             * @param {Function} [ontimeout] - the ontimeout measurement handler
             * @returns {Function} handler function for messages
             * @private
             */
            function _prepare(args, name, ontimeout) {
                var method;
                var ttl;
                var id = PostMessageUtilities.createUniqueSequence(MESSAGE_PREFIX + name + PostMessageUtilities.SEQUENCE_FORMAT);

                args.unshift(id, name);

                if (_isTwoWay(name)) {
                    if (1 < args.length && "function" === typeof args[args.length - 1]) {
                        method = args.pop();
                    }
                    else if (2 < args.length && !isNaN(args[args.length - 1]) && "function" === typeof args[args.length - 2]) {
                        ttl = parseInt(args.pop(), 10);
                        method = args.pop();
                    }

                    if (method) {
                        if (!this.callbackCache.set(id, method, ttl, function (id, callback) {
                                ontimeout();
                                _handleTimeout.call(this, id, callback);
                            }.bind(this))) {
                            // Cache is full, as a fail fast mechanism, we will not continue
                            return void 0;
                        }
                    }
                }

                return this.mapper.toMessage.apply(this.mapper, args);
            }

            /**
             * Method for checking two way communication for action
             * @param {PostMessageCourier.ACTION_TYPE} action - the action type name
             * @returns {Boolean} flag to indicate whether the action is two way (had return call)
             * @private
             */
            function _isTwoWay(action) {
                return ACTION_TYPE.REQUEST === action || ACTION_TYPE.COMMAND === action;
            }

            /**
             * Method for handling timeout of a cached callback
             * @param {String} id - the id of the timed out callback
             * @param {Function} callback - the callback object from cache
             * @private
             */
            function _handleTimeout(id, callback) {
                // Handle timeout
                if (id && "function" === typeof callback) {
                    try {
                        callback.call(null, new Error("Callback: Operation Timeout!"));
                    }
                    catch (ex) {
                        /* istanbul ignore next  */
                        PostMessageUtilities.log("Error while trying to handle the timeout using the callback", "ERROR", "PostMessageCourier");
                    }
                }
            }

            /**
             * Method for handling return messages from the callee
             * @param {String} id - the id of the callback
             * @param {Object} method - the method object with needed args
             * @private
             */
            function _handleReturnMessage(id, method) {
                var callback = this.callbackCache.get(id, true);
                var args = method && method.args;

                if ("function" === typeof callback) {
                    // First try to parse the first parameter in case the error is an object
                    if (args && args.length && args[0] && "Error" === args[0].type && "string" === typeof args[0].message) {
                        args[0] = new Error(args[0].message);
                    }

                    try {
                        callback.apply(null, args);
                    }
                    catch (ex) {
                        PostMessageUtilities.log("Error while trying to handle the returned message from request/command", "ERROR", "PostMessageCourier");
                    }
                }
            }

            /**
             * Method for creation of a return message handler from the callee
             * @param {String} id - the id of the message
             * @param {String} name - message name
             * @param {Object} message - original message structure
             * @private
             */
            function _getReturnMessageHandler(id, name, message) {
                /* istanbul ignore next: it is being covered at the iframe side - cannot add it to coverage matrix  */
                return function(err, result) {
                    var retMsg;
                    var params;
                    var error = err;

                    // In case of Error Object, create a special object that can be parsed
                    if (err instanceof Error) {
                        error = {
                            type: "Error",
                            message: err.message
                        };
                    }

                    // Call the mapping method to receive the message structure
                    params = [id, ACTION_TYPE.RETURN, error];

                    if (ACTION_TYPE.REQUEST === name) {
                        params.push(result);
                    }

                    retMsg = this.mapper.toMessage.apply(this.mapper, params);

                    // Post the message
                    _returnMessage.call(this, retMsg, message.source);
                }.bind(this);
            }

            /**
             * Method for handling the result of the call (this can be the response or a defer/promise)
             * @param {String} id - the id of the message
             * @param {String} name - message name
             * @param {Object} result - the result object
             * @param {Object} message - original message structure
             * @private
             */
            function _handleResult(id, name, result, message) {
                var retMsg;
                var params;

                // If the result is async (promise) we need to defer the execution of the results data
                if (("undefined" !== typeof Promise && result instanceof Promise) || result instanceof PostMessagePromise) {
                    // Handle async using promises
                    result.then(function (data) {
                        params = [id, ACTION_TYPE.RETURN, null];

                        if (ACTION_TYPE.REQUEST === name) {
                            params.push(data);
                        }

                        // Call the mapping method to receive the message structure
                        retMsg = this.mapper.toMessage.apply(this.mapper, params);

                        // Post the message
                        _returnMessage.call(this, retMsg, message.source);
                    }.bind(this), function (data) {
                        params = [id, ACTION_TYPE.RETURN, data];

                        // Call the mapping method to receive the message structure
                        retMsg = this.mapper.toMessage.apply(this.mapper, params);

                        // Post the message
                        _returnMessage.call(this, retMsg, message.source);
                    }.bind(this));
                }
                else {
                    if (result && result.error) {
                        params = [id, ACTION_TYPE.RETURN, result];

                        // Call the mapping method to receive the message structure
                        retMsg = this.mapper.toMessage.apply(this.mapper, params);

                        // Post the message
                        _returnMessage.call(this, retMsg, message.source);
                    }
                    else if ("undefined" !== typeof result) {
                        params = [id, ACTION_TYPE.RETURN, null];

                        if (ACTION_TYPE.REQUEST === name) {
                            params.push(result);
                        }

                        // Call the mapping method to receive the message structure
                        retMsg = this.mapper.toMessage.apply(this.mapper, params);

                        // Post the message
                        _returnMessage.call(this, retMsg, message.source);
                    }
                }
            }
            /**
             * Method for wrapping the handler of the postmessage for parsing
             * @param {Object} mapping - the handler for incoming messages to invoke which maps the message to event
             * @returns {Function} handler function for messages
             * @private
             */
            function _createMessageHandler(mapping) {
                return function(message) {
                    var handler;
                    var result;
                    var params;
                    var retMsg;
                    var id;
                    var name;
                    var args;

                    if (message) {
                        id = message.method && message.method.id;
                        name = message.method && message.method.name;
                        args = message.method && message.method.args;

                        // In case the message is a return value from a request/response call
                        // It is marked as a "return" message and we need to call the supplied cached callback
                        if (ACTION_TYPE.RETURN === name) {
                            _handleReturnMessage.call(this, id, message.method);
                        }
                        else {
                            // Call the mapping method to receive the handling method on the event channel
                            // Invoke the handling method
                            try {
                                if (_isTwoWay(name)) {
                                    if (args.length) {
                                        args.push(_getReturnMessageHandler.call(this, id, name, message));
                                    }
                                }

                                handler = mapping(message);
                                result = handler && handler();
                            }
                            catch (ex) {
                                /* istanbul ignore next: special handling for other implementations of channels which does not catch exceptions from triggers (like backbone) - when working with chronos channels it will not be called  */
                                PostMessageUtilities.log("Error while trying to invoke the handler on the events channel", "ERROR", "PostMessageCourier");
                                /* istanbul ignore next: special handling for other implementations of channels which does not catch exceptions from triggers (like backbone) - when working with chronos channels it will not be called  */
                                if (_isTwoWay(name)) {
                                    params = [id, ACTION_TYPE.RETURN, {error: ex.toString()}];
                                    retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                    _returnMessage.call(this, retMsg, message.source);
                                }
                            }

                            // In case the method is two way and returned a result
                            if (_isTwoWay(name) && "undefined" !== typeof result) {
                                _handleResult.call(this, id, name, result, message);
                            }
                        }
                    }
                };
            }

            return {
                initialize: initialize,
                getMessageChannel: getMessageChannel,
                getEventChannel: getEventChannel,
                trigger: trigger,
                publish: trigger,
                command: command,
                request: request,
                dispose: dispose
            };
        }());

        // attach properties to the exports object to define
        // the exported module properties.
        if (!hide) {
            exports.PostMessageCourier = exports.PostMessageCourier || PostMessageCourier;
        }
        return PostMessageCourier;
    }));
