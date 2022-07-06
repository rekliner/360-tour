import * as THREE from 'three'
import { Suspense, useEffect, useState, useRef, useCallback, useMemo, useLoader  } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { VRCanvas, DefaultXRControllers, Hands, Interactive, useXR } from '@react-three/xr'
import { Html, Preload, OrbitControls, Text, useGLTF } from '@react-three/drei'
import _ from 'lodash'
//import { Popconfirm } from 'antd'
import MovementController from './MovementController'
import ThreeMeshUI from 'three-mesh-ui'
// import { useControls } from 'leva'
import  {VRButton}  from './VRButton'
//import {CameraBounds} from './CameraBounds'
//import { VRTextPanel } from './VRTextPanels'
//import useRoomEvents from '../hooks/useRoomEvents'

function SceneObjects({isHost,isPlaying,video,currentScene,scenes, handleSceneChange,sceneIndex}) {
  const { gl, camera } = useThree();
  const cam = gl.xr.isPresenting ? gl.xr.getCamera(camera) : camera;
  const [showPopup, setShowPopup] = useState(false)
  useGLTF.preload("/trolley.glb");
  //const { nodes, materials } = useGLTF('/trolley.glb');
  return (
    <>
      <ambientLight />
      <primitive object={new THREE.AxesHelper(10)} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null} r3f>
        <Trolley  /> 
       <Interactive
        onHover={() => {}}
        onSelect={() => {
          //setShowPopup(false)
        }}>

        <mesh scale={-1} rotation={[0,Math.PI/2,Math.PI]}
          onClick={() => {
            console.log('clear popup')
            //setShowPopup(false)
          }}>
          <sphereBufferGeometry args={[500, 60, 40]} phiStart={3/2 * Math.PI  - (Math.PI/200) } />
          <meshBasicMaterial side={THREE.BackSide}  toneMapped={false} wrapS={THREE.RepeatWrapping} offset={[180 / ( 2 * Math.PI ),0,180 / ( 2 * Math.PI )]}  >
         <videoTexture attach="map"   args={[video]} encoding={THREE.sRGBEncoding}  /> 
          </meshBasicMaterial>
        </mesh>
        </Interactive>
        </Suspense>
        {showPopup && 
<>

        <group
          position={[0,2,-4]}
          onClick={() =>  {console.log("hiding");setShowPopup(null)}}
        >
          
          <mesh>
            <planeBufferGeometry args={[5, 7]} />
            <meshLambertMaterial attach="material" color="#666" />
          </mesh>
          <Text
            color="#FFF"
            width={10}
            scale={[
              5 * (showPopup.title.length / 20),
              5 * (showPopup.title.length / 20),
              1
            ]}
            position={[0, 7 / 2 - showPopup.title.length / 20, 0.1]}
          >
            {showPopup.title}
          </Text>
          <Text
            textAlign="justify"
            maxWidth={1}
            fontSize={0.05}
            scale={[
              5 * (showPopup.title.length / 20),
              5 * (showPopup.title.length / 20),
              1
            ]}
            color="#fff"
            position={[0, 0, 1 / 16]}
          >
            {showPopup.content}
          </Text>
        </group>
</>}
       {/*  <VRTextPanel follow={false} position={[0,1,-5]} title="test title" content="testing all the content right now and you have ti stop" onClick={setShowPopup(false)} />
        {
        showPopup?.title && 
        (<>

        <BubbleButton name="test" position={[0,2,-5]} />
          <VRTextPanel title={showPopup.title} content={showPopup.content} onClick={setShowPopup(false)} />
          </>  )
          } */}
     {scenes[sceneIndex]?.buttons?.map((button) => (
        <VRButton
          key={button.text + 'Bubble'}
          label={button.text}
          position={button.position}
          onClick={() => {
            console.log("showing popup");
            setShowPopup({ title: button.content.title, content: button.content.content, position: button.position })
          }}
        />
      ))} 

      {isHost && <>
        <VRButton
          key="PreviousBubble"
          label="Previous"
          position={[-2,1,-5]}
          onClick={_.debounce(() => {
            handleSceneChange("previous");
          },{leading: true, trailing: false, maxWait: 10})}
        />        <VRButton
        key="PauseBubble"
        label={isPlaying ? "Pause" : "Play"}
        position={[0,1,-5]}
        onClick={_.debounce(() => {
          if(isPlaying) {
            video.pause();
          } else {  
            video.play()
          }
          handleSceneChange("play");
        },{leading: true, trailing: false, maxWait: 10})}
      />
        <VRButton
          key="NextBubble"
          label="Next"
          position={[2,1,-5]}
          onClick={_.debounce(() => {
            console.log("next click",sceneIndex);
            video.removeEventListener('ended', this, false)
            handleSceneChange("next");
          },{leading: true, trailing: false, maxWait: 100})}
        />
      </>}
                      

    </>
  )
}

const Trolley = () => {
  // useFrame = () => {
  //   if (oob(cam.position, bounds)) {
      
  //   }
  // }
  const group = useRef();
  const { nodes, materials } = useGLTF('/trolley.glb');
  return (
   <group ref={group} dispose={null}>
      <group rotation={[0, Math.PI/2 , 0]} scale={[1.0,1.0,2.0]} position={[0,1.5,0]} >
          <mesh
            geometry={nodes.defaultMaterial.geometry}
            material={materials.initialShadingGroup}
          />
      </group>
    </group>
  )
}



export default function Scene({sceneIndex,scenes,isPlaying, setIsPlaying, handleSceneChange,isHost}) {
  const [currentScene, setCurrentScene] = useState(scenes[sceneIndex])
  const [video, setVideo] = useState(null)
  const vidRef = useRef(null)

  //CameraBounds([-1,1.5,-1.5],[1,2.5,1.5]);

  const gotoNext = useCallback(() => {
    console.log('video ended! next is', (sceneIndex + 1) % scenes.length, vidRef.current)
    vidRef.current.removeEventListener('ended', this, false)
    if (isHost) { 
      handleSceneChange()
      //setSceneIndex((sceneIndex + 1) % scenes.length)
    }
    setCurrentScene(scenes[(sceneIndex + 1) % scenes.length])
  }, [currentScene])

  useEffect(() => {
    console.log("video")
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
    console.log("currentScene ue")
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
      //if (!isHost) {
        nextVideo.addEventListener('ended', gotoNext)
      //}
      setVideo(nextVideo)
    }
  }, [currentScene, gotoNext])


  return (
    <div className='scene'>
      <VRCanvas frameloop="demand" camera={{  position: [0,1.75,0] }}>
        <Suspense fallback={<Text>Loading...</Text>} r3f>
          <Preload all /> 
          {currentScene &&
            <SceneObjects
            handleSceneChange={handleSceneChange}
              video={video}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              scenes={scenes}
              isHost={isHost}
              sceneIndex={sceneIndex}
            />
          }
        <OrbitControls target={[0,1.75,0]} minDistance={0} maxDistance={0.01} enableZoom={false} enablePan={false} enableDamping dampingFactor={0.2} autoRotate={false} rotateSpeed={-0.5} />
        <MovementController applyForward={false} />
        <MovementController hand="left" applyRotation={true} applyForward={false} />
        <DefaultXRControllers />

        <Hands />
        </Suspense> 

      </VRCanvas>
    </div>
  )
}
