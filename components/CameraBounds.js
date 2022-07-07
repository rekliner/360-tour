import { useThree, useFrame } from "@react-three/fiber";
import { useRef } from "react";

/** 
 * CameraBounds 
 * Lowerbound and upperbound define a box where the camera will be moved back to if it crosses outside in any dimension
 * when combined with any physics this tends to put baby in a corner.  Next phase will be to make it a spherical bound
 * */
export const CameraBounds = ({ lowerBound, upperBound }) => {
  const { gl, camera } = useThree();
  const camRef = useRef(gl.xr.isPresenting ? gl.xr.getCamera(camera) : camera);
  const margin = .05; //too small a margin and floating point arithmentic will put it over the bounds again.  Too large and you get blocky hopping.

  let cDelta = 0; //optional frame rate reduction to spare cpu and enable logging
  const frameDelay = 10; //optional frame rate reduction to spare cpu and enable logging
  useFrame((state, delta) => {
    cDelta += Math.floor(delta * 1000); //optional frame rate reduction to spare cpu and enable logging
    if (cDelta > frameDelay) { //optional frame rate reduction to spare cpu and enable logging
      cDelta = cDelta % frameDelay; //optional frame rate reduction to spare cpu and enable logging

      if (camRef.current?.position && Array.isArray(lowerBound) && Array.isArray(upperBound)) {
        let axes = ["x","y","z"];
        axes.map((axis,index) => {
          if (camRef.current.position[axis] > upperBound[index]) {
            camRef.current.position[axis] = upperBound[index] - margin;
          }
          if (camRef.current.position[axis] < lowerBound[index]) {
            camRef.current.position[axis] = upperBound[index] + margin;
          }
        })
      }

    }
  });
  return null;
};
