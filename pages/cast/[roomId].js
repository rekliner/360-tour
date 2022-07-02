import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import {StrictMode,Suspense} from 'react'

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
    <StrictMode>
      <Suspense fallback={<div>Loading...</div>}>
        <Layout>
          <PlayerMain
            roomId="testRoom"
            roomName={roomName}
            userName={userName}
            isHost={true}
          />
        </Layout>
      </Suspense>
    </StrictMode>
  )
}

export default RoomPage
