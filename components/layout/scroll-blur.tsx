"use client";

/**
 * Static depth-of-field effect: subtle backdrop blur at the extreme
 * top and bottom of the viewport, clear in the middle.
 */
export function ScrollBlur() {
  return (
    <>
      {/* Top Blur */}
      <div
        className="fixed top-0 left-0 right-0 h-32 z-40 pointer-events-none backdrop-blur-[2px]"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      />

      {/* Bottom Blur */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 z-40 pointer-events-none backdrop-blur-[2px]"
        style={{
          maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, transparent 100%)",
        }}
      />
    </>
  );
}
