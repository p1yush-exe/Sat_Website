// app/page.tsx

'use client'; // This must be a client component to use hooks and browser APIs.

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  // Create typed refs for the video and the section that will be pinned
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;

    // Safety check to make sure the elements are loaded
    if (!video || !section) return;

    // We must wait for the video's metadata to load to get its actual duration.
    const handleMetadataLoaded = () => {
      // Create the scroll-based animation
      gsap.to(video, {
        // Animate the 'currentTime' property of the video
        currentTime: video.duration,
        ease: 'none', // Use a linear ease for a direct 1-to-1 scrub
        scrollTrigger: {
          trigger: section, // The element that triggers the animation
          pin: true,        // Pin the trigger element while scrolling
          start: 'top top', // Start the animation when the top of the section hits the top of the viewport
          end: '+=3000',    // The animation will last for 3000px of scrolling. The longer this value, the slower the video plays.
          scrub: true,      // This is the key part! It links the animation's progress directly to the scrollbar.
        },
      });
    };

    video.addEventListener('loadedmetadata', handleMetadataLoaded);

    // --- CLEANUP ---
    // This function runs when the component is unmounted to prevent memory leaks
    return () => {
      video.removeEventListener('loadedmetadata', handleMetadataLoaded);
      // Kill all active ScrollTrigger instances
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []); // The empty dependency array means this effect runs only once after the component mounts.

  return (
    <main>
      {/* This section acts as the container and the trigger for the animation.
          ScrollTrigger will automatically handle its height and create the scroll distance
          based on the 'end' property defined above. */}
      <section ref={sectionRef} className="h-screen relative">
        <video
          ref={videoRef}
          // The path must be absolute from the 'public' folder.
          src="/sat_tech_final.mp4"
          playsInline
          muted
          // Ensure the video covers the entire section
          className="w-full h-full object-cover"
        />
      </section>
    </main>
  );
}
