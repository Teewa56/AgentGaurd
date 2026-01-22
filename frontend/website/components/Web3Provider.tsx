'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
    lightTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    mainnet,
    sepolia,
    base,
    baseSepolia,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";

import { http } from 'viem';

const config = getDefaultConfig({
    appName: 'AgentGuard',
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
    chains: [baseSepolia],
    transports: {
        [baseSepolia.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_URL!),
    },
    ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={lightTheme({
                    accentColor: '#2563eb',
                    accentColorForeground: 'white',
                    borderRadius: 'large',
                })}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
