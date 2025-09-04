// app/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(true); // State to track loading

  // --- 1. CONFIGURATION (CORRECTED) ---
  const frameCount = 2500; // Corrected frame count 

  // Corrected path generation
  const getFrameUrl = (frame: number): string => {
    const frameNumber = String(frame).padStart(4, '0');
    return `/frames/frame_${frameNumber}.jpg`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // --- 2. IMAGE PRELOADING (IMPROVED) ---
    const frameProxy = { frame: 0 };
    const images: HTMLImageElement[] = [];

    const preloadImages = () => {
      const promises = [];
      for (let i = 1; i <= frameCount; i++) {
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = getFrameUrl(i);
          images.push(img);
        });
        promises.push(promise);
      }
      return Promise.all(promises);
    };

    preloadImages().then(() => {
      setLoading(false); // Hide loading indicator
      
      // --- 3. GSAP ANIMATION ---
      context.drawImage(images[0], 0, 0, canvas.width, canvas.height);

      gsap.to(frameProxy, {
        frame: frameCount - 1,
        snap: 'frame',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 0.5,
          start: 'top top',
          end: '+=6000', // Increased scroll distance for more frames
        },
        onUpdate: () => {
          const frameIndex = Math.round(frameProxy.frame);
          const img = images[frameIndex];
          if (img) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        },
      });
    }).catch(error => {
      console.error("Failed to preload images:", error);
      setLoading(false); // Also hide loading on error
    });
    
    // --- 4. RESPONSIVENESS ---
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const frameIndex = Math.round(frameProxy.frame);
      const img = images[frameIndex];
      if (img && img.complete) {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    
    window.addEventListener('resize', handleResize);

    // --- 5. CLEANUP ---
    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <main>
      {/* Optional: Add a loading indicator */}
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'black', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <h1>Loading Assets...</h1>
        </div>
      )}
      <section ref={sectionRef} className="h-screen relative">
        <canvas ref={canvasRef} className="w-full h-full" />
      </section>
      {/* Add another section to create scrollable space */}
      <section className="h-screen bg-gray-900 flex items-center justify-center">
        <h2 className="text-white text-4xl">Scroll Down</h2>
      </section>
    </main>
  );
}