import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "rectangular" | "circular" | "text";
}

const LoadingSkeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = "1em",
  variant = "rectangular",
}) => {
  const baseClasses = "animate-pulse bg-gray-200";

  const shapeClasses = {
    rectangular: "rounded-xl",
    circular: "rounded-full",
    text: "rounded-lg h-4",
  };

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${shapeClasses[variant]} ${className}`}
      style={style}
    />
  );
};

export default LoadingSkeleton;
