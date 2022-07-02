import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import React from 'react'

import Layout from '../../components/Layout'

const PlayerMain = dynamic(
  () => import('../../components/PlayerMain'),
  { ssr: false }
)

function RoomPage() {
  const router = useRouter()

  const {
    roomId,
    roomName,
    userName
  } = router.query

  return (
    <React.StrictMode>
    <Layout>
      <PlayerMain
        roomId="testRoom"
        roomName={roomName}
        userName={userName}
        isHost={true}
      />
    </Layout>
    </React.StrictMode>
  )
}

export default RoomPage
