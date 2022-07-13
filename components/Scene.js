import * as THREE from 'three'
import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { VRCanvas, DefaultXRControllers, Hands, Interactive } from '@react-three/xr'
import { Preload, OrbitControls, Text, useGLTF } from '@react-three/drei'
import _ from 'lodash'
import MovementController from './MovementController'
import  {VRButton}  from './VRButton'
import {CameraBoundsBox} from './CameraBoundsBox'
import { TurnToCamera2d } from './TurnToCamera2d'
//import { VRTextPanel } from './VRTextPanels'

function SceneObjects({isHost,isPlaying,video,currentScene,scenes, handleSceneChange,sceneIndex}) {
  const [showPopup, setShowPopup] = useState(false)
  const popupRef = useRef(null)
  useGLTF.preload("/trolley.glb");
  return (
    <>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null} r3f>
        <Trolley  /> 
       <Interactive onHover={() => {}} onSelect={() => {}}> {/* this gets hand/controller lasers to show in xr */}

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
          <Interactive
            onHover={() => {}}
            onSelect={() => {
              setShowPopup(false)
              }
            }>

            <group position={showPopup.position} ref={popupRef} >
              <TurnToCamera2d objRef={popupRef} />
              <mesh onClick={() =>  {console.log("hiding");setShowPopup(false)}}>
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
          </Interactive>
        }
        {scenes[sceneIndex]?.buttons?.map((button) => (
          (showPopup?.title != button.content.title) &&
            <VRButton
              key={button.text + 'Bubble'}
              label={button.text}
              position={button.position}
              onClick={() => {
                console.log("showing popup");
                setShowPopup({ title: button.content.title, content: button.content.content, position: button.position })
                //setTimeout(() => setShowPopup(false),30000)
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
          />        
          <VRButton
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
  const preloadVideoRef = useRef(null)

  const gotoNext = useCallback(() => {
    vidRef.current.removeEventListener('ended', this, false)
    if (isHost) { 
      handleSceneChange("next")
    }
    setCurrentScene(scenes[(sceneIndex + 1) % scenes.length])
  }, [currentScene])

  useEffect(() => {
    if (video) {
      if (isPlaying) {
        video.play()
      } else {
        video.play()
        setTimeout(() => video.pause(),10) //need to play the first moment of video to get a still frame rather than blackness
      }
    }
  }, [video])

  useEffect(() => {
      vidRef.current?.removeEventListener('ended', this, false)
      setCurrentScene(scenes[sceneIndex])
  }, [sceneIndex])



  useEffect(() => {
    if (currentScene) {
      //swap to the next video element, create dom element if necessary
      let nextVideo = null;
      if (preloadVideoRef.current) {
        nextVideo = preloadVideoRef.current;
      } else {

        nextVideo = document.getElementById('video' + sceneIndex)
        console.log("n",nextVideo);
        if (!nextVideo) {
          nextVideo = Object.assign(document.createElement('video'), {
            id: 'video' + sceneIndex,
            src: currentScene.src,
            crossOrigin: 'Anonymous',
            loop: currentScene.loop,
            muted: true,
            preload: "auto",
            ref: vidRef,
          })
        } else {
          nextVideo.ref = vidRef
        }
      }

      vidRef.current = nextVideo
      //if (!isHost) { 
        //question:  should the host automatically bring all viewers with them for the next video?
        nextVideo.addEventListener('ended', gotoNext)
      //}
      setVideo(nextVideo)

      if (sceneIndex < scenes.length -2) {

        let preloadVideo = document.getElementById('video' + (sceneIndex+1))
        if (!preloadVideo) {
          preloadVideo = Object.assign(document.createElement('video'), {
            id: 'video' + (sceneIndex+1),
            src: scenes[sceneIndex+1].src,
            crossOrigin: 'Anonymous',
            loop: scenes[sceneIndex+1].loop,
            preload: "auto",
            muted: true,
            ref: preloadVideoRef,
            onLoadEnd: () => {console.log(sceneIndex+1,"preloaded")}
          })
        };
        preloadVideoRef.current = preloadVideo;
        console.log("plv",preloadVideo);
      }

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

        <CameraBoundsBox lowerBound={[-.5,1.5,-.75]} upperBound={[.5,2.25,.75]} />

        <OrbitControls target={[0,1.75,0]} minDistance={0} maxDistance={0.01} enableZoom={false} enablePan={false} enableDamping dampingFactor={0.2} autoRotate={false} rotateSpeed={-0.5} />
        <MovementController applyForward={false} />
        <MovementController hand="left" applyRotation={true} applyForward={false} />
        <DefaultXRControllers />

        {/* <Hands /> */}
        </Suspense> 

      </VRCanvas>
    </div>
  )
}
