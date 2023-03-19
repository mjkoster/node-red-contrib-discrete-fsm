# node-red-contrib-discrete-fsm
## Install
<code> npm install node-red-contrib-discrete-fsm </code>

or use the Node-RED palette manager and serach for <code>discrete-fsm</code>

## What it is

This is a set of Node-RED nodes that implements Finite State Machines (FSM). Each Input, Output, Condition, and State of the FSM is modeled as a discrete node in a Node-RED flow. 

A state machine that is typically shown like this

![A state machine bubble diagram with 2 states](images/state-machine.png "Simple State Machine" )

Is modeled like this in the Node-RED discrete fsm

![A Node-RED flow with discrete fsm nodes](images/state-machine-discrete.png "Node-RED Discrete State Machine" )

Inputs and Outputs correspond to the familiar definition for FSM Inputs and Outputs. Output values are only dependent on the current state (i.e. a Moore machine). Inputs and Outputs may be boolean, number, or string data type. 

State nodes correspond to the nodes of a state chart, and Transitions and Conditions correspond to the arcs and labels of the arcs, respectively, between states. 

The names of the individual nodes are used as symbolic names for the Inputs, Conditions, States, and Outputs of the state machine.

## How it works
### Input Nodes
Input nodes receive raw input values and transmit JSON formatted update records to Condition nodes. During startup, Input nodes transmit initial values to the Condition nodes to establish a starting Condition.

### Condition Nodes
Condition nodes receive input values from Input nodes and evaluate logic expressions across a set of input values. Condition nodes emit messages when conditions become true.

### State Nodes
State nodes receive Condition messages and activate pre-defined state transitions when Conditions become true. State nodes transmit the pre-defined set of output values for each State to the Output nodes upon state transitions. Exactly one State node is configured as the initial state. 

### Output Nodes
Output nodes receive the output vector from State nodes, and each Output node transmits one pre-selected output value to the downstream node(s) in the application flow. 

## Topics
| Topic | Explanation |
|------------|----------------------------------------------------------------------------------------------------------|
| init | sent from Input nodes to Condition nodes, and from State nodes to Output nodes, to initialize values |
| input | sent from Input nodes to Condition nodes when input values are received |
| sync | (optional) sent from a timing source to Condition nodes for synchronous evaluation |
| condition | sent from Condition nodes to Satte nodes when a Condition evaluates to logic true |
| transition | sent from State nodes to State nodes (loop back) to initiate state handoff |
| output| sent from State nodes to Output nodes when state changes occur, to set output values |

## State Machine Topology
A state machine is constructed by connecting the Input, Condition, State, and Output nodes in a multicast chain, using Node-RED Junction nodes to connect all Input node outputs to all Condition node inputs, all Condition node outputs to all State node inputs, and all State node outputs to all Output node inputs. There is an additional loop-back connection from State node outputs to State node inputs, to carry transition messages for the handoff from one state to another.

## Input Node
Recieves input data and sends to Condition nodes

### Inputs
#### Topic
#### Payload
- boolean, string, or number type

### Outputs
#### Topic 
- <code>init</code> initializes the downstream Condition nodes with the initial value
- <code>input</code> sends received input value to Condition nodes

#### Payload
- <code>init</code> and <code>input</code> object type with <code>node.name</code> as key and input value or initial value

### Details
Input nodes receive values from the Node-RED application, associate values with a data types, and transmit named value records to Condition nodes using a message topic of "input", to be evaluated in the Condition nodes. 

Input nodes are configured with initial values in order to start the state machine with a known set of Conditions. During flow initialization, the Input nodes transmit initial values to the Condition nodes, using a message with a topic of "init".

### Settings
#### Initial Value
- Provides an initial type and value to the downstream Condition node. The type may be Boolean, Number, or String

### References

## Condition Node
Evaluates data from Input nodes and notifies State nodes when a Condition expression evaluates to logic true. 

### Inputs
#### Topic
- <code>init</code> stores the value recieved from the input node, does not evaluate the condition
- <code>input</code> stores the input value and evaluates if asynchronous mode is checked
- <code>sync</code> evaluates the condition from the stored values if synchronous mode is checked

#### Payload
- object type with <code>node.name</code> as key and input value or initial value

### Outputs
#### Topic 
- <code>condition</code> when a condition evaluates to logic true, a message with the topic "condition" is sent

#### Payload
- A string representation of the Condition name, which is the same as the name of the Condition node

### Details
Each time an input value is received, th evalue is stored as a context variable in the node. A mathjs Expression is evaluated over a set of Input variables. Evaluation may be asynchronous, that is whenever a new input value is received, or synchronous, that is when a message with the "sync" topic is received.

When the Expression evaluates to logic True, a message is sent to the downstream Statenodes with the name of the Condition.

### Settings
#### Expression
- a string consisting of a mathjs expression (see mathjs) that evaluates to a boolean true or false. The variables in the expression use the Input names (name of the associated input node)

#### Evaluate on Input
- Checking this option causes the Condition node to evaluate the Expression every time an input us received.

#### Evaluate on Sync
- Checking this option causes the Condition node to evaluate the Expression when a message is recieved with tte topic of "sync"

### References

## State Node
Receives Condition data and sends transition messages to other State nodes

### Inputs
#### Topic
- <code>condition</code> when a condition topic is received, the condition name is looked up in the transition table and, if there is a match, a message is sent with the topic "transition" and the name of the State to transition to.

- <code>transition</code> when a State node receives a transition message with its own State name, it assumes the current state and sets its output values.

#### Payload
- condition message payloads consist of the name of the Condition that has been found to be True
- transition message payloads consist of the name of the next State to transition to

### Outputs
#### Topic 
- <code>transition</code> when a Condition occurs that has a defined Transition, a transition topic message is sent from the node in the current state to select the next State

- <code>output</code> When a Transition occurs, the next State sends a message with the topic "output" which contains the values for the Outputs assocuited with the next State.

- <code>init</code> The State defined as the initial state sends its output values to the Output nodes when the state machine is initialized, using a message wit hthe "init" topic.

#### Payload
- The transition message payload consistts of a string representation of the name of the Next state to transition to, which is the same as the name of the State.

- The output message and init message payload consists of a JSON object having a key-value pair for each Output, where the key is the name of the Output, and the value is the value for the Output.

### Details
The State node performs two related functions. FIrst, incoming Conditions are evaluated by the State node for the current state. When a Condition is defined for the current state, in the State's transition table, a transition message is sent with the name of the next State from the table, and the "currentState" status is set to False.

The transition message loops back to the inputs of all State nodes, where each State node compares the State name in the transition message to its own name. When a match occcurs, that State is the new current State, and the currentState status for that node is set to True. Finally, the "output" topic message is sent to the Output nodes to set the Output values for thw new State. 

### Settings
#### InitialState
- Checking this option selects this State as the initial state when the state machine is started. Only one State node should be selected as InitialState, or results may be unpredictable.

#### Outputs
- All of the Outputs affected by transition to this State are assigned values in this setting. There is one entry in the form to begin with (A state should affect at least one output) and additional Outputs may be added by clicking  the "+ Add Output" button. Each entry defines the Value for one OUtput.

#### Transitions
- This is where the Transitions from this State to other States are defined. There is one entry in the form to begin with (A State should have at least one transition to another State) and additional transitions may be defined by clicking the "+ Add Transition" button. Each entry defines a Condition and a State to transition to when the Condition becomes True.

### References

## Output Node
Recieves Output messages from State nodes and sends output values to downstream nodes

### Inputs
#### Topic
- <code>init</code> When an init message is received, the Output node stores the value and sends a message consisting of the value to the downstream application node(s)

- <code>output</code> When an init message is received, the Output node stores the value and sends a message consisting of the value to the downstream application node(s) if rbe is not checked, or if RBE is checked and the new value is different from the last stored value.

#### Payload
- <code>init</code> and <code>output</code> object type with <code>node.name</code> as keys and output values or initial values

### Outputs
#### Topic
- The topic of a message sent from an Output node is undefined
#### Payload
- The payload from an Output node consists of a JSON representation of the plain boolean, nomber, or string value

### Details
Output nodes recieve output messages from State nodes, and select the output value within the output message that corresponds to the Output name, which is the same as the Output node name.

### Settings
#### rbe
- Report By Exception should normally be checked. It supresses the output message when the state machine transitions to a state and the output value doesn't change. In some applications, it's useful to send an output message even if the value doesn't change.

### References
