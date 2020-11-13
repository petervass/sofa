/* get video player */
console.log('Sofa started.')

const AUTO_SYNC_T = 5000
const MAX_DELTA_S = 2
var executing_sync = 0
var auto_sync_event = new Event('auto_sync')
var player = document.getElementsByTagName('video')[0]

player.addEventListener('seeked', player_handler)
player.addEventListener('play', player_handler)
player.addEventListener('pause', player_handler)
player.addEventListener('auto_sync', player_handler)

window.setInterval(
  () => { player.dispatchEvent(auto_sync_event) },
  AUTO_SYNC_T
)

browser.runtime.onMessage.addListener(
  (message) => {
    if (message.type === "sync") {
      sync_handler(message.payload)
    }
  }
)

PlayerState = function (playing, curr_time, timestamp) {
  this.playing = playing
  this.curr_time = curr_time
  this.timestamp = timestamp
}

function get_player_state() {
  return new PlayerState(!player.paused, player.currentTime, Date.now())
}

var last_sync_sent = null

function notify_bg(player_state, event_type) {
  browser.runtime.sendMessage({
    type: 'player_event',
    payload: {
      player_state: player_state,
      event_type: event_type
    }
  })
  last_sync_sent = Date.now()
}

function player_handler(e) {
  console.log(`Captured ${e.type} event.`)
  if (executing_sync == 0){
    
    let player_state = get_player_state()
    notify_bg(player_state, e.type)
  }else{
    if (e.type != 'auto_sync'){
      executing_sync--
    }
  }
  
}


function sync_handler(msg) {
  let timestamp = msg.player_state.timestamp
  let rtt = (Date.now() - timestamp)/1000
  let localTime = player.currentTime
  let remoteTime = msg.player_state.curr_time
  let remotePlaying = msg.player_state.playing

  console.debug(`got sync. delta=${(localTime - remoteTime).toPrecision(3)}`)

  if (timestamp < last_sync_sent){
    return;
  }
  
  if (Math.abs(localTime - remoteTime) > MAX_DELTA_S){
    executing_sync++
    player.currentTime = remoteTime + rtt 
  }

  if (remotePlaying == player.paused){
    executing_sync++
    if (remotePlaying){
      player.play()
    }else{
      player.pause()
    }
  }
}
