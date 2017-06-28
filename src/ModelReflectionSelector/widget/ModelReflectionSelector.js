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
        outputAttribute: null,
		clickMicroflow: null,

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
            this._contextObj = obj;
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

        __buildOutput: function(thisnode, selected) {
            var self = this;
            var ret = {};
            // if @node is an object,
            if (thisnode.type === 'obj') {
                // objecttype
                ret.objectType = thisnode.data.name;

                // Keys
                var myKeys = selected.filter(function(node) {
                    return node.parent === thisnode.id && node.type == 'attr' && node.data.isKey === true
                });
				if( myKeys.length > 0 ) {
					ret.keys = {};
					myKeys.forEach(function(member) {
						ret.keys[member.data.name.split(' / ')[1]] = true;
					});
				}

                // members
                var myMembers = selected.filter(function(node) {
                    return node.parent === thisnode.id && node.type !== 'assc' //&& node.data.isKey !== true
                });
				if( myMembers.length > 0 ) {
					ret.members = {};
					myMembers.forEach(function(member) {
						ret.members[member.data.name.split(' / ')[1]] = true;
					});
				}
				
                // associations
                var myAssociations = selected.filter(function(node) {
                    return node.parent === thisnode.id && node.type === 'assc'
                });
				// Only reset the .members if we have associations, and if members hasn't been created previously
				if( ret.members == null && myAssociations.length > 0 )
					ret.members = {};
                myAssociations.forEach(function(association) {
                    ret.members[association.data.name] = self.__buildOutput(association, selected)
                });
            } else if (thisnode.type === 'assc') {
                // get the child object
                var child = selected.find(function(node) {
                    return node.parent === thisnode.id;
                });
                // return __buildoutput for the child
				
				//Child can be null if we only check the association box but not the enity or attributes
				if( child != null )
					return self.__buildOutput(child, selected);
            }
            return ret;

        },

        _formatOutput: function(data) {
			if( data.length == 0 ) {
				mx.ui.info( 'Please select at least 1 enity' );
				return;
			}
			
            var output = this.__buildOutput(data[0], data);
			var jsonOutput = JSON.stringify(output);
			if( jsonOutput == '{}' ) {
				mx.ui.info( 'Please select at least 1 enity' );
				return;
			}
			
            console.log(output);

            this._contextObj.set(this.outputAttribute, jsonOutput)
            mx.data.commit({
                mxobj: this._contextObj,
                callback: function() {
                    console.log("Object committed");
                },
                error: function(e) {
                    console.error("Error occurred attempting to commit: " + e);
                }
            });
			
			this._executeMicroflow(this.clickMicroflow, this._contextObj);
        },

        // get children nodes of `parent` in `tree`
        __getChildrenInTree: function(tree, parent) {
            return tree.filter(function(node) {
                return node.parent === parent.id
            });
        },


        _executeMicroflow : function (mf, obj) {
            if (mf && obj) {
                mx.data.action({
                    store: {
                       caller: this.mxform
                    },
                    params: {
                        actionname  : mf,
                        applyto     : "selection",
                        guids       : [obj.getGuid()]
                    },
                    callback: function () {
                        // ok
                    },
                    error: function (e) {
                        logger.error("Error whiel executing microflow: " + mf + " error: " + e);
                    }
                });
            }
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
                // nodes with associations
                associationNodes.forEach(function(associationNode) {
                    var child = null;
                    if (node.data.guid === associationNode.data.parent) {
                        // add the child node
                        child = data.find(function(n) {
                            return associationNode.data.child.indexOf( n.data.guid ) >= 0;
                        })
                    } else {
                        // add the parent node
                        child = data.find(function(n) {
                            return associationNode.data.parent.indexOf( n.data.guid ) >= 0;
                        })
                    }
                    // child.id = child.text + '_2';
                    var newChild = JSON.parse(JSON.stringify(child));
                    // newChild.data.level = associationNode.data.level + 1
                    // remove further associations to prevent infinite loops
                    newChild.children = newChild.children.filter(function(c) {
                        return c.type != 'assc';
                    });
                    newChild.data.level = 3;
                    associationNode.children = [newChild];
                });

            });
        },

        _getChildrenNodesForParentObject: function(pid, parentlevel) {
            var ret = [];
			
			this._members = this._doSortOnText( this._members);
            this._members.forEach(function(a) {
                if (a.get("MxModelReflection.MxObjectMember_MxObjectType") === pid) {
                    ret.push({
                        text: a.get('AttributeName'),
                        type: 'attr',
                        data: {
                            treeparent: pid,
                            guid: a.getGuid(),
                            name: a.get('CompleteName'),
                            level: parentlevel + 1
                        }
                    });
                }
            });
            
		    // given a parent ID
            // var pid = parent.getGuid();
            // find all associations whose parent or child is this parent ID

			this._associations = this._doSortOnText( this._associations);
            this._associations.forEach(function(a) {
                if (a.get("MxModelReflection.MxObjectReference_MxObjectType_Parent").find(function(n) { return n === pid })  ||
                    a.get("MxModelReflection.MxObjectReference_MxObjectType_Child").find(function(n) { return n === pid }) ) {
                    ret.push({
                        text: a.get('CompleteName'),
                        type: 'assc',
                        children: true,
                        data: {
                            treeparent: pid,
                            guid: a.getGuid(),
                            name: a.get('CompleteName'),
                            parent: a.get("MxModelReflection.MxObjectReference_MxObjectType_Parent").join('|'),
                            child: a.get("MxModelReflection.MxObjectReference_MxObjectType_Child").join('|'),
                            level: parentlevel + 1
                        }
                    });
                }
            });
			
			return ret;
			/*return ret.sort(function(a, b) {
                if (a.text < b.text) return -1;
                else if (a.text > b.text) return 1;
                return 0;
            });*/
            // .get("MxModelReflection.MxObjectReference_MxObjectType_Parent")
            // .get("MxModelReflection.MxObjectReference_MxObjectType_Child")
        },
		
		_doSortOnText: function( array ) {
			return array.sort(function(a, b) {
					if (a.text < b.text) return -1;
					else if (a.text > b.text) return 1;
					return 0;
				});
		},

        _renderCheckboxes: function() {
            var self = this;
            var data = this._entities.map(lang.hitch(this, function(obj) {
                return {
                    text: obj.get('CompleteName'),
                    type: 'obj',
                    // query to grab the attributes
                    children: true,
                    data: {
                        guid: obj.getGuid(),
                        name: obj.get('CompleteName'),
                        level: 1
                    }
                }
            })).sort(function(a, b) {
                if (a.text < b.text) return -1;
                else if (a.text > b.text) return 1;
                return 0;
            });
            // this._buildLinks2(data, 2);
            // this._buildLinks(data);
            // console.log("Final Data in Tree:")
            // console.log(data);
            $('.mxreflectionselector').jstree({
                plugins: ['checkbox', 'wholerow', 'types', 'state', 'contextmenu'],
                checkbox: {
                    keep_selected_style: false,
                    three_state: false,
                    cascade: ''
                },
                contextmenu: {
                    items: function(node) {
                        if (node.type !== 'attr')
                            return null
                        else {
                            return {
                                "useaskey": {
                                    label: 'Use as key',
                                    action: function(e) {
                                        //somehow show that this node is a key
                                        if( node.data.isKey !== true ) {
											node.data.isKey = true;
											node.data.oriText = node.text;
											$('.mxreflectionselector').jstree('rename_node', node , node.text + " 🔑");
										}
										else {
											node.data.isKey = false;
											$('.mxreflectionselector').jstree('rename_node', node , node.data.oriText);
										}
                                    }
                                }
                            };
                        }
                    },
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
                    check_callback: true,
                    themes: {
                        variant: 'large',
                        stripes: true
                    },
                    // data: data,
                    data: function(node, render) {
                        if (node.id === '#') {
                            render(data) //
                        } else {
                            render(self.__getChildren2(node)) //function to get children
                        }
                    }

                }
            });
			
			    // Selection Actions
    $('.mxreflectionselector').on("select_node.jstree", function (e, data) {
		if( !this.cascade )
			this.cascade = 0;

        var parentNode = data.node.parent;
		if( parentNode !== "#") {
			this.cascade++;
			$('.mxreflectionselector').jstree('select_node', parentNode);
			this.cascade--;
		}
		
		if( this.cascade <= 0 ) {
			var children = data.node.children;
			this.cascade--;
			$('.mxreflectionselector').jstree('select_node', children);
			this.cascade++;
		}
    });

    // Deselection Actions
    $('.mxreflectionselector').on("deselect_node.jstree", function (e, data) {
		var children = data.node.children;
        $('.mxreflectionselector').jstree('deselect_node', children);
    });
        },

        __getChildren2: function(node) {
            var childrenNodes = []
            if (node.type != 'assc') {
                childrenNodes = childrenNodes.concat(this._getChildrenNodesForParentObject(node.data.guid, node.data.level));
            } else {
                // this is an association
                childrenNodes = childrenNodes.concat(this.__getAssociationChildren(
                    node.data.parent,
                    node.data.child,
                    node.data.treeparent,
                    node.data.level
                ))
            }

            return childrenNodes;
        },

        __getAssociationChildren: function(pid, cid, treeparent, parentlevel) {
            var retObject;
            // if the treeparent is the parent
            if (pid.indexOf(treeparent) >= 0 ) {
                // get the child
                retObject = this._entities.filter(function(n) {
                    return cid.indexOf( n.getGuid() ) >= 0
                })
            }
            // else get the parent
            else {
                retObject = this._entities.filter(function(n) {
                    return pid.indexOf( n.getGuid() ) >= 0 
                })
            }
			
            return retObject.map( function(o) { 
				return {
								text: o.get('CompleteName'),
								type: 'obj',
								// query to grab the attributes
								children: true,
								data: {
									guid: o.getGuid(),
									name: o.get('CompleteName'),
									level: parentlevel + 1
								}
							};
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