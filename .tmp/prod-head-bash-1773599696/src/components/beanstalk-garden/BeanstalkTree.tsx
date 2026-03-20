"use client";

/**
 * BeanstalkTree - Extracted tree visualization layer
 * 
 * Trunk that tiles vertically and ground at bottom.
 * Used in UnifiedScrollJourney as separate z-layer (z-5).
 */

interface BeanstalkTreeProps {
  /** Total scene height in pixels */
  height: number;
  /** Optional custom trunk image path */
  trunkImagePath?: string;
  /** Optional custom ground image path */
  groundImagePath?: string;
}

export function BeanstalkTree({
  height,
  trunkImagePath = '/assets/garden/trunk.png',
  groundImagePath,
}: BeanstalkTreeProps) {
  return (
    <>
      {/* Trunk - tiles vertically */}
      <div
        className="bs-trunk"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '180px',
          height: `${height}px`,
          backgroundImage: `url('${trunkImagePath}')`,
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
          backgroundPosition: 'bottom center',
          zIndex: 20, // Changed from 5 to 20 (now visible above marketing)
        }}
      />

      {/* Ground - at bottom */}
      {groundImagePath && (
        <div
          className="bs-ground"
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120%',
            maxWidth: '800px',
            zIndex: 10,
          }}
        >
          <img
            src={groundImagePath}
            alt=""
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </div>
      )}
    </>
  );
}
