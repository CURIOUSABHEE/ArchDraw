'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const fadeUpReveal = (element: string | Element, options: gsap.TweenVars = {}) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 60, filter: 'blur(8px)' },
    {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: element as Element, start: 'top 85%', toggleActions: 'play none none none' },
      ...options,
    }
  );
};

export const staggerReveal = (parent: string, children: string, options: gsap.TweenVars = {}) => {
  return gsap.fromTo(
    `${parent} ${children}`,
    { opacity: 0, y: 40, filter: 'blur(4px)' },
    {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 0.7, stagger: 0.1, ease: 'power2.out',
      scrollTrigger: { trigger: parent, start: 'top 80%', toggleActions: 'play none none none' },
      ...options,
    }
  );
};

export const scaleReveal = (element: string | Element, options: gsap.TweenVars = {}) => {
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
    {
      opacity: 1, scale: 1, filter: 'blur(0px)',
      duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: element as Element, start: 'top 85%', toggleActions: 'play none none none' },
      ...options,
    }
  );
};

export const slideFromLeft = (element: string, options: gsap.TweenVars = {}) => {
  return gsap.fromTo(
    element,
    { opacity: 0, x: -60, filter: 'blur(4px)' },
    {
      opacity: 1, x: 0, filter: 'blur(0px)',
      duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: element, start: 'top 80%' },
      ...options,
    }
  );
};

export const slideFromRight = (element: string, options: gsap.TweenVars = {}) => {
  return gsap.fromTo(
    element,
    { opacity: 0, x: 60, filter: 'blur(4px)' },
    {
      opacity: 1, x: 0, filter: 'blur(0px)',
      duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: element, start: 'top 80%' },
      ...options,
    }
  );
};

export const animateCounter = (element: Element, target: number) => {
  const obj = { value: 0 };
  return gsap.to(obj, {
    value: target,
    duration: 2,
    ease: 'power2.out',
    scrollTrigger: { trigger: element, start: 'top 85%', once: true },
    onUpdate: () => { element.textContent = Math.round(obj.value) + '+'; },
  });
};
