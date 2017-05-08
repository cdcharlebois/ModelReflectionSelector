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
        _members: null,

        // promises
        __getObjects: null,
        __getAssociations: null,
        __getMembers: null,




        constructor: function() {
            this._handles = [];
            this.__getObjects = new Promise(
                lang.hitch(this, function(resolve, reject) {
                    mx.data.get({
                        xpath: "//MxModelReflection.MxObjectType",
                        callback: lang.hitch(this, function(objs) {
                            // console.log("Received " + objs.length + " MxObjects");
                            this._entities = objs;
                            resolve();
                        }),
                        error: lang.hitch(function(err) {
                            reject('could not fetch objects')
                        })
                    });
                })
            );

            this.__getAssociations = new Promise(
                lang.hitch(this, function(resolve, reject) {
                    mx.data.get({
                        xpath: "//MxModelReflection.MxObjectReference",
                        callback: lang.hitch(this, function(objs) {
                            // console.log("Received " + objs.length + " MxObjects");
                            this._associations = objs;
                            resolve();
                        }),
                        error: lang.hitch(function(err) {
                            reject('could not fetch associations')
                        })
                    });
                })
            );

            this.__getMembers = new Promise(
                lang.hitch(this, function(resolve, reject) {
                    mx.data.get({
                        xpath: "//MxModelReflection.MxObjectMember",
                        callback: lang.hitch(this, function(objs) {
                            // console.log("Received " + objs.length + " MxObjects");
                            this._members = objs;
                            resolve();
                        }),
                        error: lang.hitch(function(err) {
                            reject('could not fetch members')
                        })
                    });
                })
            );
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            $(this.submitButton).on('click', lang.hitch(this, function() {
                this._formatOutput($('.mxreflectionselector').jstree().get_checked(true));
            }));
        },

        update: function(obj, callback) {
            Promise.all([
                    this.__getObjects,
                    this.__getAssociations,
                    this.__getMembers
                ])
                .then(lang.hitch(this, function(fulfilled) {
                    this._updateRendering(callback);
                }))
                .catch(lang.hitch(this, function(error) {
                    console.error("_    _ _                           _ \n" +
                        "| |  | | |                         | |\n" +
                        "| |  | | |__   ___   ___  _ __  ___| |\n" +
                        "| |/\\| | '_ \\ / _ \\ / _ \\| '_ \\/ __| |\n" +
                        "\\  /\\  / | | | (_) | (_) | |_) \\__ \\_|\n" +
                        " \\/  \\/|_| |_|\\___/ \\___/| .__/|___(_)\n" +
                        "                         | |          \n" +
                        "                         |_|          \n" +
                        "is Model Reflection installed and turned on?");
                    this._executeCallback(callback);
                }));
            // this.__getObjects
            //     .then(this.__getAssociations)
            //     .then(this.__getMembers)
            //     .then()
            //     .catch(function(error) {
            //         console.log(error.message)
            //     });
            // // this._updateRendering(callback);
            // 
            // mx.data.get({
            //     xpath: "//MxModelReflection.MxObjectType",
            //     // xpath: "//MxModelReflection.MxObjectReference",
            //     callback: lang.hitch(this, function(objs) {
            //         console.log("Received " + objs.length + " MxObjects");
            //         // this._rfxObjects = objs;
            //         // this._renderCheckboxes(objs);
            //         this._entities = objs; // set entities
            //         mx.data.get({
            //             // xpath: "//MxModelReflection.MxObjectType",
            //             xpath: "//MxModelReflection.MxObjectReference",
            //             callback: lang.hitch(this, function(objs) {
            //                 console.log("Received " + objs.length + " MxObjects");
            //                 // this._rfxObjects = objs;
            //                 // this._renderCheckboxes(objs);
            //                 this._associations = objs; // set associations...
            //                 mx.data.get({
            //                     // xpath: "//MxModelReflection.MxObjectType",
            //                     xpath: "//MxModelReflection.MxObjectMember",
            //                     callback: lang.hitch(this, function(objs) {
            //                         console.log("Received " + objs.length + " MxObjects");
            //                         // this._rfxObjects = objs;
            //                         // this._renderCheckboxes(objs);
            //                         this._members = objs; // set members...

            //                         this._contextObj = obj;
            //                         this._updateRendering(callback);
            //                     })
            //                 }, this);
            //             })
            //         }, this);
            //     })
            // }, this);

            logger.debug(this.id + ".update");


        },

        resize: function(box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
        },

        _formatOutput: function(data) {
            var self = this;
            // {
            // objectType: "TestData.Customer",             node.text
            // all: "true",                                 true
            // "members": {                                 
            //     "TestData.Address_Customer": {           node.children[i].text
            //         "objectType": "TestData.Address",    node.children[i].text
            //         all: true
            //     },
            // }
            var ret = [];
            // get top level objects
            var topLevelObjects = data.filter(function(node) {
                return node.data.level === 1;
            });
            topLevelObjects.forEach(function(obj) {
                var dxobj = {
                    objectType: obj.data.name,
                    all: true,
                    members: {}
                };
                var children = self.__getChildren(data, obj);
                children.forEach(function(child) {
                    if (child.type === 'attr') {
                        // if attribute, add it as a member
                        dxobj.members[child.data.name.split(' / ')[1]] = true;
                    } else if (child.type === 'assc') {
                        // if association, add the association as a property and then embed the object below
                        // get the association's child
                        var childObj = self.__getChildren(data, child)[0];
                        // get child attributes again
                        var childObjChildren = self.__getChildren(data, childObj);
                        var tempMembers = {};
                        childObjChildren.forEach(function(child) {
                            tempMembers[child.data.name.split(' / ')[1]] = true;
                        });
                        dxobj.members[child.data.name] = {
                            objectType: childObj.data.name,
                            all: false,
                            members: tempMembers
                        };

                    }

                });
                ret.push(dxobj);
            });

            console.log(data);
            console.log(JSON.stringify(ret[0]));
        },

        // get children nodes of `parent` in `tree`
        __getChildren: function(tree, parent) {
            return tree.filter(function(node) {
                return node.parent === parent.id
            });
        },

        _buildLinks: function(data) {
            // given the json data for the tree:
            // for each node that has a child node (a) of type 'assc'
            // find the node on the other end
            // add as child of node (a)
            data.forEach(function(node) {
                var associationNodes = node.children.filter(function(childNode) {
                    return childNode.type === 'assc'
                });
                associationNodes.forEach(function(associationNode) {
                    var child = null;
                    if (node.data.guid === associationNode.data.parent) {
                        // add the child node
                        child = data.find(function(n) {
                            return n.data.guid === associationNode.data.child;
                        })
                    } else {
                        // add the parent node
                        child = data.find(function(n) {
                            return n.data.guid === associationNode.data.parent;
                        })
                    }
                    // child.id = child.text + '_2';
                    var newChild = JSON.parse(JSON.stringify(child));
                    // remove further associations to prevent infinite loops
                    newChild.children = newChild.children.filter(function(c) {
                        return c.type != 'assc';
                    });
                    newChild.data.level = 3;
                    associationNode.children = [newChild];
                });

            });
        },

        _getChildrenNodesForParentObject: function(parent) {
            var ret = [];
            // given a parent ID
            var pid = parent.getGuid();
            // find all associations whose parent or child is this parent ID
            this._associations.forEach(function(a) {
                if (a.get("MxModelReflection.MxObjectReference_MxObjectType_Parent")[0] === pid ||
                    a.get("MxModelReflection.MxObjectReference_MxObjectType_Child")[0] === pid) {
                    ret.push({
                        text: a.get('Name'),
                        type: 'assc',
                        data: {
                            guid: a.getGuid(),
                            name: a.get('CompleteName'),
                            parent: a.get("MxModelReflection.MxObjectReference_MxObjectType_Parent")[0],
                            child: a.get("MxModelReflection.MxObjectReference_MxObjectType_Child")[0],
                            level: 2
                        }
                    });
                }
            });
            this._members.forEach(function(a) {
                if (a.get("MxModelReflection.MxObjectMember_MxObjectType") === pid) {
                    ret.push({
                        text: a.get('AttributeName'),
                        type: 'attr',
                        data: {
                            guid: a.getGuid(),
                            name: a.get('CompleteName'),
                            level: 2
                        }
                    });
                }
            });
            return ret;
            // .get("MxModelReflection.MxObjectReference_MxObjectType_Parent")
            // .get("MxModelReflection.MxObjectReference_MxObjectType_Child")
        },

        _renderCheckboxes: function() {
            var data = this._entities.map(lang.hitch(this, function(obj) {
                return {
                    text: obj.get('Name'),
                    type: 'obj',
                    // query to grab the attributes
                    children: this._getChildrenNodesForParentObject(obj),
                    data: {
                        guid: obj.getGuid(),
                        name: obj.get('CompleteName'),
                        level: 1
                    }
                }
            }));
            this._buildLinks(data);
            $('.mxreflectionselector').jstree({
                plugins: ['checkbox', 'wholerow', 'types', 'state'],
                checkbox: {
                    keep_selected_style: false,
                    three_state: false,
                    cascade: 'down'
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
                        icon: "glyphicon glyphicon-link",
                        valid_children: ['obj']
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