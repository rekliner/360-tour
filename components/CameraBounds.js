import { useThree, useFrame } from "@react-three/fiber";

export const CameraBounds = (pointA,pointB) => {
    const { gl, camera } = useThree();
    const cam = gl.xr.isPresenting ? gl.xr.getCamera(camera) : camera;
    const cp = cam.position;
    useFrame(({cam}) => {
        cp.map((axis,index) => {
            if (axis > pointA[index]) axis = pointA[index];
            if (axis < pointB[index]) axis = pointB[index];
        })
    })
}
