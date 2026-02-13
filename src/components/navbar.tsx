import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Rocket } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from './ui/button'
import ClawNADLogo from '@/assets/logo.png'
import { MONAD_ICON_URL } from '@/wagmi'

const connectButtonClass =
  'bg-primary uppercase text-primary-foreground hover:bg-primary/60 ring-offset-background focus-visible:ring-ring inline-flex h-[36px] cursor-pointer items-center text-xs justify-center gap-2 px-2 py-[10.5px] font-semibold text-nowrap transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 disabled:bg-[#82360B] disabled:text-[#471903]'

const NAV_LINKS = [
  { label: 'Agents', to: '/agents' },
  { label: 'Activity', to: '/activity' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="bg-background border-b sticky w-full min-h-[60px] text-white px-4 lg:px-6 py-3 flex items-center justify-between gap-2 z-[998] transition-colors duration-300 border-b-base-border top-0">
      <div className="flex items-center min-w-0 lg:space-x-8 flex-1">
        <Link to="/" className="flex items-center min-w-0 shrink-0">
          <img src={ClawNADLogo} alt="logo" className="w-10 h-10 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-semibold truncate ml-2">ClawNAD</h1>
        </Link>
        <div className="hidden md:flex items-center space-x-6 text-xs uppercase font-semibold shrink-0">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={i}
              to={link.to}
              className="cursor-pointer uppercase font-semibold text-xs hover:text-primary transition-all duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            if (!mounted) {
              return (
                <Button className={connectButtonClass} disabled>
                  Connect Wallet
                </Button>
              )
            }
            if (!account || !chain) {
              return (
                <Button className={connectButtonClass} onClick={openConnectModal} type="button">
                  Connect Wallet
                </Button>
              )
            }
            return (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  className="border border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 uppercase text-xs font-semibold h-[36px] px-3 gap-2 inline-flex items-center justify-center transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none [&_svg]:shrink-0"
                  onClick={() => navigate('/launch')}
                >
                  <Rocket className="w-4 h-4" />
                  Launch Agent
                </Button>
                <Button
                  className={`${connectButtonClass} bg-primary/50 border-primary/50 text-primary-foreground hover:bg-primary/60`}
                  onClick={openChainModal}
                  type="button"
                >
                  {(chain?.id === 143 ? MONAD_ICON_URL : chain?.iconUrl) && (
                    <img
                      alt={chain?.name ?? 'Chain'}
                      src={chain?.id === 143 ? MONAD_ICON_URL : chain?.iconUrl}
                      className="w-4 h-4 rounded-full shrink-0"
                    />
                  )}
                  {chain.name}
                </Button>
                <Button className={connectButtonClass} onClick={openAccountModal} type="button">
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ''}
                </Button>
              </div>
            )
          }}
        </ConnectButton.Custom>
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden p-2 -m-2 text-foreground hover:text-primary outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[997] bg-black/50 md:hidden" aria-hidden onClick={() => setMenuOpen(false)} />
          <div className="fixed top-[60px] left-0 right-0 z-[998] bg-background border-b border-border shadow-lg md:hidden">
            <div className="p-4 flex flex-col gap-2">
              {NAV_LINKS.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className="text-left py-2 px-3 text-sm uppercase font-semibold text-foreground hover:text-primary hover:bg-accent transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
