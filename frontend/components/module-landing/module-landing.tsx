'use client'

import { Sidebar } from '@/components/sidebar/chat-sidebar';
import Link from 'next/link';
import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import Loading from "@/app/loading"

interface LandingPageProps {
    title: string
    moduleName: string
}

export default function LandingPage({ title, moduleName }: LandingPageProps) {
    const [highlight, setHighlight] = useState(false);
    const { user, error, isLoading } = useUser();

    if (isLoading) {
        return (
            <Loading />
        )
    }

    return (
        <>
            <title>{title}</title>
            <div>
                <div className="z-0 relative flex h-screen overflow-hidden">
                    <Sidebar
                        highlight={highlight}
                        showChatList={false}
                        moduleName={moduleName}
                        userId={user?.email as string}
                        showModelSelection={false}
                    />
                    <div className="group w-full overflow-auto pl-0 animate-in duration-300 ease-in-out peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
                        <div
                            className="w-full h-screen flex items-center justify-center"
                            style={{
                                background:
                                    "radial-gradient(circle, rgba(29, 78, 216, 0.4) 0%, rgba(91, 33, 182, 0.6) 40%, rgba(0, 0, 0, 0.9) 80%, rgba(0, 0, 0, 1) 100%)",
                            }}
                        >
                            <div className="text-center">
                                <h1 className="text-3xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                    Welcome to {title}!
                                </h1>
                                <p className="mt-4 text-sm md:text-xl text-gray-300 max-w-2xl mx-auto">
                                    Select a module from the <b>sidebar</b> to begin your journey.
                                </p>
                                <div className="mt-8 md:flex justify-center space-x-4">
                                    <a
                                        href='/chat'
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs md:text-base font-medium rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                                    >
                                        Get Started
                                    </a>
                                    <Link
                                        href="/user-guides"
                                        className="px-6 py-3 bg-gray-800 text-white text-xs md:text-base font-medium rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-all duration-300">
                                        Learn More
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}


