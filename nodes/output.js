module.exports = function(RED) {

    function OutputNode(config) {        
        RED.nodes.createNode(this,config);

        var node = this;
        
        node.name = config.name;
        node.rbe = config.rbe;
        node.context().set('value', null);

        node.status({});

        node.on('input', function(msg) {
            if(msg.topic == 'init' && node.name in msg.payload) {
                var value = msg.payload[node.name];
                node.context().set('value', value)
                if (typeof(value) == 'boolean') {
                    if (value == true) {
                        node.status({fill:"green",shape:"dot",text:"true"});
                    } else {
                        node.status({fill:"green",shape:"ring",text:"false"});
                    }
                } else {
                    node.status({});
                }    
            }
            if(msg.topic == 'output' && node.name in msg.payload) {
                if(!node.rbe || (node.rbe && ( msg.payload[node.name] != node.context().get('value')))) {
                    var value = msg.payload[node.name];
                    node.context().set('value', value)
                    if (typeof(value) == 'boolean') {
                        if (value == true) {
                            node.status({fill:"green",shape:"dot",text:"true"});
                        } else {
                            node.status({fill:"green",shape:"ring",text:"false"});
                        }
                    } else {
                        node.status({});
                    }    
                    msg.payload = value;
                    node.send(msg);
                }
            }
        });
    }
    RED.nodes.registerType("output",OutputNode);
}
