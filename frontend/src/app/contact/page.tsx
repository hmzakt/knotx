'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Instagram, Linkedin, X } from 'lucide-react';
import emailjs from 'emailjs-com';

function ContactUs() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const contactEmail = 'mail2knotx@gmail.com';
    const contactPhone = '+917488830684';

    const emailjsPublicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_CONTACT; // user_id


    useEffect(() => {
        if (emailjsPublicKey) {
            try {
                emailjs.init(emailjsPublicKey);
            } catch (err) {
                console.error('EmailJS init error', err);
            }
        }
    }, [emailjsPublicKey]);

        const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('loading');

        emailjs.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_CONTACT!,
            'template_0ws5zl7',
            { email, message },
            process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_CONTACT!
        ).then(() => {
            setStatus('success');
            setEmail('');
            setMessage('');
        }).catch(() => {
            setStatus('error');
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 pt-36 relative">
            <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />
            <div className="max-w-2xl mx-auto p-4 relative z-10">
                <h1 className="text-lg md:text-7xl text-center font-sans font-bold mb-8 text-white">
                    Contact Us
                </h1>
                <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center">
                   Feel free to drop a message, whether you want to collaborate on this project further, or have doubts regarding services.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500 w-full p-4 bg-neutral-950 placeholder:text-neutral-700"
                        required
                    />
                    <textarea
                        name="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Your message"
                        className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500 w-full p-4 bg-neutral-950 placeholder:text-neutral-700"
                        rows={5}
                        required
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        aria-busy={status === 'loading'}
                        className={`px-6 py-2 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                            status === 'loading'
                                ? 'bg-teal-300 cursor-not-allowed'
                                : 'bg-teal-500 hover:bg-teal-600'
                        }`}
                    >
                        {status === 'loading' ? 'Sending...' : 'Send Message'}
                    </button>
                    {status === 'success' && (
                        <p className="text-green-500 text-center mt-2">Thanks! Your message has been sent.</p>
                    )}
                    {status === 'error' && (
                        <p className="text-red-500 text-center mt-2">Oops! Something went wrong.</p>
                    )}
                </form>
                {/* Connect and contact options */}
                <div className="mt-10 rounded-xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-sm p-5 sm:p-6">
                    <div className="text-center">
                        <h4 className="text-sm tracking-wide text-neutral-400 uppercase">Connect</h4>
                        <div className="mt-3 flex items-center justify-center gap-3">
                            <Button
                                size="icon"
                                className="h-9 w-9 rounded-lg border border-neutral-800 bg-transparent text-neutral-200 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                onClick={() => window.open('https://www.instagram.com/hmz_akt/', '_blank')}
                                aria-label="Instagram"
                            >
                                <Instagram className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                className="h-9 w-9 rounded-lg border border-neutral-800 bg-transparent text-neutral-200 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                onClick={() => window.open('https://x.com/hmz_akt', '_blank')}
                                aria-label="X"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                className="h-9 w-9 rounded-lg border border-neutral-800 bg-transparent text-neutral-200 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                onClick={() => window.open('https://www.linkedin.com/in/hmzakt/', '_blank')}
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-neutral-300 sm:grid-cols-3">
                        <a href={`mailto:${contactEmail}`} className="group flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition-colors px-3 py-2 cursor-pointer">
                            <Mail className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400" />
                            <span className="truncate">{contactEmail}</span>
                        </a>
                        <a
                            href={`tel:${contactPhone}`}
                            className="group flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition-colors px-3 py-2 cursor-pointer"
                            onClick={async (e) => {
                                try {
                                    await navigator.clipboard.writeText(contactPhone);
                                } catch (err) {
                                }
                            }}
                        >
                            <Phone className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400" />
                            <span className="truncate">{contactPhone}</span>
                        </a>
                        <div className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2">
                            <MapPin className="w-4 h-4 text-neutral-400" />
                            <span>Noida, India</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactUs;