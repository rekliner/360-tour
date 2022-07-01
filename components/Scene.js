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

  
  return (
    <>
      <Interactive
        onHover={() => {}}
        onSelect={() => {
          setShowPopup(false)
        }}>
        <mesh
          onClick={() => {
            console.log('clear popup')
            setShowPopup(false)
          }}>
          <sphereBufferGeometry args={[500, 60, 40]}  />
          <meshBasicMaterial side={THREE.BackSide} toneMapped={false} >
            {currentScene && <videoTexture attach="map" offset-z={90 / ( 2 * Math.PI )} args={[video]} encoding={THREE.sRGBEncoding} /> }
          </meshBasicMaterial>
        </mesh>
        {showPopup 
          //TODO: vr friendly content
          // && (<Html center className="popupContainer">
          //   <div className="popupTitle">{showPopup.title}</div>
          //   <div className="popupContent">{showPopup.content}</div>
          //   <button className="clickable" onClick={(event) => setShowPopup(false)}>
          //     Close
          //   </button>
          // </Html>)
        
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
      
      isHost && {  //TODO:  VR firendly buttons
        // <Html center>
        //   <div className="navButtons">
        //     <div className="navButton" onClick={props.gotoPrev}>
        //       <div className="popupTitle">Prev</div>
        //     </div>
        //     <div className="navButton" onClick={props.gotoNext}>
        //       <div className="popupTitle">Next</div>
        //     </div>
        //     <div className="navButton" onClick={() => togglePlay()}>
        //       <div className="popupTitle">{props.isPlaying ? "Pause" : "Play"}</div>
        //     </div>
        //   </div>
        // </Html>
      }
    </>
  )
}

const BubbleButton = ({ name, position, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <Interactive onSelect={onClick} onHover={() => setIsHovered(true)} onBlur={() => setIsHovered(false)}>
       <mesh
          position={position}
          onClick={(event) => onClick()}
          onPointerOver={(event) => setIsHovered(true)}
          onPointerOut={(event) => setIsHovered(false)}>
          <boxGeometry args={[1,.5,.1]} applyRotation={[180,0,0]}/>
          <meshBasicMaterial color={isHovered ? 'yellow' : 'white'} />
          <Text position={[1,.5,.1]} color="red">{name}</Text> 
        </mesh>
    </Interactive>
  )
}


export default function Scene({sceneIndex,scenes,isPlaying, setIsPlaying, setSceneIndex,isHost}) {
  const [currentScene, setCurrentScene] = useState(scenes[sceneIndex])
  const [video, setVideo] = useState(null)
  const vidRef = useRef(null)
  //const { player } = useXR()
  //const [isPlaying, setPlaying] = useState(true)
  //const [recentEvents, roomEvents] = useRoomEvents()

  const gotoNext = useCallback(() => {
    console.log('video ended! next is', (sceneIndex + 1) % scenes.length, vidRef.current)
    vidRef.current.removeEventListener('ended', this, false)
    if (isHost) { 
      setSceneIndex((sceneIndex + 1) % scenes.length)
    }
    setCurrentScene(scenes[(sceneIndex + 1) % scenes.length])
  }, [currentScene])

  // const gotoPrevious = () => {
  //   console.log('previous video')
  //   vidRef.current.removeEventListener('ended', this, false)
  //   setCurrentScene(sources[previousSceneIndex(currentScene)])
  // }

//   useEffect(() => {
//     if (latestScene && latestScene != currentScene) {
//       console.log("signaled scene change to ",latestScene);
//       vidRef.current.removeEventListener('ended', this, false);
//       setCurrentScene(sources[latestScene]);
//     }
//   },[latestScene])
//   const latestScene = useMemo(() => {
//     const lc =  recentEvents
//       .find(({eventName}) => eventName === 'sceneChange');
//       console.log("scene",lc);
//       return lc;
//   }, [recentEvents])

  useEffect(() => {
    if (video) {
      if (isPlaying) {
        video.play()
        console.log('video started', video)
      } else {
        video.play()
        setTimeout(([]) => video.pause(),10)
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

  // useEffect(() => {
  //   setCurrentScene(sources[0])
  //   console.log('p', player)
  // }, [player])
  useGLTF.preload("/trolley.glb");
  const Trolley = () => {

    
    const group = useRef();
    const { nodes, materials } = useGLTF('/trolley.glb');
    return (
      <group ref={group} dispose={null}>
        <group rotation={[-Math.PI / 2, 0 , Math.PI]} scale={[1.0,1.0,0.5]} position={[0.1,-.25,0]} >
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.defaultMaterial.geometry}
              material={materials.initialShadingGroup}
            />
          </group>
        </group>
      </group>
    )};
  function Model3({ url }) {
    const gltf = useLoader(GLTFLoader, `${url}`);
    return <primitive object={gltf.scene} dispose={null} />;
  }




  return (
    <div className="scene">
    <VRCanvas frameloop="demand" camera={{ position: [0, 0, 0.1] }}>
      <Suspense fallback={null}>
        <Preload all />
        {currentScene &&
          <SceneObjects
            currentScene={currentScene}
            video={video}
            //player={player}
            gotoNext={() => {
              console.log('click')
              return gotoNext()
            }}
            gotoPrev={() => gotoPrevious()}
            isPlaying={isPlaying}
            setPlaying={setIsPlaying}
            scenes={scenes}
          />
        }
      </Suspense> 
      <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.2} autoRotate={false} rotateSpeed={-0.5} />
      <MovementController applyForward={false} />
      <MovementController hand="left" applyRotation={true} applyForward={false} />
      <DefaultXRControllers />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Trolley /> 

      <Hands />
    </VRCanvas>
    </div>
  )
}
