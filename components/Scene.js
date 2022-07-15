import * as THREE from 'three'
import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { VRCanvas, DefaultXRControllers, Hands, Interactive } from '@react-three/xr'
import { Preload, OrbitControls, Text, useGLTF } from '@react-three/drei'
import _ from 'lodash'
import MovementController from './MovementController'
import { VRButton }  from './VRButton'
import { CameraBoundsBox } from './CameraBoundsBox'
import { VRTextPanel } from './VRTextPanel'

function SceneObjects({isHost,isPlaying,video,currentScene,scenes, handleSceneChange,sceneIndex}) {
  const [showPopup, setShowPopup] = useState(false)
  const popupRef = useRef(null)
  const videoTextureRef = useRef(null)
 

  useGLTF.preload("/trolley.glb");
  return (
    <Suspense fallback={null} r3f>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Trolley  />
      <Interactive onHover={() => {}} onSelect={() => {}}>
        {/* this gets hand/controller lasers to show in xr */}  
        <mesh scale={-1} rotation={[0,Math.PI/2,Math.PI]}  key="360video" 
          onClick={() => {
            console.log('background clicked')
          }}>
          <sphereBufferGeometry args={[500, 60, 40]} phiStart={3/2 * Math.PI  - (Math.PI/200) } />
          <meshBasicMaterial side={THREE.BackSide}  toneMapped={false} wrapS={THREE.RepeatWrapping} offset={[180 / ( 2 * Math.PI ),0,180 / ( 2 * Math.PI )]}  >
            <videoTexture attach="map" args={[video]} encoding={THREE.sRGBEncoding} autoUpdate={true} /> 
          </meshBasicMaterial>
        </mesh>
        </Interactive>
        {showPopup && 

            <VRTextPanel position={showPopup.position} title={showPopup.title} content={showPopup.content} onClick={() => {setShowPopup(false)}} />

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
              video?.removeEventListener('ended', this, false)
              handleSceneChange("next");
            },{leading: true, trailing: false, maxWait: 100})}
          />
        </>}
                        

    </Suspense>
  )
}

const Trolley = () => {
  const group = useRef();
  const { nodes, materials } = useGLTF('/trolley.glb');
  return (
   <group ref={group} dispose={null}>
      <group rotation={[0, Math.PI/2 , 0]} scale={[1,1.0,2.5]} position={[0,1.5,0]} >
          <mesh
            geometry={nodes.defaultMaterial.geometry}
            material={materials.initialShadingGroup}
          />
      </group>
    </group>
  )
}






export default function Scene({sceneIndex,scenes,isPlaying, setIsPlaying, handleSceneChange,isHost}) {
  const [video, setVideo] = useState(null)
  const loadedVideos = useRef([])
  const sceneIndexRef = useRef(0);
  
  const videoEnded = (e) => {
    if (e.path[0].sceneIndex == sceneIndexRef.current) {
      console.log("playback ended", e);
      gotoNext();
    }
  }
  const gotoNext = useCallback(() => {
    handleSceneChange("next")
  }, [sceneIndex])

  useEffect(() => {
      console.log("sceneIndex changed", sceneIndex,sceneIndexRef.current)
      loadedVideos.current[sceneIndexRef.current]?.removeEventListener('ended', this, false)
      video?.removeEventListener('ended', this, false)
      sceneIndexRef.current = sceneIndex;

      if (!loadedVideos.current[sceneIndex]) {
        loadedVideos.current[sceneIndex] = Object.assign(document.createElement('video'), {
          id: 'video' + sceneIndex,
          key: 'video' + sceneIndex,
          sceneIndex: sceneIndex,
          src: scenes[sceneIndex].src,
          crossOrigin: 'Anonymous',
          loop: scenes[sceneIndex].loop,
          muted: true,
          preload: "auto",
          ref: video,
        })
      } else {
        loadedVideos.current[sceneIndex].ref = video
      }

      loadedVideos.current[sceneIndex].addEventListener('ended', videoEnded)
      setVideo(loadedVideos.current[sceneIndex])

      if (isPlaying) {
        loadedVideos.current[sceneIndex].play()
      } else {
        loadedVideos.current[sceneIndex].play()
        setTimeout(() => loadedVideos.current[sceneIndex].pause(),10) //need to play the first moment of video to get a still frame rather than blackness
      }

      if (sceneIndex < scenes.length -2) {

        if (!loadedVideos.current[sceneIndex+1]) {
          loadedVideos.current[sceneIndex+1] = Object.assign(document.createElement('video'), {
            id: 'video' + (sceneIndex+1),
            key: 'video' + (sceneIndex+1),
            src: scenes[sceneIndex+1].src,
            sceneIndex: sceneIndex+1,
            crossOrigin: 'Anonymous',
            loop: scenes[sceneIndex+1].loop,
            preload: "auto",
            muted: true,
            onLoadEnd: () => {console.log(sceneIndex+1,"preloaded")}
          })
        };
        //preloadVideoRef.current = preloadVideo;
        console.log("plv",loadedVideos.current[sceneIndex+1]);
      }

  }, [sceneIndex,gotoNext])


  return (
    <div className='scene'>
      <VRCanvas camera={{  position: [0,1.75,0] }}>
        <Suspense fallback={<Text>Loading...</Text>} r3f>
          <Preload all /> 
          {loadedVideos.current[sceneIndex] &&
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

        <CameraBoundsBox lowerBound={[-.5,1.5,-.75]} upperBound={[.5,2.25,.5]} />

        <OrbitControls target={[0,1.75,0]} minDistance={0} maxDistance={0.01} enableZoom={false} enablePan={false} enableDamping dampingFactor={0.2} autoRotate={false} rotateSpeed={-0.5} />
        <MovementController applyForward={false} key="rightHandMovement" />
        <MovementController hand="left" applyRotation={true} applyForward={false} key="leftHandMovement" />
        <DefaultXRControllers />

        {/* <Hands /> */}
        </Suspense> 

      </VRCanvas>
    </div>
  )
}
