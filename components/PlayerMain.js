import { useContext, useEffect, useState } from 'react'
import { FiMic, FiMicOff, FiAlertTriangle } from 'react-icons/fi'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { PeerContextProvider, PeerContext } from '../contexts/PeerJSContext'
import { StreamContextProvider, StreamContext } from '../contexts/StreamContext'
import useRoomEvents from '../hooks/useRoomEvents'

import Streamer from './Streamer'
import StreamPlayer from './StreamPlayer'
import Heading from './Heading'
import ConnectedPeersList from './ConnectedPeersList'
import ActionGroup from './ActionGroup'
import Button from './Button'
import Container from './Container'
import Scene from './Scene'
import scenes from '../public/scenes.json'
//const { default: scenes } = import("../public/scenes.js");
console.log("scenes",scenes)

export default function PlayerMain ({ roomId, roomName, userName, isHost }) {

  return (
    <StreamContextProvider>
      <PeerContextProvider initialContext={{
        isHost,
        roomId,
        user: {
          name: userName,
        },
        roomMetadata: {
          title: roomName,
        },
      }}>
        <Main user={{
          name: userName,
        }} />
      </PeerContextProvider>
    </StreamContextProvider>
  )
}

function Main ({ user }) {
  const router = useRouter()
  const [sceneIndex,setSceneIndex] = useState(0);
  const [isPlaying,setIsPlaying] = useState(true);
  const [recentEvents, roomEvents] = useRoomEvents();

  if (!user.name) {
    router.push('/host')
  }

  const {
    muteToggle,
    micMuted,
    startMicStream,
  } = useContext(StreamContext)

  const {
    state: {
      roomId,
      peer,
      peerId,
      peerStatus,
      connToHost,
      connRole,
      roomMetadata,
      isHost,
      connectedPeers,
      peersOnRoom,
      peerList,
    },
    streams: {
      incomingStreams,
      outgoingStreams,
    },
    actions: {
      onPromotePeerToSpeaker,
      onDemotePeerToListener,
      sendMessageToHost,
      broadcastMessage,
      // reconnectToHost,
    }
  } = useContext(PeerContext)

  useEffect(() => {
    if (!isHost) return
    startMicStream()
  }, [isHost])

  useEffect(() => {
    console.log("re",roomEvents)
    const latestSceneChange = roomEvents.sort((a,b) => a.date < b.date).find((event) => event.eventName === 'sceneChange')?.value ?? 0;
    if (latestSceneChange !== sceneIndex) {
      console.log("sc diff", latestSceneChange, sceneIndex)
      setSceneIndex(latestSceneChange);
    }
  }, [roomEvents])
  
  const shareLink = typeof window === 'undefined' ? '' : `${window.location.protocol || ''}//${window.location.host || ''}/room/${roomId}`

  async function onLeave() {
    if (isHost) {
      const agree =  confirm('As a host, when you quit the room all listeners will be disconnected')
      if (!agree) return
    }
    if (connToHost) connToHost.close()
    if (connectedPeers) {
      connectedPeers.forEach(conn => {
        conn.close()
      })
    }
    if (outgoingStreams) {
      outgoingStreams.forEach(conn => {
        conn.close()
      })
    }
    if (incomingStreams) {
      incomingStreams.forEach(conn => {
        conn.call.close()
      })
    }
    router.push(isHost ? '/host' : '/')
  }

  if (peerStatus === 'error') {
    return (
      <Container>
        <div>
          <FiAlertTriangle size={62} />
          <Heading size={2}>Error</Heading>
          <p>Could not connect to room</p>
          <Link href="/host">
            <Button as="a">Go Back</Button>
          </Link>
        </div>
        <style jsx>{`
          div {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        `}</style>
      </Container>
    )
  }

  function handleReaction (emoji) {
    sendMessageToHost({
      action: 'sendReaction',
      payload: emoji,
    })
  }

  function handlePeerMessage (payload) {
    console.log("send message to peers",payload);

    broadcastMessage({
      action: 'event',
      payload: payload,
    });
  }

  const handleSceneChange = () => {
    handlePeerMessage(
      {
        date: +new Date(), 
        eventName: 'sceneChange', 
        value: nextSceneIndex(sceneIndex)
      }
    ); 
    setSceneIndex(nextSceneIndex(sceneIndex));

  }

  const nextSceneIndex = () => {
    return scenes.length - 1 === sceneIndex ? 0 : sceneIndex + 1
  }
  const previousSceneIndex = () => {
    return sceneIndex == 0 ? scenes.length - 1 : sceneIndex - 1
  }
  
  return (
    <>
      <Scene sceneIndex={sceneIndex} setPlaying={setIsPlaying} isPlaying={isPlaying} scenes={scenes} onSceneChange={() => {console.log('scenechangefromscene')}} />
      <div className="panel">
        <Container>
          <Heading>
            {roomMetadata.title}
          </Heading>
        </Container>
        <StreamPlayer />
        <ConnectedPeersList shareLink={isHost ? shareLink : null} />
        <ActionGroup>
          <Button outline contrast onClick={onLeave}>Leave</Button>
          { (isHost || connRole === 'speaker') && (
            <Button style={{marginLeft:10}} contrast outline={!micMuted} onClick={muteToggle}>
              { micMuted && <FiMicOff/>}
              { !micMuted && <FiMic/>}
            </Button>
          )}
        {isHost && <Button style={{marginLeft:10}} small outline contrast onClick={() => {handleSceneChange()}}>Next Scene</Button>}
        {isHost && <Button style={{marginLeft:10}} small outline contrast onClick={() => {handlePeerMessage({date: +new Date(), eventName: 'isPlaying', value: !isPlaying}) ; setIsPlaying(!isPlaying)}}>{isPlaying ? "Pause" : "Play" }</Button>}
          {/* {!isHost && <Button style={{marginLeft:10}} small outline contrast onClick={() => handleReaction('🙋‍♀️')}>🙋‍♀️</Button>}
          {!isHost && <Button style={{marginLeft:10}} small outline contrast onClick={() => handleReaction('👍')}>👍</Button>}
          {!isHost && <Button style={{marginLeft:10}} small outline contrast onClick={() => handleReaction('👎')}>👎</Button>} */}
        </ActionGroup>
      </div>
    </>
  )
}
