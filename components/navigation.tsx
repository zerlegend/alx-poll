'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Polls', href: '/polls' },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-bold text-xl">ALX Poll</Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === item.href ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/polls/create">
                  <Button variant="outline">Create Poll</Button>
                </Link>
                <Dialog>
                  <DialogTrigger>
                    <Avatar className="cursor-pointer">
                      <AvatarImage src="" alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </DialogTrigger>
                  <DialogContent className="w-72">
                    <DialogTitle className="sr-only">User Menu</DialogTitle>
                    <div className="flex flex-col space-y-2 py-4">
                      <Link href="/profile">
                        <Button variant="ghost" className="w-full justify-start">Profile</Button>
                      </Link>
                      <Link href="/settings">
                        <Button variant="ghost" className="w-full justify-start">Settings</Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        Logout
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <Button 
              variant="ghost" 
              className="inline-flex items-center justify-center p-2 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${pathname === item.href ? 'border-primary text-primary-foreground bg-primary/10' : 'border-transparent text-muted-foreground hover:bg-muted hover:border-muted-foreground'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {user && (
              <Link
                href="/polls/create"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Poll
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/profile"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-500 hover:bg-red-50 hover:border-red-300"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  href="/auth/login"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}