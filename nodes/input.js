module.exports = function(RED) {

    function InputNode(config) {        
        RED.nodes.createNode(this,config);

        var node = this;
        
        node.name = config.name;
        
        // the value is stored from the form as a string, recover the typed value
        node.initialvalue = RED.util.evaluateNodeProperty(config.initialvalue, config.initialvaluetype, node)

        setTimeout( function() {
          var msg = {}
          msg['topic'] = 'init';
          msg['payload'] = {};
          msg.payload[node.name] = node.initialvalue;
          node.send(msg);
        }, 100 );

        if (typeof(node.initialvalue) == 'boolean') {
            if (node.initialvalue == true) {
                node.status({fill:"green",shape:"dot",text:"true"});
            } else {
                node.status({fill:"green",shape:"ring",text:"false"});
            }
        } else {
            node.status({});
        }

        node.on('input', function(msg) {
            const value = msg.payload;
            if (typeof(value) == 'boolean') {
                if (value == true) {
                    node.status({fill:"green",shape:"dot",text:"true"});
                } else {
                    node.status({fill:"green",shape:"ring",text:"false"});
                }
            } else {
                node.status({});
            }
            msg.payload = {};
            msg.topic = "input";
            msg.payload[node.name] = value;
            node.send(msg);
        });
    }
    RED.nodes.registerType("input",InputNode);
}
