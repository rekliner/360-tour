import * as THREE from 'three'
import { Suspense, useEffect, useState, useRef, useCallback, useMemo, useLoader  } from 'react'
import { extend } from '@react-three/fiber'
import { VRCanvas, DefaultXRControllers, Hands, Interactive, useXR } from '@react-three/xr'
import { Html, Preload, OrbitControls, Text, useGLTF } from '@react-three/drei'
//import { Popconfirm } from 'antd'
import MovementController from './MovementController'
// import ThreeMeshUI from 'three-mesh-ui'
// import { useControls } from 'leva'
//import  Button  from './Button'
//import useRoomEvents from '../hooks/useRoomEvents'

function SceneObjects({isHost,isPlaying,video,currentScene,setIsPlaying}) {
  const [showPopup, setShowPopup] = useState(false)
  const togglePlay = () => {
    if(isPlaying) {
      setIsPlaying(false);
      video.pause();
    } else {  
      setIsPlaying(true);
      video.play()
    }
  }
  useGLTF.preload("/trolley.glb");
  const Trolley = () => {

    
    const group = useRef();
    const { nodes, materials } = useGLTF('/trolley.glb');
    return (
      <group ref={group} dispose={null}>
        <group rotation={[0, 0 , 0]} scale={[1.0,1.0,2.0]} position={[0,1.75,0]} >
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.defaultMaterial.geometry}
              material={materials.initialShadingGroup}
            />
        </group>
      </group>
    )};

  
  return (
    <>
      <ambientLight />
      <primitive object={new THREE.AxesHelper(10)} />
      <pointLight position={[10, 10, 10]} />
      <Trolley  /> 
      <Interactive
        onHover={() => {}}
        onSelect={() => {
          setShowPopup(false)
        }}>

        <mesh scale={-1} rotation={[0,0,Math.PI]}
          onClick={() => {
            console.log('clear popup')
            setShowPopup(false)
          }}>
          <sphereBufferGeometry args={[500, 60, 40]} phiStart={3/2 * Math.PI  - (Math.PI/200) } />
          <meshBasicMaterial side={THREE.BackSide}  toneMapped={false} wrapS={THREE.RepeatWrapping} offset={[180 / ( 2 * Math.PI ),0,180 / ( 2 * Math.PI )]}  >
            {currentScene && <videoTexture attach="map"   args={[video]} encoding={THREE.sRGBEncoding}  /> }
          </meshBasicMaterial>
        </mesh>

        {showPopup 
        
        }
      </Interactive>
      
     {currentScene?.buttons?.map((button) => (
        
        <BubbleButton
          key={button.text + 'Bubble'}
          name={button.text}
          position={button.position}
          onClick={() => {
            setShowPopup({ title: button.content.title, content: button.content.content, position: button.position })
          }}
        />
      ))}
      
    </>
  )
}

const BubbleButton = ({ name, position, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  var origin = new THREE.Vector3(0,2,0);
  var posV = new THREE.Vector3(position[0],position[1],position[2]);
  var q = new THREE.Quaternion(); // create one and reuse it
  var a = new THREE.Euler();
  q.setFromUnitVectors( origin, posV );
  a.setFromQuaternion(q);
  var aa = a.toArray().slice(0,3).map(x=>x*1/Math.PI);
  console.log("button",position,name,aa);
  return (
    <Interactive  onSelect={onClick} onHover={() => setIsHovered(true)} onBlur={() => setIsHovered(false)}>
<group position={position} rotation={aa}>
        <Text  color="red">{name}</Text> </group>
    </Interactive>
  )
}


export default function Scene({sceneIndex,scenes,isPlaying, setIsPlaying, setSceneIndex,isHost}) {
  const [currentScene, setCurrentScene] = useState(scenes[sceneIndex])
  const [video, setVideo] = useState(null)
  const vidRef = useRef(null)

  const gotoNext = useCallback(() => {
    console.log('video ended! next is', (sceneIndex + 1) % scenes.length, vidRef.current)
    vidRef.current.removeEventListener('ended', this, false)
    if (isHost) { 
      setSceneIndex((sceneIndex + 1) % scenes.length)
    }
    setCurrentScene(scenes[(sceneIndex + 1) % scenes.length])
  }, [currentScene])

  useEffect(() => {
    if (video) {
      if (isPlaying) {
        video.play()
        console.log('video started', video)
      } else {
        video.play()
        setTimeout(() => video.pause(),10)
      }
    }
  }, [video])

  useEffect(() => {
      console.log("scene changed!",sceneIndex) ;
      vidRef.current?.removeEventListener('ended', this, false)
      setCurrentScene(scenes[sceneIndex])
  }, [sceneIndex])



  useEffect(() => {
    if (currentScene) {
      let nextVideo = document.getElementById('video' + sceneIndex)
      if (!nextVideo) {
        nextVideo = Object.assign(document.createElement('video'), {
          id: 'video' + sceneIndex,
          src: currentScene.src,
          crossOrigin: 'Anonymous',
          loop: currentScene.loop,
          muted: true,
          ref: vidRef,
        })
      } else {
        nextVideo.ref = vidRef
      }
      vidRef.current = nextVideo
      nextVideo.addEventListener('ended', gotoNext)
      setVideo(nextVideo)
    }
  }, [currentScene, gotoNext])


  return (
    <div className='scene'>
      <VRCanvas frameloop="demand" camera={{  position: [0,2,0] ,rotation: [0,90,0]}}>
        <Suspense fallback={<Text>Loading...</Text>} r3f>
          <Preload all /> 
          {currentScene &&
            <SceneObjects
              currentScene={currentScene}
              video={video}
              gotoNext={() => {
                console.log('click')
                return gotoNext()
              }}
              gotoPrev={() => gotoPrevious()}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              scenes={scenes}
            />
          }
        <OrbitControls target={[0,2,0]} minDistance={0} maxDistance={0.01} enableZoom={false} enablePan={false} enableDamping dampingFactor={0.2} autoRotate={false} rotateSpeed={-0.5} />
        <MovementController applyForward={false} />
        <MovementController hand="left" applyRotation={true} applyForward={false} />
        <DefaultXRControllers />

        <Hands />
        </Suspense> 

      </VRCanvas>
    </div>
  )
}
