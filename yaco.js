function init() {
  if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
  var $ = go.GraphObject.make;  //for conciseness in defining node templates

  myDiagram =
    $(go.Diagram, "myDiagramDiv",  //Diagram refers to its DIV HTML element by id
      { "undoManager.isEnabled": true });

  // when the document is modified, add a "*" to the title and enable the "Save" button
  myDiagram.addDiagramListener("Modified", function(e) {
    var button = document.getElementById("SaveButton");
    if (button) button.disabled = !myDiagram.isModified;
    var idx = document.title.indexOf("*");
    if (myDiagram.isModified) {
      if (idx < 0) document.title += "*";
    } else {
      if (idx >= 0) document.title = document.title.substr(0, idx);
    }
  });

  myDiagram.addDiagramListener("LinkDrawn", function(e) {
    //Все key для Node имеют отрицательное значение и на 1 больше их индекса в массиве nodeDataArray
    //Конечно если все Node создавались через форму
    let fromNode = e.subject.fromNode.key * -1 - 1;
    //ID Port текстовый, и состоит из расположения (top/bottom к примеру) + индекс в массиве
    //Нам нужен этот индекс
    let fromPort = +e.subject.fromPortId[e.subject.fromPortId.length - 1];
    let toNode = e.subject.toNode;
    let toNodeIndex = toNode.key * -1 - 1;
    let toPort = +e.subject.toPortId[e.subject.toPortId.length - 1];
    console.log(myDiagram.model.linkDataArray);
    console.log(myDiagram.model.nodeDataArray);
    console.log(fromNode);
    console.log(fromPort);
    console.log(toNodeIndex);
    console.log(toPort);
    let inputData = myDiagram.model.nodeDataArray[fromNode].bottomArray[fromPort].return
    console.log(inputData);
    myDiagram.model.setDataProperty(toNode.data.topArray[toPort], "get", inputData);
    console.log(toNode.data);
    //Сначала принимаем входящие параметры
    //Перебираем все стрелки
    myDiagram.model.linkDataArray.forEach((link, i, linkDataArray)=>{
      //в стрелке есть from, fromPort, to, toPort
      //Входящие параметры лежат в toPort
      //Но чтобы оттуда взять данные надо найти ноду по from
      let node = myDiagram.model.nodeDataArray.find((elem, index, array)=>{
        if(elem.key = link.from){
          return elem;
        } else {
          return false;
        }
      });
    })
    //Потом делаем с ними то, что описано в функции
    //Потом записываем все это в ретерн в боттом
  });

  // To simplify this code we define a function for creating a context menu button:
  function makeButton(text, action, visiblePredicate) {
    return $("ContextMenuButton",
      $(go.TextBlock, text),
      { click: action },
      // don't bother with binding GraphObject.visible if there's no predicate
      visiblePredicate ? new go.Binding("visible", "", function(o, e) { return o.diagram ? visiblePredicate(o, e) : false; }).ofObject() : {});
  }

  var nodeMenu =  // context menu for each Node
    $("ContextMenu",
      makeButton("Copy",
        function(e, obj) { e.diagram.commandHandler.copySelection(); }),
      makeButton("Delete",
        function(e, obj) { e.diagram.commandHandler.deleteSelection(); }),
      $(go.Shape, "LineH", { strokeWidth: 2, height: 1, stretch: go.GraphObject.Horizontal }),
      makeButton("Add top port",
        function(e, obj) { addPort("top"); }),
      makeButton("Add left port",
        function(e, obj) { addPort("left"); }),
      makeButton("Add right port",
        function(e, obj) { addPort("right"); }),
      makeButton("Add bottom port",
        function(e, obj) { addPort("bottom"); })
    );

  var portSize = new go.Size(8, 8);

  var portMenu =  // context menu for each port
    $("ContextMenu",
      makeButton("Swap order",
        function(e, obj) { swapOrder(obj.part.adornedObject); }),
      makeButton("Remove port",
        // in the click event handler, the obj.part is the Adornment;
        // its adornedObject is the port
        function(e, obj) { removePort(obj.part.adornedObject); }),
      makeButton("Change color",
        function(e, obj) { changeColor(obj.part.adornedObject); }),
      makeButton("Remove side ports",
        function(e, obj) { removeAll(obj.part.adornedObject); })
    );

  // the node template
  // includes a panel on each side with an itemArray of panels containing ports
  myDiagram.nodeTemplate =
    $(go.Node, "Table",
      {
        locationObjectName: "BODY",
        locationSpot: go.Spot.Center,
        selectionObjectName: "BODY",
        contextMenu: nodeMenu
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),

      // the body
      $(go.Panel, "Auto",
        {
          row: 1, column: 1, name: "BODY",
          stretch: go.GraphObject.Fill
        },
        $(go.Shape, "Rectangle",
          {
            fill: "#AC193D", stroke: null, strokeWidth: 0,
            minSize: new go.Size(56, 56)
          }),
        $(go.TextBlock,
          { margin: 10, textAlign: "center", font: "14px  Segoe UI,sans-serif", stroke: "white", editable: true },
          new go.Binding("text", "name").makeTwoWay())
      ),  // end Auto Panel body

      // the Panel holding the left port elements, which are themselves Panels,
      // created for each item in the itemArray, bound to data.leftArray
      $(go.Panel, "Vertical",
        new go.Binding("itemArray", "leftArray"),
        {
          row: 1, column: 0,
          itemTemplate:
            $(go.Panel,
              {
                _side: "left",  // internal property to make it easier to tell which side it's on
                fromSpot: go.Spot.Left, toSpot: go.Spot.Left,
                fromLinkable: true, toLinkable: true, cursor: "pointer",
                contextMenu: portMenu
              },
              new go.Binding("portId", "portId"),
              $(go.Shape, "Rectangle",
                {
                  stroke: null, strokeWidth: 0,
                  desiredSize: portSize,
                  margin: new go.Margin(1, 0)
                },
                new go.Binding("fill", "portColor"))
            )  // end itemTemplate
        }
      ),  // end Vertical Panel

      // the Panel holding the top port elements, which are themselves Panels,
      // created for each item in the itemArray, bound to data.topArray
      $(go.Panel, "Horizontal",
        new go.Binding("itemArray", "topArray"),
        {
          row: 0, column: 1,
          itemTemplate:
            $(go.Panel, "Vertical",
              {
                _side: "top",
                fromSpot: go.Spot.Top, toSpot: go.Spot.Top,
                fromLinkable: true, toLinkable: true, cursor: "pointer",
                contextMenu: portMenu
              },
              new go.Binding("portId", "portId"),
              $(go.Shape, "Rectangle",
                {
                  stroke: null, strokeWidth: 0,
                  desiredSize: portSize,
                  margin: new go.Margin(0, 1)
                },
                new go.Binding("fill", "portColor")),
              $(go.TextBlock, new go.Binding("text", "portId"))
            )  // end itemTemplate
        }
      ),  // end Horizontal Panel

      // the Panel holding the right port elements, which are themselves Panels,
      // created for each item in the itemArray, bound to data.rightArray
      $(go.Panel, "Vertical",
        new go.Binding("itemArray", "rightArray"),
        {
          row: 1, column: 2,
          itemTemplate:
            $(go.Panel,
              {
                _side: "right",
                fromSpot: go.Spot.Right, toSpot: go.Spot.Right,
                fromLinkable: true, toLinkable: true, cursor: "pointer",
                contextMenu: portMenu
              },
              new go.Binding("portId", "portId"),
              $(go.Shape, "Rectangle",
                {
                  stroke: null, strokeWidth: 0,
                  desiredSize: portSize,
                  margin: new go.Margin(1, 0)
                },
                new go.Binding("fill", "portColor"))
            )  // end itemTemplate
        }
      ),  // end Vertical Panel

      // the Panel holding the bottom port elements, which are themselves Panels,
      // created for each item in the itemArray, bound to data.bottomArray
      $(go.Panel, "Horizontal",
        new go.Binding("itemArray", "bottomArray"),
        {
          row: 2, column: 1,
          itemTemplate:
          $(go.Panel, "Vertical",
            {
              _side: "bottom",
              fromSpot: go.Spot.Bottom, toSpot: go.Spot.Bottom,
              fromLinkable: true, toLinkable: true, cursor: "pointer",
              contextMenu: portMenu
            },
            $(go.TextBlock, new go.Binding("text", "return")),
            new go.Binding("portId", "portId"),
            $(go.Shape, "Rectangle",
              {
                stroke: null, strokeWidth: 0,
                desiredSize: portSize,
                margin: new go.Margin(0, 1)
              },
              new go.Binding("fill", "portColor")),
          )   // end itemTemplate
        }
      )  // end Horizontal Panel
    );  // end Node

  // an orthogonal link template, reshapable and relinkable
  myDiagram.linkTemplate =
    $(CustomLink,  // defined below
      {
        routing: go.Link.AvoidsNodes,
        corner: 4,
        curve: go.Link.JumpGap,
        reshapable: true,
        resegmentable: true,
        relinkableFrom: true,
        relinkableTo: true
      },
      new go.Binding("points").makeTwoWay(),
      $(go.Shape, { stroke: "#2F4F4F", strokeWidth: 2 })
    );

  // support double-clicking in the background to add a copy of this data as a node
  myDiagram.toolManager.clickCreatingTool.archetypeNodeData = {
    name: "Unit",
    leftArray: [],
    rightArray: [],
    topArray: [],
    bottomArray: []
  };

  myDiagram.contextMenu =
    $("ContextMenu",
      makeButton("Paste",
        function(e, obj) { e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint); },
        function(o) { return o.diagram.commandHandler.canPasteSelection(); }),
      makeButton("Undo",
        function(e, obj) { e.diagram.commandHandler.undo(); },
        function(o) { return o.diagram.commandHandler.canUndo(); }),
      makeButton("Redo",
        function(e, obj) { e.diagram.commandHandler.redo(); },
        function(o) { return o.diagram.commandHandler.canRedo(); }),
        makeButton("Add",
          function(e, obj) { 
            myDiagram.startTransaction("add node");
            let node = {name:"New Func", loc:"100 100", leftArray:[], topArray:[], bottomArray:[], rightArray:[]}
            myDiagram.model.addNodeData(node);          
            myDiagram.commitTransaction("add node"); }),
    );

  // load the diagram from JSON data
  load();
}


// This custom-routing Link class tries to separate parallel links from each other.
// This assumes that ports are lined up in a row/column on a side of the node.
function CustomLink() {
  go.Link.call(this);
};
go.Diagram.inherit(CustomLink, go.Link);

CustomLink.prototype.findSidePortIndexAndCount = function(node, port) {
  var nodedata = node.data;
  if (nodedata !== null) {
    var portdata = port.data;
    var side = port._side;
    var arr = nodedata[side + "Array"];
    var len = arr.length;
    for (var i = 0; i < len; i++) {
      if (arr[i] === portdata) return [i, len];
    }
  }
  return [-1, len];
};

CustomLink.prototype.computeEndSegmentLength = function(node, port, spot, from) {
  var esl = go.Link.prototype.computeEndSegmentLength.call(this, node, port, spot, from);
  var other = this.getOtherPort(port);
  if (port !== null && other !== null) {
    var thispt = port.getDocumentPoint(this.computeSpot(from));
    var otherpt = other.getDocumentPoint(this.computeSpot(!from));
    if (Math.abs(thispt.x - otherpt.x) > 20 || Math.abs(thispt.y - otherpt.y) > 20) {
      var info = this.findSidePortIndexAndCount(node, port);
      var idx = info[0];
      var count = info[1];
      if (port._side == "top" || port._side == "bottom") {
        if (otherpt.x < thispt.x) {
          return esl + 4 + idx * 8;
        } else {
          return esl + (count - idx - 1) * 8;
        }
      } else {  // left or right
        if (otherpt.y < thispt.y) {
          return esl + 4 + idx * 8;
        } else {
          return esl + (count - idx - 1) * 8;
        }
      }
    }
  }
  return esl;
};

CustomLink.prototype.hasCurviness = function() {
  if (isNaN(this.curviness)) return true;
  return go.Link.prototype.hasCurviness.call(this);
};

CustomLink.prototype.computeCurviness = function() {
  if (isNaN(this.curviness)) {
    var fromnode = this.fromNode;
    var fromport = this.fromPort;
    var fromspot = this.computeSpot(true);
    var frompt = fromport.getDocumentPoint(fromspot);
    var tonode = this.toNode;
    var toport = this.toPort;
    var tospot = this.computeSpot(false);
    var topt = toport.getDocumentPoint(tospot);
    if (Math.abs(frompt.x - topt.x) > 20 || Math.abs(frompt.y - topt.y) > 20) {
      if ((fromspot.equals(go.Spot.Left) || fromspot.equals(go.Spot.Right)) &&
        (tospot.equals(go.Spot.Left) || tospot.equals(go.Spot.Right))) {
        var fromseglen = this.computeEndSegmentLength(fromnode, fromport, fromspot, true);
        var toseglen = this.computeEndSegmentLength(tonode, toport, tospot, false);
        var c = (fromseglen - toseglen) / 2;
        if (frompt.x + fromseglen >= topt.x - toseglen) {
          if (frompt.y < topt.y) return c;
          if (frompt.y > topt.y) return -c;
        }
      } else if ((fromspot.equals(go.Spot.Top) || fromspot.equals(go.Spot.Bottom)) &&
        (tospot.equals(go.Spot.Top) || tospot.equals(go.Spot.Bottom))) {
        var fromseglen = this.computeEndSegmentLength(fromnode, fromport, fromspot, true);
        var toseglen = this.computeEndSegmentLength(tonode, toport, tospot, false);
        var c = (fromseglen - toseglen) / 2;
        if (frompt.x + fromseglen >= topt.x - toseglen) {
          if (frompt.y < topt.y) return c;
          if (frompt.y > topt.y) return -c;
        }
      }
    }
  }
  return go.Link.prototype.computeCurviness.call(this);
};
// end CustomLink class


// Add a port to the specified side of the selected nodes.
function addPort(side) {
  myDiagram.startTransaction("addPort");
  myDiagram.selection.each(function(node) {
    // skip any selected Links
    if (!(node instanceof go.Node)) return;
    // compute the next available index number for the side
    var i = 0;
    while (node.findPort(side + i.toString()) !== node) i++;
    // now this new port name is unique within the whole Node because of the side prefix
    var name = side + i.toString();
    // get the Array of port data to be modified
    var arr = node.data[side + "Array"];
    if (arr) {
      // create a new port data object
      var newportdata = {
        portId: name,
        portColor: go.Brush.randomColor()
        // if you add port data properties here, you should copy them in copyPortData above
      };
      // and add it to the Array of port data
      myDiagram.model.insertArrayItem(arr, -1, newportdata);
    }
  });
  myDiagram.commitTransaction("addPort");
}

// Add function
function addFunc() {
  myDiagram.startTransaction("addData");
  myDiagram.selection.each(function(node) {
    if (!(node instanceof go.Node)) return;
    let variables = "";
    let variablesData = [];
    console.log(node.data);
    //перебираем и присваем переменные для модуля
    if(node.data.topArray.length>0){
      node.data.topArray.forEach((item, i, arr)=>{
        if(i >0){
          variables += ", ";
        }
        variables += item.portId;
        variablesData.push(item.get);
      });
    }
    let funcStet = document.getElementById("mySavedModel").value;
    funcStet = new Function(variables, funcStet);
    funcStet.arguments = {top0:"hehe", top1:"hehe"};
    let result = funcStet.apply(this, variablesData);
    myDiagram.model.setDataProperty(node.data.bottomArray[0], "return", result);
    node.findNodesOutOf().each((nodemon)=>{console.log(nodemon.data)});
  });
  myDiagram.commitTransaction("addData");
}

// Exchange the position/order of the given port with the next one.
// If it's the last one, swap with the previous one.
function swapOrder(port) {
  var arr = port.panel.itemArray;
  if (arr.length >= 2) {  // only if there are at least two ports!
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].portId === port.portId) {
        myDiagram.startTransaction("swap ports");
        if (i >= arr.length - 1) i--;  // now can swap I and I+1, even if it's the last port
        var newarr = arr.slice(0);  // copy Array
        newarr[i] = arr[i + 1];  // swap items
        newarr[i + 1] = arr[i];
        // remember the new Array in the model
        myDiagram.model.setDataProperty(port.part.data, port._side + "Array", newarr);
        myDiagram.commitTransaction("swap ports");
        break;
      }
    }
  }
}

// Remove the clicked port from the node.
// Links to the port will be redrawn to the node's shape.
function removePort(port) {
  myDiagram.startTransaction("removePort");
  var pid = port.portId;
  var arr = port.panel.itemArray;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].portId === pid) {
      myDiagram.model.removeArrayItem(arr, i);
      break;
    }
  }
  myDiagram.commitTransaction("removePort");
}

// Remove all ports from the same side of the node as the clicked port.
function removeAll(port) {
  myDiagram.startTransaction("removePorts");
  var nodedata = port.part.data;
  var side = port._side;  // there are four property names, all ending in "Array"
  myDiagram.model.setDataProperty(nodedata, side + "Array", []);  // an empty Array
  myDiagram.commitTransaction("removePorts");
}

// Change the color of the clicked port.
function changeColor(port) {
  myDiagram.startTransaction("colorPort");
  var data = port.data;
  myDiagram.model.setDataProperty(data, "portColor", go.Brush.randomColor());
  myDiagram.commitTransaction("colorPort");
}


// Save the model to / load it from JSON text shown on the page itself, not in a database.
function save() {
  document.getElementById("mySavedModel").value = myDiagram.model.toJson();
  myDiagram.isModified = false;
}
function load() {
  let startVal = JSON.stringify({ class: "go.GraphLinksModel",
  copiesArrays: true,
  copiesArrayObjects: true,
  linkFromPortIdProperty: "fromPort",
  linkToPortIdProperty: "toPort",
  nodeDataArray: [],
  linkDataArray: []});
  myDiagram.model = go.Model.fromJson(startVal);

  // When copying a node, we need to copy the data that the node is bound to.
  // This JavaScript object includes properties for the node as a whole, and
  // four properties that are Arrays holding data for each port.
  // Those arrays and port data objects need to be copied too.
  // Thus Model.copiesArrays and Model.copiesArrayObjects both need to be true.

  // Link data includes the names of the to- and from- ports;
  // so the GraphLinksModel needs to set these property names:
  // linkFromPortIdProperty and linkToPortIdProperty.
}