// app/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Ref for the GSAP timeline
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  // MODIFIED: Replaced boolean lock with a ref to hold the active tween instance
  const activeTween = useRef<gsap.core.Tween | null>(null);

  const logoRef = useRef<HTMLImageElement>(null);
  const textRef1 = useRef<HTMLDivElement>(null);
  const textRef2 = useRef<HTMLDivElement>(null);
  const textRef3 = useRef<HTMLDivElement>(null);
  const textRef4 = useRef<HTMLDivElement>(null); 

  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);

  const frameCount = 1037;
  const labels = ["start", "section1", "section2", "section3", "end"];

  const getFrameUrl = (frame: number): string => {
    const frameNumber = String(frame).padStart(4, '0');
    return `/frames/frame_${frameNumber}.jpg`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !logoRef.current || !textRef1.current || !textRef2.current || !textRef3.current || !textRef4.current) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let frameProxy = { frame: 0 };
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
      setLoading(false);

      gsap.to(logoRef.current, { opacity: 1, duration: 1.5, ease: 'power1.inOut' });
      
      const img = images[0];
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      const updateImage = () => {
        const frameIndex = Math.round(frameProxy.frame);
        const img = images[frameIndex];
        if (img) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      };
      
      gsap.set(logoRef.current, { opacity: 0 });
      gsap.set(textRef1.current, { xPercent: 100, opacity: 0 });
      gsap.set(textRef2.current, { xPercent: -100, opacity: 0 });
      gsap.set(textRef3.current, { xPercent: 100, opacity: 0 });
      gsap.set(textRef4.current, { opacity: 0, scale: 0.9 }); 

      const tl = gsap.timeline({ paused: true });
      
      tl
        .addLabel("start", 0)
        .to(frameProxy, { frame: 148, ease: 'none', onUpdate: updateImage, duration: 2 })
        .to(logoRef.current, { opacity: 0, duration: 2 }, "<")
        .to(textRef1.current, { xPercent: 0, opacity: 1, duration: 1 }, "-=1")
        .addLabel("section1")
        .to(frameProxy, { frame: 270, ease: 'none', onUpdate: updateImage, duration: 2 })
        .to(textRef1.current, { xPercent: 100, opacity: 0, duration: 2 }, "<")
        .to(textRef2.current, { xPercent: 0, opacity: 1, duration: 2 }, "<")
        .addLabel("section2")
        .to(frameProxy, { frame: 500, ease: 'none', onUpdate: updateImage, duration: 2 })
        .to(textRef2.current, { xPercent: -100, opacity: 0, duration: 2 }, "<")
        .to(textRef3.current, { xPercent: 0, opacity: 1, duration: 2 }, "<")
        .addLabel("section3")
        .to(frameProxy, { frame: frameCount - 1, ease: 'none', onUpdate: updateImage, duration: 3 })
        .to(textRef3.current, { xPercent: 100, opacity: 0, duration: 3 }, "<")
        .to(textRef4.current, { opacity: 1, scale: 1, duration: 3 }, "<")
        .addLabel("end");
        
      timelineRef.current = tl;

    }).catch(error => {
      console.error("Failed to preload images:", error);
      setLoading(false);
    });
    
    // This logic remains the same
    const handleResize = () => {
      if (canvasRef.current && context) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        const frameIndex = Math.round(frameProxy.frame);
        const img = images[frameIndex];
        if (img && img.complete) {
          context.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      timelineRef.current?.kill();
      // Kill the tween too on cleanup
      activeTween.current?.kill();
    };
  }, []);

  // REFACTORED: A single, robust function to handle all navigation
  const navigateToSection = (sectionIndex: number) => {
    // Boundary check
    if (sectionIndex < 0 || sectionIndex >= labels.length) {
      return;
    }

    // If a tween is active, kill it. This prevents overlaps and stuck states.
    if (activeTween.current && activeTween.current.isActive()) {
      activeTween.current.kill();
    }
    
    setCurrentSection(sectionIndex);

    // Create the new tween and store it in our ref
    activeTween.current = timelineRef.current!.tweenTo(labels[sectionIndex], { 
      duration: 1.5, 
      ease: 'power1.inOut'
    });
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Check if a tween is currently active before starting a new one.
      if (activeTween.current && activeTween.current.isActive()) {
        return;
      }
      
      // Scrolling up
      if (e.deltaY < 0) {
        navigateToSection(currentSection + 1); // Go to next section
      // Scrolling down
      } else if (e.deltaY > 0) {
        navigateToSection(currentSection - 1); // Go to previous section
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [currentSection]); // IMPORTANT: Rerun this effect when currentSection changes

  return (
    <main>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black text-white flex justify-center items-center z-50">
          <h1>Loading Assets...</h1>
        </div>
      )}
      <section className="h-screen relative overflow-hidden bg-black" style={{ perspective: '800px' }}>
        <canvas ref={canvasRef} className="w-full h-full" />
        
        <img
          ref={logoRef}
          src="/logo.png"
          alt="Logo"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 md:w-1/3 z-10 pointer-events-none"
        />

        {/* Text Box Containers - No changes here */}
        <div ref={textRef1} className="absolute top-1/2 right-0 -translate-y-1/2 w-11/12 md:w-1/3">
          <button className="w-full p-8 text-3xl md:text-6xl font-bold text-white text-center transition-transform duration-300 hover:scale-105 focus:shadow-lg" style={{transform: 'rotateX(-36deg)', textShadow: '1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 0px #000, 5px 5px 10px rgba(0,0,0,0.5)'}}>
            View Events
          </button>
        </div>
        <div ref={textRef2} className="absolute top-1/2 left-0 -translate-y-1/2 w-11/12 md:w-1/3">
          <button className="w-full p-8 text-3xl md:text-6xl font-bold text-white text-center transition-transform duration-300 hover:scale-105 focus: shadow-lg" style={{transform: 'rotateX(-36deg)', textShadow: '1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 0px #000, 5px 5px 10px rgba(0,0,0,0.5)'}}>
            View Gallery
          </button>
        </div>
        <div ref={textRef3} className="absolute top-1/2 right-0 -translate-y-1/2 w-11/12 md:w-1/3">
          <button className="w-full p-8 text-3xl md:text-6xl font-bold text-white text-center transition-transform duration-300 hover:scale-105 focus:shadow-lg" style={{transform: 'translateY(-100%) rotateX(-36deg)', textShadow: '1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 0px #000, 5px 5px 10px rgba(0,0,0,0.5)'}}>
            Our Team
          </button>
        </div>
        <div ref={textRef4} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 md:w-1/2">
          <button className="w-full p-8 text-4xl md:text-7xl font-bold text-white text-center transition-transform duration-300 hover:scale-105 focus:shadow-lg" style={{transform: 'rotateX(-36deg)', textShadow: '1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 0px #000, 5px 5px 10px rgba(0,0,0,0.5)'}}>
            Our Sponsors
          </button>
        </div>
            
        {/* === MODIFIED NAVIGATION ARROWS === */}
        {/* Up Arrow (Next) */}
        {currentSection < labels.length - 1 &&(
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-20" style={{ transform: 'translateX(50%) rotateX(25deg)' }}>
            <button onClick={() => navigateToSection(currentSection + 1)} className="p-3 rounded-full text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-26 w-26" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="butt" strokeLinejoin="miter" strokeWidth={3} d="M4.5 12.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Down Arrow (Previous) */}
        {currentSection > 0 &&(
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20" style={{ transform: 'translateX(30%) rotateX(-25deg)' }}>
            <button onClick={() => navigateToSection(currentSection - 1)} className="p-3 rounded-full text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-26 w-26" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="butt" strokeLinejoin="miter" strokeWidth={3} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}