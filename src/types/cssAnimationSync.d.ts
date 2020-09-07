declare module 'css-animation-sync' {
  export default class AnimationController {
    constructor(animationNames: string | string[]);

    /**
     * Stops synchronization of DOM elements using the animation
     */
    public free(): void;

    /**
     * Pause the animation of DOM elements using the animation
     */
    public pause(): void;

    /**
     * Stop the animation of DOM elements using the animation
     */
    public stop(): void;

    /**
     * Start/Resume the animation of DOM elements using the animation
     */
    public start(): void;
  };
};