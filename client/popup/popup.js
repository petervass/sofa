console.log('Sofa popup started.')

var log = document.getElementById('log')
var button = document.getElementById('activate')
var connection_indicator = document.getElementById('connection')
var id_indicator = document.getElementById('sid')
var app_state = null
var curr_tab = null
var tab_state = false


get_current_tab().then(([tab])=>{curr_tab=tab.id})

var port = browser.runtime.connect({name:'popup'});
port.onMessage.addListener((msg) => 
  {message_handler(msg, port.sender, port.postMessage)
})

button.addEventListener('click', click_handler)

function message_handler(msg, sender=null, sendResponse=null){
    if (msg.type == 'app_state'){
        app_state = msg.payload
        tab_state = (msg.payload.active_tab == curr_tab)

        update_ui(msg.payload)
    }
}

get_app_state()

function click_handler() {
    port.postMessage({
        type: tab_state ? 'deactivate' : 'activate',
        payload: curr_tab
    })
}

function print_log(state) {
    while (log.firstChild) {
        log.removeChild(log.firstChild);
    }
    
    for (i of state.events) {
        var entry = document.createElement('li');
        entry.appendChild(document.createTextNode(JSON.stringify(i)));
        log.appendChild(entry);
    }
}

function set_button(state) {
    button.innerText = (state.active_tab == curr_tab) ? "Deactivate" : "Activate"
}

function get_current_tab() {
    return browser.tabs.query({ currentWindow: true, active: true })
}

function get_app_state(){
    return port.postMessage({type: 'get_app_state'})
}

function update_ui(state){
    //print_log(state)
    set_button(state)

    connection_indicator.innerText = state.connection.state ? "Connected" : "Disconnected"
    id_indicator.value = state.connection.sid
}