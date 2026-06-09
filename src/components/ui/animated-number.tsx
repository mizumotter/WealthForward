import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
};

/**
 * Smoothly animating number display.
 * The value springs to the target with a natural feel.
 */
export function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString("ja-JP"),
  className,
  duration = 0.6,
}: Props) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration,
  });
  const display = useTransform(spring, (v) => format(Math.round(v)));
  const [text, setText] = useState(format(0));
  const prevValue = useRef(0);

  useEffect(() => {
    spring.set(value);
    prevValue.current = value;
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setText(v));
    return unsub;
  }, [display]);

  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <motion.span
      className={cn(
        "tabular-nums font-mono",
        isPositive && "text-positive",
        isNegative && "text-negative",
        className,
      )}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </motion.span>
  );
}
