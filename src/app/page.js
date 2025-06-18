"use client"
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, CameraControls, Environment, useGLTF, ContactShadows, PerspectiveCamera, 
  axesHelper, KeyboardControls, useKeyboardControls, Box} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import gsap from 'gsap';
import Swal from 'sweetalert2'


function ClawModel({clawPos, isLowering, hasPrize}) {
  const clawModel = useGLTF(`claw.glb`);
  const clawModelRef = useRef();

  useFrame((state) => {
    if (clawModelRef.current) {
      //用 foreach 尋找 clawModelRef 中，名稱為 claw 物件，並且將其 rotation.y 增加 0.01
      clawModelRef.current.traverse((child) => {

        if (child.name === 'claw') {
          child.position.set(clawPos.x, clawPos.y, clawPos.z);
        }

        if(isLowering) return;

        if (child.name === 'clawBase') {
          child.position.set(clawPos.x, clawPos.y+0.15, clawPos.z);
        }

        if (child.name === 'track') {
          child.position.set(0.011943, clawPos.y+0.15, clawPos.z);
        }

        if (child.name === 'bear') {
          child.visible = hasPrize;
        }
      });
    }
  })
  
  return (
    <primitive
      ref={clawModelRef}
      object={clawModel.scene}
      scale={[0.6, 0.6, 0.6]}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}


function Camera({setClawPos, boxRef, clawPos, isLowering, setIsLowering, hasPrize, setHasPrize}) {
  const cameraRef = useRef();
  
  //  [注意] useFrame and useKeyboardControls 都需要放在 Canvas 的子组件中
  
  useFrame(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(0, 1, 0);
    }
  });

  const [, getKeys] = useKeyboardControls();


  useFrame((state) => {
    const { forward, backward, left, right, jump } = getKeys();
    const speed = 0.01;
    const limitX = 0.4;
    const limitZ = 0.4;
    
    if (boxRef.current) {
      if(!isLowering){
        if (forward) {
          setClawPos({x: clawPos.x, y: clawPos.y, z: clawPos.z - speed});
        }
        if (backward) {
          setClawPos({x: clawPos.x, y: clawPos.y, z: clawPos.z + speed});
        }
        if (left) {
          setClawPos({x: clawPos.x - speed, y: clawPos.y, z: clawPos.z});
        }
        if (right) {
          setClawPos({x: clawPos.x + speed, y: clawPos.y, z: clawPos.z});
        }
  
        if (clawPos.x > limitX) {
          setClawPos({x: limitX, y: clawPos.y, z: clawPos.z});
        }
        if (clawPos.x < -limitX) {
          setClawPos({x: -limitX, y: clawPos.y, z: clawPos.z});
        }
        if (clawPos.z > limitZ) {
          setClawPos({x: clawPos.x, y: clawPos.y, z: limitZ});
        }
        if (clawPos.z < -limitZ) {
          setClawPos({x: clawPos.x, y: clawPos.y, z: -limitZ});
        }

        if (jump) {
          setHasPrize(false);
          console.log('jump');
          setIsLowering(true);
          console.log("down");
        
          // 決定是否中獎
          const random = Math.random();  
          
          const prizeA = '/prizeA.png';
          const prizeB = '/prizeB.png';
          const prizeC = '/prizeC.png';
        
          // 抽中獎品的邏輯（依機率調整）
          let prizeType = null;
          let prizeImage = null;

          if (random < 0.2) {
            prizeType = '快樂小熊';
            prizeImage = prizeA;
          } else if (random < 0.5) {
            prizeType = '眨眼小熊';
            prizeImage = prizeB;
          } else if (random < 0.8) {
            prizeType = '哭哭小熊';
            prizeImage = prizeC;
          }

          const isWin = prizeType !== null;
          setHasPrize(isWin);
        
          gsap.timeline()
            .to(clawPos, { y: 2, duration: 2 })
            .to(clawPos, { y: 2.7, duration: 3 })
            .then(() => {
              setIsLowering(false);
        
             if (isWin) {
              let prizeImage;
              if (prizeType === '快樂小熊') prizeImage = prizeA;
              if (prizeType === '眨眼小熊') prizeImage = prizeB;
              if (prizeType === '哭哭小熊') prizeImage = prizeC;

              Swal.fire({
                title: '中獎了！',
                text: `恭喜你得到了 ${prizeType} ！`,
                imageWidth: 200, // 設定寬度
                imageHeight: 200, // 設定高度
                imageUrl: prizeImage,
                imageAlt: `Prize ${prizeType}`,
                icon: 'success',
                confirmButtonText: '確定'
              });
            }else {
                console.log("沒中獎");
                Swal.fire({
                  title: '沒中獎',
                  text: '再接再厲！',
                  icon: 'error',
                  confirmButtonText: '確定'
                });
              }
            });
        }
        
        
      }
      
    }
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[0, 1, 3]} // 3 ~ 6
    />
  );
}



export default function Home() {
  const boxRef = useRef();
  const isHidden = true;

  const [clawPos, setClawPos] = useState({x: -0.4, y: 2.7, z: 0.2});
  const [isLowering, setIsLowering] = useState(false);
  const [hasPrize, setHasPrize] = useState(false);

  useEffect(() => {
    Swal.fire({
      title: '歡迎遊玩熊熊夾娃娃機！',
      html: `
        <p>快來看看你能抓到哪種熊熊吧 🐻</p>
        <p>使用 <strong>WASD</strong> 或 <strong>方向鍵</strong> 移動</p>
        <p>按下 <strong>空白鍵</strong> 抓取娃娃！</p>
      `,
      icon: 'info',
      confirmButtonText: '開始遊戲'
    });
  }, []);
  


  return (
    <div className="w-full h-screen">
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
          { name: "jump", keys: ["Space"] },
        ]}
      >
        <Canvas>
          <ambientLight intensity={Math.PI / 2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
          <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
          

          {
            !isHidden && <RoundedBox
              args={[1, 1, 1]} // Width, height, depth. Default is [1, 1, 1]
              radius={0.05} // Radius of the rounded corners. Default is 0.05
              smoothness={4} // The number of curve segments. Default is 4
              bevelSegments={4} // The number of bevel segments. Default is 4, setting it to 0 removes the bevel, as a result the texture is applied to the whole geometry.
              creaseAngle={0.4} // Smooth normals everywhere except faces that meet at an angle greater than the crease angle
            >
              <meshPhongMaterial color="#f3f3f3"/>
            </RoundedBox>
          }

          <Box ref={boxRef} args={[0.1, 0.1, 0.1]} position={[0, 0, 0]}>
            <meshPhongMaterial color="#f3f3f3"/>
          </Box>


          <Suspense fallback={null}>
            <ClawModel clawPos={clawPos} isLowering={isLowering} hasPrize={hasPrize} />
          </Suspense>


          <Environment
            background={true}
            backgroundBlurriness={0.5}
            backgroundIntensity={1}
            environmentIntensity={1}
            preset={'dawn'}
          /> 

          <ContactShadows opacity={1} scale={10} blur={10} far={10} resolution={256} color="#DDDDDD" />

          <Camera boxRef={boxRef} clawPos={clawPos} setClawPos={setClawPos} isLowering={isLowering} setIsLowering={setIsLowering}
            hasPrize={hasPrize} setHasPrize={setHasPrize}
          />
          <CameraControls enablePan={false} enableZoom={false} />
          {/* <axesHelper args={[10]} /> */}


        </Canvas>
      </KeyboardControls>
    </div>
  );
}
