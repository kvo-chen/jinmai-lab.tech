import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1em',
  className = '',
  variant = 'rect',
  animate = true,
}) => {
  return (
    <div
      className={clsx(
        'bg-gray-200 dark:bg-gray-700',
        variant === 'circle' ? 'rounded-full' : '',
        variant === 'rect' ? 'rounded-md' : '',
        variant === 'text' ? 'rounded-sm' : '',
        animate ? 'animate-pulse' : '',
        className
      )}
      style={{
        width,
        height,
      }}
    />
  );
};

interface SkeletonScreenProps {
  type?: 'work' | 'user' | 'community' | 'game' | 'activity' | 'card';
  className?: string;
}

const SkeletonScreen: React.FC<SkeletonScreenProps> = ({ type = 'card', className = '' }) => {
  const renderWorkSkeleton = () => (
    <div className={`space-y-4 p-4 ${className}`}>
      <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="space-y-2">
        <Skeleton width="80%" height="1.5em" variant="text" />
        <Skeleton width="100%" height="1em" variant="text" />
        <Skeleton width="60%" height="1em" variant="text" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton width="40px" height="40px" variant="circle" />
        <div className="space-y-1 flex-1">
          <Skeleton width="60%" height="1em" variant="text" />
          <Skeleton width="40%" height="0.8em" variant="text" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="80px" height="32px" variant="rect" />
        ))}
      </div>
    </div>
  );

  const renderUserSkeleton = () => (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      <Skeleton width="60px" height="60px" variant="circle" />
      <div className="space-y-1 flex-1">
        <Skeleton width="60%" height="1.2em" variant="text" />
        <Skeleton width="40%" height="1em" variant="text" />
      </div>
      <Skeleton width="80px" height="36px" variant="rect" />
    </div>
  );

  const renderCommunitySkeleton = () => (
    <div className={`space-y-4 p-4 ${className}`}>
      <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="space-y-2">
        <Skeleton width="80%" height="1.5em" variant="text" />
        <Skeleton width="100%" height="1em" variant="text" />
        <Skeleton width="60%" height="1em" variant="text" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width="40px" height="40px" variant="circle" />
        ))}
      </div>
    </div>
  );

  const renderGameSkeleton = () => (
    <div className={`space-y-4 p-4 ${className}`}>
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="space-y-2">
        <Skeleton width="80%" height="1.2em" variant="text" />
        <Skeleton width="60%" height="1em" variant="text" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton width="60px" height="24px" variant="rect" />
        <Skeleton width="60px" height="24px" variant="rect" />
      </div>
    </div>
  );

  const renderActivitySkeleton = () => (
    <div className={`space-y-4 p-4 ${className}`}>
      <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="space-y-2">
        <Skeleton width="80%" height="1.5em" variant="text" />
        <Skeleton width="100%" height="1em" variant="text" />
        <Skeleton width="100%" height="1em" variant="text" />
        <Skeleton width="60%" height="1em" variant="text" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="100px" height="32px" variant="rect" />
        ))}
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className={`space-y-3 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton width="48px" height="48px" variant="circle" />
        <div className="space-y-1 flex-1">
          <Skeleton width="60%" height="1em" variant="text" />
          <Skeleton width="40%" height="0.8em" variant="text" />
        </div>
      </div>
      <Skeleton width="100%" height="1em" variant="text" />
      <Skeleton width="90%" height="1em" variant="text" />
      <Skeleton width="70%" height="1em" variant="text" />
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      <div className="flex justify-between">
        <Skeleton width="80px" height="32px" variant="rect" />
        <Skeleton width="80px" height="32px" variant="rect" />
      </div>
    </div>
  );

  switch (type) {
    case 'work':
      return renderWorkSkeleton();
    case 'user':
      return renderUserSkeleton();
    case 'community':
      return renderCommunitySkeleton();
    case 'game':
      return renderGameSkeleton();
    case 'activity':
      return renderActivitySkeleton();
    default:
      return renderCardSkeleton();
  }
};

export default SkeletonScreen;
