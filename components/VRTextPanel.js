import { useThree, useFrame } from "@react-three/fiber";
import { Interactive } from "@react-three/xr";
import { useState, useRef, Suspense } from "react";
import { Text } from "@react-three/drei";
import { useXR } from "@react-three/xr";

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
}) => {
  const { camera } = useThree();
  const { player, isPresenting } = useXR();
  const cam = isPresenting ? player : camera;
  const thisRef = useRef(null);

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
  const clicked = () => {
    setIsClicked(true);
    onClick();
    setTimeout(() => {
      setIsClicked(false);
    }, 125);
  };
  return (
    <Suspense fallback={null}>
      <Interactive
        onSelect={() => clicked()}
        onHover={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <group
          ref={thisRef}
          position={position}
          onClick={() => clicked()}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          <mesh>
            <planeBufferGeometry args={[5, 7]} />
            <meshLambertMaterial attach="material" color="#666" />
          </mesh>
          <Text
            color="#FFF"
            width={10}
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
