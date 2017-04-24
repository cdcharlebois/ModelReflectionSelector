define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "ModelReflectionSelector/widget/lib/jquery-1.11.2",
    "ModelReflectionSelector/widget/lib/jstree",

    "dojo/text!ModelReflectionSelector/widget/template/ModelReflectionSelector.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, jQuery, jsTree, widgetTemplate) {
    "use strict";

    var $ = jQuery.noConflict(true);

    return declare("ModelReflectionSelector.widget.ModelReflectionSelector", [_WidgetBase, _TemplatedMixin], {

        templateString: widgetTemplate,


        widgetBase: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _entities: null,
        _associations: null,

        constructor: function() {
            this._handles = [];
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            $(this.submitButton).on('click', function() {
                console.log($('.mxreflectionselector').jstree().get_selected(true));
            });
        },

        update: function(obj, callback) {
            mx.data.get({
                xpath: "//MxModelReflection.MxObjectType",
                // xpath: "//MxModelReflection.MxObjectReference",
                callback: lang.hitch(this, function(objs) {
                    console.log("Received " + objs.length + " MxObjects");
                    // this._rfxObjects = objs;
                    // this._renderCheckboxes(objs);
                    this._entities = objs; // set entities
                    mx.data.get({
                        // xpath: "//MxModelReflection.MxObjectType",
                        xpath: "//MxModelReflection.MxObjectReference",
                        callback: lang.hitch(this, function(objs) {
                            console.log("Received " + objs.length + " MxObjects");
                            // this._rfxObjects = objs;
                            // this._renderCheckboxes(objs);
                            this._associations = objs; // set associations...
                            this._contextObj = obj;
                            this._updateRendering(callback);
                        })
                    }, this);
                })
            }, this);

            logger.debug(this.id + ".update");


        },

        resize: function(box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
        },

        _getChildrenNodesForParent: function(parent) {
            var ret = [];
            // given a parent ID
            var pid = parent.getGuid();
            // find all associations whose parent or child is this parent ID
            this._associations.forEach(function(a) {
                if (a.get("MxModelReflection.MxObjectReference_MxObjectType_Parent")[0] === pid ||
                    a.get("MxModelReflection.MxObjectReference_MxObjectType_Child")[0] === pid) {
                    ret.push(a);
                }
            });
            return ret.map(function(association) {
                    return {
                        text: association.get('Name'),
                        type: 'assc'
                    }
                })
                // .get("MxModelReflection.MxObjectReference_MxObjectType_Parent")
                // .get("MxModelReflection.MxObjectReference_MxObjectType_Child")
        },

        _renderCheckboxes: function() {
            var data = this._entities.map(lang.hitch(this, function(obj) {
                return {
                    text: obj.get('Name'),
                    type: 'obj',
                    // query to grab the attributes
                    children: this._getChildrenNodesForParent(obj),
                }
            }));
            $('.mxreflectionselector').jstree({
                plugins: ['checkbox', 'wholerow', 'types', 'state'],
                checkbox: {
                    keep_selected_style: false,
                    three_state: true
                },
                types: {
                    "obj": {
                        icon: "glyphicon glyphicon-th-large",
                        valid_children: ['attr', 'assc']
                    },
                    "attr": {
                        icon: "glyphicon glyphicon-list"
                    },
                    "assc": {
                        icon: "glyphicon glyphicon-link"
                    }
                },
                core: {
                    themes: {
                        variant: 'large',
                        stripes: true
                    },
                    data: data
                }
            });
        },

        _updateRendering: function(callback) {
            logger.debug(this.id + "._updateRendering");

            this._renderCheckboxes();

            this._executeCallback(callback);
        },

        _executeCallback: function(cb) {
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["ModelReflectionSelector/widget/ModelReflectionSelector"]);