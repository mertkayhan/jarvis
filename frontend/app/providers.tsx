// app/providers.jsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

interface ProvidersProps {
    children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
    const [queryClient] = useState(() => new QueryClient(
        {
            defaultOptions: {
                queries: {
                    // With SSR, we usually want to set some default staleTime
                    // above 0 to avoid refetching immediately on the client
                    staleTime: 60 * 1000,
                },
            }
        },
    ));

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}