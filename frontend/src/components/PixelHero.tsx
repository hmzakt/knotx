'use client';
import PixelBlast from './ui/pixelBlast';
import React from 'react'
import {Button} from './ui/button';

export default function PixelHero() {
    return (
        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
            <PixelBlast
                variant="circle"
                pixelSize={6}
                color="#B19EEF"
                patternScale={3}
                patternDensity={1.2}
                pixelSizeJitter={0.5}
                enableRipples={true}
                liquid={false}
                speed={0.6}
                edgeFade={0.25}
                transparent
            />


            {/* Main Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-4">
                {/* Main Heading */}
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                    It's dangerous to go alone!
                </h1>

                {/* Subheading */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 drop-shadow-lg">
                    Take this.
                </h2>

                {/* Button Container */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {/* Get Started Button - Primary Style */}
                    <Button onClick={() => console.log('Clicked!')}>
                        Get Started
                    </Button>

                    {/* Learn More Button - Secondary Style */}
                    <Button onClick={() => console.log('Clicked!')}>
                        Learn More
                    </Button>
                </div>
            </div>
        </div>
    )
}

