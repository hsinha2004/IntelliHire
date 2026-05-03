import React from 'react';
import ErrorBoundary from './ErrorBoundary';

const Hero3DScene = () => {
  return (
    <div className="w-full h-full min-h-[500px] relative pointer-events-auto rounded-xl overflow-hidden">
      <ErrorBoundary>
        <iframe 
          src="https://my.spline.design/spline3dstarterfile-kvXBazflWm2d4NVuwGzfYLeD/" 
          frameBorder="0" 
          width="100%" 
          height="100%" 
          title="3D Hero Spline Scene"
          style={{ border: "none" }}
        />
      </ErrorBoundary>
    </div>
  );
};

export default Hero3DScene;
