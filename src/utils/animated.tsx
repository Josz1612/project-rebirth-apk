import React, { useRef, useState, useEffect } from 'react';

/**
 * React Native Animated Primitives
 * Compatible with Animated.Value, Animated.timing, and Animated.View
 */
export class AnimatedValue {
  private _value: number;
  private _listeners: Map<number, (val: number) => void> = new Map();
  private _nextId = 0;

  constructor(initialValue: number) {
    this._value = initialValue;
  }

  getValue(): number {
    return this._value;
  }

  setValue(val: number): void {
    this._value = val;
    this._listeners.forEach((listener) => listener(val));
  }

  addListener(callback: (val: number) => void): number {
    const id = this._nextId++;
    this._listeners.set(id, callback);
    return id;
  }

  removeListener(id: number): void {
    this._listeners.delete(id);
  }
}

export interface TimingAnimationConfig {
  toValue: number;
  duration?: number;
  useNativeDriver?: boolean;
}

export type AnimatedViewStyle = Omit<React.CSSProperties, 'opacity'> & {
  opacity?: React.CSSProperties['opacity'] | AnimatedValue;
};

export interface AnimatedViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: AnimatedViewStyle;
  className?: string;
  children?: React.ReactNode;
}

export const Animated = {
  Value: AnimatedValue,

  timing: (value: AnimatedValue, config: TimingAnimationConfig) => {
    return {
      start: (callback?: (result: { finished: boolean }) => void) => {
        const startValue = value.getValue();
        const endValue = config.toValue;
        const duration = config.duration ?? 800;
        const startTime = performance.now();

        const tick = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(1, Math.max(0, elapsed / duration));
          // Cubic ease-in-out curve for cinematic smooth crossfade
          const eased =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const current = startValue + (endValue - startValue) * eased;
          value.setValue(current);

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            value.setValue(endValue);
            if (callback) {
              callback({ finished: true });
            }
          }
        };

        requestAnimationFrame(tick);
      },
    };
  },

  View: ({
    style,
    className,
    children,
    ...props
  }: AnimatedViewProps) => {
    const [dynamicStyles, setDynamicStyles] = useState<React.CSSProperties>({});
    const nodeRef = useRef<HTMLDivElement>(null);

    const resolvedStaticStyle: React.CSSProperties = {};
    if (style) {
      for (const [key, val] of Object.entries(style)) {
        (resolvedStaticStyle as Record<string, unknown>)[key] =
          val instanceof AnimatedValue ? val.getValue() : val;
      }
    }

    useEffect(() => {
      if (!style) return;

      const animatedProps: { prop: string; animVal: AnimatedValue }[] = [];
      const initialResolved: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(style)) {
        if (val instanceof AnimatedValue) {
          animatedProps.push({ prop: key, animVal: val });
          initialResolved[key] = val.getValue();
        } else {
          initialResolved[key] = val;
        }
      }

      setDynamicStyles(initialResolved as React.CSSProperties);

      if (animatedProps.length === 0) return;

      const listenerIds = animatedProps.map(({ prop, animVal }) => {
        return animVal.addListener((newVal) => {
          if (nodeRef.current && prop === 'opacity') {
            nodeRef.current.style.opacity = String(newVal);
          }
          setDynamicStyles((prev) => ({
            ...prev,
            [prop]: newVal,
          }));
        });
      });

      return () => {
        animatedProps.forEach(({ animVal }, i) => {
          animVal.removeListener(listenerIds[i]);
        });
      };
    }, [style]);

    return (
      <div
        ref={nodeRef}
        className={className}
        style={{ ...resolvedStaticStyle, ...dynamicStyles }}
        {...props}
      >
        {children}
      </div>
    );
  },
};
