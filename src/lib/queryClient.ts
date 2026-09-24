import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            gcTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false,
            networkMode: "always"
        },
    },
})