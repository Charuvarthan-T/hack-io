"use client";

import { useEffect, useState } from "react";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
}

export function AnimatedNumber({ value, duration = 1000 }: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        let animationFrameId: number;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function (easeOutExpo)
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setDisplayValue(Math.floor(easeProgress * value));

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(step);
            } else {
                setDisplayValue(value);
            }
        };

        animationFrameId = requestAnimationFrame(step);

        return () => cancelAnimationFrame(animationFrameId);
    }, [value, duration]);

    return <>{displayValue.toLocaleString()}</>;
}
