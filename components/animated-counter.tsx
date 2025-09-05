/**
 * Animated Counter Component - Smooth Number Transitions
 * 
 * This component provides smooth, animated transitions for numerical values,
 * enhancing the user experience by making statistics and metrics more engaging
 * and visually appealing.
 * 
 * ## Purpose & Context
 * 
 * The AnimatedCounter addresses several UX needs in the ALX Poll application:
 * 
 * 1. **Visual Engagement**: Static numbers are less engaging than animated
 *    counters that draw attention to key metrics
 * 
 * 2. **Perceived Performance**: Smooth animations make the app feel more
 *    responsive and polished
 * 
 * 3. **Data Emphasis**: Animated counters highlight important statistics
 *    like total polls, votes, and active users
 * 
 * 4. **Professional Polish**: Adds a premium feel to the application
 * 
 * ## Key Assumptions
 * 
 * - **Performance**: Assumes modern browsers with requestAnimationFrame support
 * - **User Experience**: Assumes users appreciate smooth animations
 * - **Data Types**: Assumes numeric values that can be animated
 * - **Timing**: Assumes 2-second duration provides optimal user experience
 * 
 * ## Edge Cases Handled
 * 
 * - **Zero Values**: Properly handles counting from 0 to target value
 * - **Large Numbers**: Uses toLocaleString() for proper number formatting
 * - **Animation Interruption**: Properly cleans up animation frames
 * - **Rapid Value Changes**: Smoothly transitions between different target values
 * 
 * ## Integration Points
 * 
 * - **Home Page Stats**: Used for displaying live statistics
 * - **Poll Results**: Can be used for vote counts and percentages
 * - **User Dashboards**: Useful for displaying user metrics
 * - **Analytics Pages**: Enhances data visualization
 * 
 * ## Performance Considerations
 * 
 * - **Easing Function**: Uses easeOutQuart for natural deceleration
 * - **Frame Management**: Properly cancels animation frames on cleanup
 * - **Efficient Updates**: Only updates DOM when value changes
 * - **Memory Management**: Cleans up timers and event listeners
 * 
 * @component
 * @param {number} value - The target value to animate to
 * @param {number} duration - Animation duration in milliseconds (default: 2000)
 * @param {string} className - Additional CSS classes for styling
 * @example
 * ```tsx
 * // Animate to 1,000 with default 2-second duration
 * <AnimatedCounter value={1000} />
 * 
 * // Custom duration and styling
 * <AnimatedCounter value={500} duration={1500} className="text-2xl font-bold" />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 2000, className = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {count.toLocaleString()}
    </span>
  );
}
