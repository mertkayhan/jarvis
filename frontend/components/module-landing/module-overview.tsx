'use client'

import { config } from "@/app/cfg"
import Link from "next/link"

export function Overview() {
    return (
        <div className="w-full h-screen flex items-center justify-center">
            <section
                id="modules"
                className="w-full max-w-7xl mx-auto px-8 md:px-16 py-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-3xl shadow-xl"
            >
                {/* Section Title */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        Discover {config.welcomePage.name}
                    </h2>
                    <p className="text-base md:text-lg text-gray-300 mt-4 max-w-2xl mx-auto">
                        Unlock insights and dive deeper into our cutting-edge capabilities with these powerful modules.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    {config.modules.map((m, i) => {
                        return (
                            <Link
                                key={i}
                                href={m.path}
                                className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-25 rounded-2xl"></div>
                                <h3 className="text-md md:text-2xl font-bold text-white">{m.name}</h3>
                                <p className="text-gray-400 mt-2 text-sm md:text-base">{m.description}</p>
                            </Link>
                        );
                    })}
                </div>
            </section>
        </div>
    )
}