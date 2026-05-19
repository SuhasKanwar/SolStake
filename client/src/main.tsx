import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PROVIDER_URL } from './lib/config.ts'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Buffer } from 'buffer'

const globalWithBuffer = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer
}

if (!globalWithBuffer.Buffer) {
  globalWithBuffer.Buffer = Buffer
}

const wallets = [new PhantomWalletAdapter()]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionProvider endpoint={PROVIDER_URL} >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
)
