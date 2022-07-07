import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { VRCanvas, Interactive } from "@react-three/xr";
import * as THREE from "three";
import { useState, useRef, Suspense } from "react";
import { OrbitControls, Stats, RoundedBox, Text } from "@react-three/drei";
import { TurnToCamera2d } from "./TurnToCamera2d";

export const VRButton = ({
  label,
  onClick,
  fontColor = "blue",
  fontColorHovered = "lightblue",
  fontColorClicked = "grey",
  bgColor = "#444",
  bgColorHovered = "grey",
  bgColorClicked = "yellow",
  height = 0.3,
  width = label.length * 0.2,
  position = [0, 0, 0],
  follow = true,
  frameDelay = 200
}) => {
  const buttonRef = useRef(null);
  // const { gl, camera } = useThree();
  // const cam = gl.xr.isPresenting ? gl.xr.getCamera(camera) : camera;
  // const cp = cam.position;
  // let cDelta = 0;
  // const angle2dToLookAtCamera = (cp) => {
  //   const absAngle =
  //     2 *
  //     Math.atan(
  //       cp.z /
  //         (Math.abs(cp.x) + Math.sqrt(Math.pow(cp.x, 2) + Math.pow(cp.z, 2)))
  //     );
  //   return cp.x > 0 ? Math.PI / 2 - absAngle : absAngle - Math.PI / 2;
  // };
  // useFrame((state, delta) => {
  //   if (follow) {
  //     cDelta += Math.floor(delta * 1000);
  //     if (cDelta > followDelay) {
  //       cDelta = cDelta % followDelay;
  //       if (buttonRef.current) {
  //         buttonRef.current.rotation.y = angle2dToLookAtCamera(cp); // = [0, angle, 0];
  //       }
  //     }
  //   }
  // });
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
          ref={buttonRef}
          position={position}
          onClick={() => clicked()}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          <TurnToCamera2d objRef={buttonRef} follow={follow} frameDelay={frameDelay}/>
          <RoundedBox
            args={[width, height, 1]}
            radius={height / 2}
            scale={[1, 1, height / 32]}
          >
            <meshLambertMaterial
              attach="material"
              color={
                isClicked
                  ? bgColorClicked
                  : isHovered
                  ? bgColorHovered
                  : bgColor
              }
            />
          </RoundedBox>
          <Text
            color={
              isClicked
                ? fontColorClicked
                : isHovered
                ? fontColorHovered
                : fontColor
            }
            scale={[height * 10, height * 10, 1]}
            position={[0, 0, height / 16]}
          >
            {label}
          </Text>
        </group>
      </Interactive>
    </Suspense>
  );
};

export default function App({ label }) {
  return (
    <VRCanvas camera={{ position: [3, 2, 4] }}>
      <color attach="background" args={["#010101"]} />
      <ambientLight />
      <pointLight position={[5, 5, 5]} />
      <primitive object={new THREE.AxesHelper(2)} />
      <OrbitControls />
      <Stats />

      <group position={[3, 0, 0]}>
        <VRButton
          label="Click"
          position={[0, 2, 0]}
          onClick={() => console.log("clicked!")}
        />
        <VRButton
          label="Click"
          position={[-2, 1, -2]}
          onClick={() => console.log("clicked!")}
        />
        <VRButton
          label="Click"
          position={[-2, 1.22, 2]}
          onClick={() => console.log("clicked!")}
        />
        <VRButton
          label="Click"
          position={[2, 1.4, 2]}
          onClick={() => console.log("clicked!")}
        />
        <VRButton
          label="Click"
          position={[2, 1.6, -2]}
          onClick={() => console.log("clicked!")}
        />
      </group>
    </VRCanvas>
  );
}
