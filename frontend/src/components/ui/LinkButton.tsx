'use client';

import React from 'react';
import Link from 'next/link';

interface LinkButtonProps {
  text: string;
  href: string;
  className?: string;
  disabled?: boolean;
  showIcon?: boolean;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  text,
  href,
  className = '',
  disabled = false,
  showIcon = true
}) => {
  const baseClasses = `
    flex items-center justify-center gap-2 px-4 py-2 mx-auto text-lg
    bg-gray-50 shadow-xl backdrop-blur-md border-2 border-gray-50 rounded-full
    relative overflow-hidden z-10 group lg:font-semibold
    before:absolute before:w-full before:-left-full before:aspect-square
    before:rounded-full before:bg-emerald-500 before:transition-all before:duration-700
    before:hover:left-0 before:hover:w-full before:hover:scale-150
    hover:text-gray-50
  `;

  const combinedClasses = `${baseClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  if (disabled) {
    return (
      <span className={combinedClasses}>
        {text}
        {showIcon && <ArrowIcon />}
      </span>
    );
  }

  return (
    <Link href={href} className={combinedClasses}>
      {text}
      {showIcon && <ArrowIcon />}
    </Link>
  );
};

const ArrowIcon = () => (
  <svg
    className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90"
    viewBox="0 0 16 19"
  >
    <path
      d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311..."
      className="fill-gray-800 group-hover:fill-gray-800"
    />
  </svg>
);

export default LinkButton;