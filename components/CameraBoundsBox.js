import { useThree, useFrame } from "@react-three/fiber";
import { useState, useRef } from "react";
import { useXR, useXRFrame } from "@react-three/xr";
import { Text } from "@react-three/drei";
import { Vector3 } from "three";
/**
 * CameraBounds
 * Lowerbound and upperbound define a box where the camera will be moved back to if it crosses outside in any dimension
 * when combined with any physics this tends to put baby in a corner.  Next phase will be to make it a spherical bound
 * */
export const CameraBoundsBox = ({ lowerBound, upperBound, debug = false }) => {
  const { camera, gl } = useThree();
  const { player, isPresenting } = useXR();

  const refSpace = gl.xr.getReferenceSpace("viewer");
  const axes = ["x", "y", "z"];
  const margin = 0.05; //too small a margin and floating point arithmentic will put it over the bounds again.  Too large and you get blocky hopping.
  const [debugText, setDebugText] = useState("");
  const headsetPos = useRef(new Vector3(0, 0, 0));
  const initialHeadsetPos = useRef(null); //not sure why viewer pose doesn't spawn at origin
  const cDelta = useRef(0); //optional frame rate reduction to spare cpu and enable logging
  const frameDelay = 100; //optional frame rate reduction to spare cpu and enable logging

  const hadFrame = useRef(false); //this is a hack until @react-three/xr 4.0 is released
  useXRFrame((delta, frame) => {
    if (hadFrame.current) {
      hadFrame.current = false;
      const pose = frame.getViewerPose(refSpace);
      if (!initialHeadsetPos.current) {
        initialHeadsetPos.current = axes.map(
          (axis) => pose.transform.position[axis]
        );
      }
      //headsetPos.current = pose.transform.position;  //nope
      axes.map(
        //converting from DomPointReadOnly to Vector3
        (axis, index) =>
          (headsetPos.current[axis] = pose.transform.position[axis]) // - initialHeadsetPos.current[index]
      );
    }
  });
  //end react-three/xr 3.5 hack

  useFrame((state, delta) => {
    cDelta.current += Math.floor(delta * 1000); //optional frame rate reduction to spare cpu and enable logging
    if (cDelta.current > frameDelay) {
      cDelta.current = cDelta.current % frameDelay; //optional frame rate reduction to spare cpu and enable logging
      hadFrame.current = true;
      const cameraMode = isPresenting ? player : camera;
      const transformedHeadsetPos = headsetPos.current.applyEuler(
        cameraMode.rotation
      );
      if (debug) {
        setDebugText(
          axes.map(
            (axis, index) =>
              (
                Math.round(
                  (cameraMode.position[axis] + headsetPos.current[axis]) * 100
                ) / 100
              ).toString() +
              axis +
              "  "
          ) + (isPresenting ? "VR mode" : "Screen mode")
        );
      }
      axes.map((axis, index) => {
        if (
          cameraMode.position[axis] + transformedHeadsetPos[axis] >
          upperBound[index]
        ) {
          if (debug)
            console.log(
              "redirected+",
              axis,
              "from",
              camera.position[axis] + transformedHeadsetPos[axis],
              "to",
              upperBound[index] - transformedHeadsetPos[axis]
            );

          cameraMode.position[axis] =
            upperBound[index] - margin - transformedHeadsetPos[axis];
          //player.position[axis] = cameraMode.position[axis];
        }
        if (
          cameraMode.position[axis] + transformedHeadsetPos[axis] <
          lowerBound[index]
        ) {
          if (debug)
            console.log(
              "redirected-",
              axis,
              "from",
              camera.position[axis] + transformedHeadsetPos[axis],
              "to",
              lowerBound[index]
            );
          cameraMode.position[axis] =
            lowerBound[index] + margin - transformedHeadsetPos[axis];
          //player.position[axis] = cameraMode.position[axis];
        }
        return false;
      });
    }
  });
  return debug && <Text>{debugText}</Text>;
};
