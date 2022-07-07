import { useThree, useFrame } from "@react-three/fiber";


const angleToLookAtCamera2d = (cp) => {
    const absAngle =
    2 *
    Math.atan(
        cp.z /
        (
            Math.abs(cp.x) + 
            Math.sqrt(
                Math.pow(cp.x, 2) + 
                Math.pow(cp.z, 2)
            )
        )
    );
    return cp.x > 0 ? Math.PI / 2 - absAngle : absAngle - Math.PI / 2;
};

export function TurnToCamera2d({objRef,follow=true,frameDelay=200}) {
    const { gl, camera } = useThree();
    const cam = gl.xr.isPresenting ? gl.xr.getCamera(camera) : camera;
    const cp = cam.position;
    let cDelta = 0; //optional frame rate reduction to spare cpu and enable logging
    useFrame((state, delta) => {
        if (follow) {
            cDelta += Math.floor(delta * 1000); //optional frame rate reduction to spare cpu and enable logging
            if (cDelta > frameDelay) { //optional frame rate reduction to spare cpu and enable logging
                cDelta = cDelta % frameDelay; //optional frame rate reduction to spare cpu and enable logging

                if (objRef.current) {
                    objRef.current.rotation.y = angleToLookAtCamera2d(cp); // = [0, angle, 0];
                }
            }
        }
    });

    return null
};

