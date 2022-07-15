import { useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { Interactive, XRInteractionEvent } from "@react-three/xr";
import React, { useState, useRef, Suspense } from "react";
import { Text } from "@react-three/drei";
import { useXR } from "@react-three/xr";

type Props = {
  title: string,
  content: string,
  onClick: (event: React.MouseEvent<HTMLButtonElement> | void) => void,
  fontColor: string,
  fontColorHovered: string,
  fontColorClicked: string,
  bgColor: string,
  bgColorHovered: string,
  bgColorClicked: string,
  height: number,
  width: number,
  position: [x: number, y: number, z: number],
  follow: boolean,
  frameDelay: number,
}

export const VRTextPanel = ({
  title,
  content,
  onClick,
  fontColor = "blue",
  fontColorHovered = "lightblue",
  fontColorClicked = "grey",
  bgColor = "#444",
  bgColorHovered = "grey",
  bgColorClicked = "yellow",
  height = 0.3,
  width = title.length * 0.2,
  position = [0, 0, 0],
  follow = true,
  frameDelay = 200
}:Props) => {
  const { camera } = useThree();
  const { player, isPresenting } = useXR();
  const cam = isPresenting ? player : camera;
  const thisRef = useRef<THREE.Group>(null);

  const cDelta = useRef(0); //optional frame rate reduction
  useFrame((state, delta) => {
    if (follow) {
      cDelta.current += Math.floor(delta * 1000); //optional frame rate reduction
      if (cDelta.current > frameDelay) {
        //optional frame rate reduction
        cDelta.current = cDelta.current % frameDelay; //optional frame rate reduction

        if (thisRef.current?.quaternion) {
          thisRef.current.quaternion.copy(cam.quaternion);
        }
      }
    }
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const clicked = (e: XRInteractionEvent | ThreeEvent<MouseEvent>) => {
    setIsClicked(true);
    onClick();
    setTimeout(() => {
      setIsClicked(false);
    }, 125);
  };
  return (
    <Suspense fallback={null}>
      <Interactive
        onSelect={(e: XRInteractionEvent) => clicked(e)}
        onHover={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <group
          ref={thisRef}
          position={position}
          onClick={(e: ThreeEvent<MouseEvent>) => clicked(e)}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          <mesh>
            <planeBufferGeometry args={[5, 7]} />
            <meshLambertMaterial attach="material" color="#666" />
          </mesh>
          <Text
            color="#FFF"
            scale={[5 * (title.length / 20), 5 * (title.length / 20), 1]}
            position={[0, 7 / 2 - title.length / 20, 0.1]}
          >
            {title}
          </Text>
          <Text
            textAlign="justify"
            maxWidth={1}
            fontSize={0.05}
            scale={[5 * (title.length / 20), 5 * (title.length / 20), 1]}
            color="#fff"
            position={[0, 0, 1 / 16]}
          >
            {content}
          </Text>
        </group>
      </Interactive>
    </Suspense>
  );
};
