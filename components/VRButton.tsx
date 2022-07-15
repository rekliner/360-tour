import { useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { Interactive,XRInteractionEvent } from "@react-three/xr";
import React, { useState, useRef, Suspense, MouseEventHandler } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useXR } from "@react-three/xr";

type Props = {
  onClick: (event: React.MouseEvent<HTMLButtonElement> | void) => void,
  label: string,
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
}: Props) => {
  const { camera } = useThree();
  const { player, isPresenting } = useXR();

  const cam = isPresenting ? player : camera;
  const buttonRef = useRef<THREE.Group>(null);

  const cDelta = useRef(0); //optional frame rate reduction
  useFrame((state, delta) => {
    if (follow) {
      cDelta.current += Math.floor(delta * 1000); //optional frame rate reduction
      if (cDelta.current > frameDelay) {    //optional frame rate reduction
        cDelta.current = cDelta.current % frameDelay; //optional frame rate reduction

        if (buttonRef.current?.quaternion) {
          buttonRef.current.quaternion.copy(cam.quaternion);
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
          ref={buttonRef}
          position={position}
          onClick={(e: ThreeEvent<MouseEvent>) => clicked(e)}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
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
