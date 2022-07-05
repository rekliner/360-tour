import { useThree, useFrame } from "@react-three/fiber";
import { VRCanvas, Interactive } from "@react-three/xr";
import * as THREE from "three";
import { useState, useRef } from "react";
//import { OrbitControls, Stats, Text } from "@react-three/drei";

export const VRTextPanel = ({
  title,
  content,
  onClick,
  titleFontColor = "white",
  bodyFontColor = "white",
  bgColor = "#444",
  height = 1,
  width = title.length * 0.2,
  position = [0, 2, -2],
  follow = true,
  followDelay = 200
}) => {
  const { gl, camera } = useThree();
  const cam = gl.xr.isPresenting ? gl.xr.getCamera(camera) : camera;
  const cp = cam.position;
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  let cDelta = 0;
  const angleToLookAtCamera = (cp) => {
    const absAngle =
      2 *
      Math.atan(
        cp.z /
          (Math.abs(cp.x) + Math.sqrt(Math.pow(cp.x, 2) + Math.pow(cp.z, 2)))
      );
    return cp.x > 0 ? Math.PI / 2 - absAngle : absAngle - Math.PI / 2;
  };
  useFrame((state, delta) => {
    if (follow) {
      cDelta += Math.floor(delta * 1000);
      if (cDelta > followDelay) {
        cDelta = cDelta % followDelay;
        panelRef.current.rotation.y = angleToLookAtCamera(cp); // = [0, angle, 0];
      }
    }
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const clicked = () => {
    console.log(contentRef.current);
    setIsClicked(true);
    onClick();
    setTimeout(() => {
      setIsClicked(false);
    }, 125);
  };
  return (
      <Interactive
        onSelect={() => clicked()}
        onHover={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <group
          ref={panelRef}
          position={position}
          onClick={() => clicked()}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
          rotation={[0, angleToLookAtCamera(cp), 0]}
        >
          
          <mesh>
            <planeBufferGeometry args={[width, height]} />
            <meshLambertMaterial attach="material" color={bgColor} />
          </mesh>

          <Text
            color={titleFontColor}
            width={width}
            scale={[
              width * (title.length / 20),
              width * (title.length / 20),
              1
            ]}
            position={[0, height / 2 - title.length / 20, 0.1]}
          >
            {title}
          </Text>
          <Text
            ref={contentRef}
            textAlign="justify"
            maxWidth={1}
            fontSize={0.05}
            scale={[
              width * (title.length / 20),
              width * (title.length / 20),
              1
            ]}
            color={bodyFontColor}
            position={[0, 0, height / 16]}
          >
            {content}
          </Text>
        </group>
      </Interactive>
  );
};
