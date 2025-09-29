"use client";
import React from "react";

export function SparklesAbout() {
    return (
        <div className="h-auto md:h-[40rem] px-4 sm:mx-10 w-full flex flex-col items-center justify-center overflow-hidden rounded-md py-16 md:py-0">
            <h1 className="md:text-7xl text-3xl lg:text-9xl font-bold text-center text-white relative z-20">
                KnotX
            </h1>
            <div className="w-full max-w-[40rem] h-28 md:h-40 relative mx-auto">
                {/* Gradients */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent h-[2px] w-3/4 blur-sm" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent h-px w-3/4" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent h-[5px] w-1/4 blur-sm" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent h-px w-1/4" />

                {/* Radial Gradient to prevent sharp edges - use closest-side so it scales on small screens */}
                <div
                    className="absolute inset-0 rounded-full w-full h-full pointer-events-none"
                    style={{
                        maskImage: 'radial-gradient(closest-side at top, transparent 20%, white)',
                        WebkitMaskImage: 'radial-gradient(closest-side at top, transparent 20%, white)'
                    }}
                />
            </div>
        </div>
    );
}
