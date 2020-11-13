console.log('Background started.')


var app_state = {
    connection: {
        server_addr: null,
        state: null,
        sid: null,
        delay: 0,
    },
    user_name: null,
    active_tab: null,
    conf:{
        max_delta_ms: 1000,
        auto_sync_ms: 5000,
        auto_sync: true,
    },
    chat:{
        messages:[]
    },
    events: []
}

var socket = io('http://vassp.hu:3000')
var port = null
const msg_ok = {type:'ok', payload:{}}

window.setInterval(get_delay, 5000)
browser.runtime.onMessage.addListener(message_handler)

socket.on('connect', () => {
    console.log(`connection sid ${socket.id}`)
    app_state.connection.sid = socket.id
    app_state.connection.state = true
    update_popup()
})

socket.on('disconnect', () => {
    app_state.connection.sid = null
    app_state.connection.state = false
    update_popup()
})

socket.on('sync', (data) => {
    console.log(`got sync from server ${data}`)
    if (app_state.active_tab)
        browser.tabs.sendMessage(app_state.active_tab, {type:'sync', payload:data})
})

browser.runtime.onConnect.addListener(
    (p) => {
        port = p
        p.onMessage.addListener((msg)=> {message_handler(msg, p.sender, p.postMessage)})
        p.onDisconnect.addListener((p) => {
            port = null
        })
    }
)


function message_handler(message, sender, sendResponse) {
    console.debug(`msg> "${message.type}" from ${sender.url}`)
    let subject = message.type
    let msg = message.payload

    if (subject == 'player_event'){
        if (sender.tab.id == app_state.active_tab){
            msg.url = sender.url
            socket.emit('sync', msg)
        }
    }else if (subject == 'get_app_state') {
    }else if (subject == 'activate') {
        app_state.active_tab = msg
    }else if (message.type == 'deactivate') {
        if (app_state.active_tab == msg){
            app_state.active_tab = null
        }
    }

    sendResponse({type: 'app_state', payload: app_state})
    update_popup()
}

function get_delay(){
    let t1 = Date.now()
    socket.emit('clock', t1, (t2) => {
        app_state.connection.delay = t2 - t1 - (Date.now()-t1)/2
        console.debug(`delay=${app_state.connection.delay}`)
    })
}


function update_popup(){
    if (port)
        port.postMessage({type: 'app_state', payload: app_state})
}


