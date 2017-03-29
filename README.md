# rmx.xmpp.websocket
XMPP Websocket Library


# Dev Install using npm link
```bash
git clone https://github.com/RESTOMAX/rmx.xmpp.utils.git
cd rmx.xmpp.utils
npm link
cd AnyProjectUsing rmx.xmpp.utils
npm link rmx.xmpp.websocket --save
```


# Install
Normal install from github
```bash
npm install --save https://github.com/RESTOMAX/rmx.xmpp.utils.git
```


# How to use
Events Subscribes
  
  1. connectionStatus:
      
```bash
xmpp.connectionStatus.subscribe(
  (x:number) => {
      this.xmppCurrentState = x;
  },
  (e:string) => {
      console.error(e);
  }
);
```

Connection states:
 -9: Error,
 -1: AuthError,
 0: Disconnected,
 1: Connected,
 2: Session Started,
 3: Wait Mediator,
 4: Mediator OK,
  
  
Public methods
  
  1. Initialize xmpp connection
  
```bash
// xmpp.Init(xmppParam, peerinfoXmppParam)

xmpp.Init({
    jid: 'yourLogin@your.domain.com',
    password: '*******',
    resource: Math.random().toString(36).substring(7),
    transport: 'websocket',
    server: 'your.domain.com',
    timeout: 2,
    wsURL: 'ws://your.domain.com:7070/ws/',
    sasl: ['digest-md5', 'plain']
}, {
    jid: 'peerinfo_login@your.domain.com',
    password: '*******',
    resource: Math.random().toString(36).substring(7),
    transport: 'websocket',
    server: 'your.domain.com',
    timeout: 2,
    wsURL: 'ws://your.domain.com:7070/ws/',
    sasl: ['digest-md5', 'plain']
}):void;
```

  2. Send an helo to a receiver:

```bash
xmpp.Helo(Destination:String):void;
```

  3. Send an helo to Mediator to see and select an online mediator
  
```bash
xmpp.helo2Mediator():void;
```

  4. Send a message to a receiver

```bash
xmpp.sendMsg(Destination:String, Command:String, Data:String):void;
```

  4. Send a message to Mediator
 
```bash
xmpp.sendMsg2Mediator(Command:String, Data:String):void;
```

