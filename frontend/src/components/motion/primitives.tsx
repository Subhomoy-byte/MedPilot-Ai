import React, { useRef, useEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
} from 'motion/react';

/* ============================================================
   Shared easing — a single premium curve so every reveal on the
   page decelerates identically. Matches the CSS cubic-bezier
   used for .card-lift transitions.
   ============================================================ */
export const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ============================================================
   Reveal — the workhorse scroll-triggered entrance.
   Fires once when ~18% of the element enters the viewport.
   ============================================================ */

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Which way the element travels in from. */
  direction?: RevealDirection;
  /** Travel distance in px. */
  distance?: number;
  delay?: number;
  duration?: number;
  /** Adds a subtle defocus→focus pass. Skip on text-heavy blocks. */
  blur?: boolean;
  as?: 'div' | 'section' | 'span' | 'li' | 'h2' | 'p';
}

const offsetFor = (direction: RevealDirection, distance: number) => {
  switch (direction) {
    case 'up': return { y: distance };
    case 'down': return { y: -distance };
    case 'left': return { x: distance };
    case 'right': return { x: -distance };
    default: return {};
  }
};

/* Explicit map rather than motion[as] — indexing the motion proxy with a
   union yields a union of component types that JSX can't call. */
const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  span: motion.span,
  li: motion.li,
  h2: motion.h2,
  p: motion.p,
};

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  direction = 'up',
  distance = 28,
  delay = 0,
  duration = 0.7,
  blur = false,
  as = 'div',
}) => {
  const Component = MOTION_TAGS[as] as typeof motion.div;

  return (
    <Component
      className={className}
      initial={{ opacity: 0, ...offsetFor(direction, distance), ...(blur ? { filter: 'blur(10px)' } : {}) }}
      whileInView={{ opacity: 1, x: 0, y: 0, ...(blur ? { filter: 'blur(0px)' } : {}) }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </Component>
  );
};

/* ============================================================
   Stagger — parent/child pair for cascading reveals.
   Wrap a group in <Stagger> and each direct child in <StaggerItem>.
   ============================================================ */

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  /** Gap between each child's start, in seconds. */
  gap?: number;
  delay?: number;
  amount?: number;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  className = '',
  gap = 0.09,
  delay = 0,
  amount = 0.15,
}) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount }}
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: gap, delayChildren: delay } },
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  distance?: number;
}> = ({ children, className = '', distance = 24 }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: distance },
      visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT_EXPO } },
    }}
  >
    {children}
  </motion.div>
);

/* ============================================================
   WordReveal — headline words rise and unblur in sequence.
   Reserved for the hero; too heavy to use on every heading.
   ============================================================ */

export const WordReveal: React.FC<{
  text: string;
  className?: string;
  /** Words at these indices get the animated gradient treatment. */
  accentFrom?: number;
  delay?: number;
}> = ({ text, className = '', accentFrom, delay = 0 }) => {
  const words = text.split(' ');

  return (
    <motion.h1
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.055, delayChildren: delay } },
      }}
    >
      {words.map((word, i) => {
        const isAccent = accentFrom !== undefined && i >= accentFrom;
        return (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <motion.span
              className={`inline-block ${isAccent ? 'text-gradient-violet' : ''}`}
              variants={{
                hidden: { y: '110%', opacity: 0, filter: 'blur(8px)' },
                visible: {
                  y: '0%',
                  opacity: 1,
                  filter: 'blur(0px)',
                  transition: { duration: 0.85, ease: EASE_OUT_EXPO },
                },
              }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 && <span>&nbsp;</span>}
          </span>
        );
      })}
    </motion.h1>
  );
};

/* ============================================================
   Parallax — scroll-linked vertical drift.
   `speed` > 0 moves slower than scroll (recedes);
   negative values move against it.
   ============================================================ */

export const Parallax: React.FC<{
  children: React.ReactNode;
  className?: string;
  speed?: number;
}> = ({ children, className = '', speed = 60 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  // Spring-smoothed so wheel/trackpad jitter doesn't telegraph into the transform.
  const y = useSpring(rawY, { stiffness: 90, damping: 26, restDelta: 0.001 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full">{children}</motion.div>
    </div>
  );
};

/* ============================================================
   ScrollProgress — hairline gradient bar pinned under the navbar.
   ============================================================ */

export const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
      style={{ scaleX }}
    />
  );
};

/* ============================================================
   Counter — animates a number up when it scrolls into view.
   ============================================================ */

export const Counter: React.FC<{
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}> = ({ to, decimals = 0, suffix = '', prefix = '', className = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const value = useMotionValue(0);
  const spring = useSpring(value, { stiffness: 55, damping: 20, restDelta: 0.01 });
  const [text, setText] = useState(`${prefix}${(0).toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (inView) value.set(to);
  }, [inView, to, value]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v: number) => {
      setText(`${prefix}${v.toFixed(decimals)}${suffix}`);
    });
    return unsubscribe;
  }, [spring, decimals, prefix, suffix]);

  return <span ref={ref} className={className}>{text}</span>;
};

/* ============================================================
   SpotlightCard — tracks the cursor and feeds --mx/--my to the
   CSS radial highlight in .spotlight-card.
   ============================================================ */

export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`spotlight-card ${className}`}
    >
      {children}
    </div>
  );
};

/* ============================================================
   ScrollScaleIn — panel grows and unblurs slightly as it enters.
   Used for the wide showcase panels.
   ============================================================ */

export const ScrollScaleIn: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.96, y: 30 }}
    whileInView={{ opacity: 1, scale: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
  >
    {children}
  </motion.div>
);
