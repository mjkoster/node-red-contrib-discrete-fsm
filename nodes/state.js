module.exports = function(RED) {

  function StateNode(config) {        
    RED.nodes.createNode(this,config);

    var node = this;
    
    node.name = config.name;
    node.isinitialstate = config.isinitialstate;
    node.outputlist = config.outputlist
    node.transitionlist = config.transitionlist

    var outputs = {};
    node.outputlist.forEach( function(output) {
      outputs[output.name] = RED.util.evaluateNodeProperty(output.value,output.type,node);
    });

    var transitions = {};
    node.transitionlist.forEach( function(transition) {
      transitions[transition.condition] = transition.state;
    });

    node.status({});
    node.context().set('isCurrentState', ( node.isinitialstate ? true : false) );

    if (node.isinitialstate) {
      node.status({fill:"green",shape:"dot",text:"active"});
      setTimeout( function() {
        var msg = {};
        msg['topic'] = 'init';
        msg.payload = outputs;
        node.send(msg);
      }, 100 );
    }

    node.on('input', function(msg) {
      var condition = msg.payload;
      if(msg.topic == 'condition' && node.context().get('isCurrentState') && condition in transitions) {
        msg.topic = 'transition';
        msg.payload = transitions[condition];
        node.context().set('isCurrentState',false);
        node.status({});
        node.send(msg);
      }
      if(msg.topic == 'transition' &&  msg.payload == node.name && !node.context().get('isCurrentState')) {
        node.context().set('isCurrentState',true);
        node.status({fill:"green",shape:"dot",text:"active"});
        msg.topic = 'output';
        msg.payload = outputs;
        node.send(msg);
      }
    });
  }
  RED.nodes.registerType("state",StateNode);
}
